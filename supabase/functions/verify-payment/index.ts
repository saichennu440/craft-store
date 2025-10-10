// verify-payment/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey, X-VERIFY",
};

let TOKEN_CACHE: { token?: string; expiresAt?: number } = {};

async function fetchPhonePeToken() {
  if (TOKEN_CACHE.token && TOKEN_CACHE.expiresAt && Date.now() < TOKEN_CACHE.expiresAt - 5000) {
    return { ok: true, token: TOKEN_CACHE.token, cached: true };
  }

  const phonepeBase = Deno.env.get("PHONEPE_BASE_URL") ?? "https://api.phonepe.com/apis/pg";
  const explicitAuthUrl = Deno.env.get("PHONEPE_AUTH_URL") ?? "";
  const candidateUrls: string[] = [];
  if (explicitAuthUrl) candidateUrls.push(explicitAuthUrl);
  candidateUrls.push("https://api.phonepe.com/apis/identity-manager/v1/oauth/token");
  candidateUrls.push("https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token");
  candidateUrls.push(`${phonepeBase.replace(/\/$/, "")}/v1/oauth/token`);

  const clientId = Deno.env.get("PHONEPE_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("PHONEPE_CLIENT_SECRET") ?? "";
  const clientVersion = Deno.env.get("PHONEPE_CLIENT_VERSION") ?? "1.0";
  const attempts: any[] = [];

  if (!clientId || !clientSecret) return { ok: false, error: "PHONEPE_CLIENT_ID or PHONEPE_CLIENT_SECRET missing" };

  for (const url of candidateUrls) {
    try {
      const params = new URLSearchParams();
      params.set("client_id", clientId);
      params.set("client_secret", clientSecret);
      params.set("client_version", clientVersion);
      params.set("grant_type", "client_credentials");

      const resp = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString() });
      const text = await resp.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : {}; } catch { json = { rawText: text } }

      attempts.push({ url, status: resp.status, ok: resp.ok, body: json || text });

      if (!resp.ok) continue;

      const token = json?.access_token || json?.accessToken || json?.token || json?.data?.access_token || json?.data?.token;
      const expiresIn = json?.expires_in || json?.expiresIn || json?.data?.expires_in || 1800;
      if (token) {
        TOKEN_CACHE.token = token;
        TOKEN_CACHE.expiresAt = Date.now() + Number(expiresIn) * 1000;
        return { ok: true, token, attempts };
      }
    } catch (err: any) {
      attempts.push({ url, error: err?.message || String(err) });
    }
  }
  return { ok: false, error: "Failed to fetch token", attempts };
}

async function sha256Hex(input: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const arr = Array.from(new Uint8Array(hashBuffer));
  return arr.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log("=== VERIFY PAYMENT STARTED ===");
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // Get transactionId from query or body
    const url = new URL(req.url);
    let transactionId = url.searchParams.get("transactionId");
    if (!transactionId) {
      const raw = await req.text();
      try { const parsed = raw ? JSON.parse(raw) : {}; transactionId = parsed.transactionId || transactionId; } catch {}
    }
    if (!transactionId) return new Response(JSON.stringify({ success: false, error: "transactionId is required" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders }});

    const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID") ?? "";
    const saltKey = Deno.env.get("PHONEPE_SALT_KEY") ?? Deno.env.get("PHONEPE_SECRET") ?? Deno.env.get("PHONEPE_SALT") ?? "";
    const saltIndex = Deno.env.get("PHONEPE_SALT_INDEX") ?? "1";
    const environment = (Deno.env.get("PHONEPE_ENV") ?? "sandbox").toLowerCase();

    if (!merchantId) return new Response(JSON.stringify({ success: false, error: "PHONEPE_MERCHANT_ID not set" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }});
    if (!saltKey) return new Response(JSON.stringify({ success: false, error: "PHONEPE_SALT_KEY (merchant salt) is not set" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }});

    // If sandbox/testing mode - simulate success
    if (["sandbox","development","test"].includes(environment)) {
      await supabase.from("payments").update({ status: "success" }).eq("provider_payment_id", transactionId);
      return new Response(JSON.stringify({ success: true, status: "SUCCESS", message: "Test mode verified" }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders }});
    }

    // Lookup payment row to obtain the merchantOrderId (order_id) which PhonePe expects in status path
    let merchantOrderId: string | null = null;
    try {
      const { data: paymentRow, error: fetchErr } = await supabase
        .from("payments")
        .select("order_id")
        .eq("provider_payment_id", transactionId)
        .single();

      if (fetchErr) {
        console.warn("Could not fetch payment row for transactionId:", transactionId, fetchErr);
      } else if (paymentRow?.order_id) {
        merchantOrderId = paymentRow.order_id;
      }
    } catch (e) {
      console.warn("Payment lookup failed:", e);
    }

    // Build candidate status paths:
    // Primary (per docs): /checkout/v2/order/{merchantOrderId}/status
    // Fallback older style: /pg/v1/status/{merchantId}/{transactionId}
    const phonepeBase = Deno.env.get("PHONEPE_BASE_URL") ?? "https://api.phonepe.com/apis/pg";
    const statusCandidates: string[] = [];
    if (merchantOrderId) {
      statusCandidates.push((Deno.env.get("PHONEPE_STATUS_PREFIX") ?? "/checkout/v2/order") + `/${merchantOrderId}/status`);
    } else {
      // If merchantOrderId not found, still try with transactionId fallback (older style)
      console.warn("merchantOrderId not found for transactionId, will try fallback style only.");
    }
    statusCandidates.push((Deno.env.get("PHONEPE_STATUS_ALT") ?? "/pg/v1/status") + `/${merchantId}/${transactionId}`);

    // get token
    const tokenRes = await fetchPhonePeToken();
    console.log("Token fetch result (verify):", tokenRes);
    if (!tokenRes.ok || !tokenRes.token) {
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch PhonePe auth token", tokenResult: tokenRes }), { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders }});
    }
    const authToken = tokenRes.token;

    const attempts: any[] = [];
    for (const path of statusCandidates) {
      const stringToHash = path + saltKey;
      const signatureHex = await sha256Hex(stringToHash);
      const signature = signatureHex + "###" + saltIndex;

      const resp = await fetch(`${phonepeBase}${path}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": signature,
          "X-MERCHANT-ID": merchantId,
          "Authorization": `O-Bearer ${authToken}`,
          "accept": "application/json"
        }
      });

      const text = await resp.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : {}; } catch { json = { rawText: text } }
      attempts.push({ path, status: resp.status, ok: resp.ok, body: json || text });

      if (resp.ok) {
        // Interpret status response
        const paymentSuccess = !!(json?.success && json?.data && (json.data.state === "COMPLETED" || json.data.state === "SUCCESS"));
        const newStatus = paymentSuccess ? "success" : "failed";

        // Update payments table
        const { error: updateError } = await supabase.from("payments").update({ status: newStatus }).eq("provider_payment_id", transactionId);
        if (updateError) {
          console.error("Failed to update payment status:", updateError);
        }

        // If success, update order to paid
        if (paymentSuccess) {
          try {
            const { data: payment } = await supabase.from("payments").select("order_id").eq("provider_payment_id", transactionId).single().catch(()=>({ data: null }));
            if (payment?.order_id) {
              const { error: orderError } = await supabase.from("orders").update({ status: "paid" }).eq("id", payment.order_id);
              if (orderError) console.error("Order update error:", orderError);
            }
          } catch (e) {
            console.error("Order lookup/update error:", e);
          }
        }

        return new Response(JSON.stringify({ success: paymentSuccess, status: paymentSuccess? "SUCCESS" : "FAILED", attempts }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders }});
      }
    }

    // None succeeded
    return new Response(JSON.stringify({ success: false, error: "PhonePe status check failed (all attempts)", attempts }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders }});
  } catch (err: any) {
    console.error("verify-payment fatal:", err);
    return new Response(JSON.stringify({ success: false, error: err?.message || "internal error", stack: err?.stack }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }});
  }
});

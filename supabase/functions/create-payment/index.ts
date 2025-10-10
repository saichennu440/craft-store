// create-payment/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey, X-VERIFY",
};

interface PaymentRequest {
  orderId: string;
  amount: number | string;
  phone: string;
  callbackUrl: string;
}

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

  if (!clientId || !clientSecret) {
    return { ok: false, error: "PHONEPE_CLIENT_ID or PHONEPE_CLIENT_SECRET missing" };
  }

  const attempts: any[] = [];
  for (const url of candidateUrls) {
    try {
      const params = new URLSearchParams();
      params.set("client_id", clientId);
      params.set("client_secret", clientSecret);
      params.set("client_version", clientVersion);
      params.set("grant_type", "client_credentials");

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const text = await resp.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : {}; } catch { json = { rawText: text }; }

      attempts.push({ url, status: resp.status, ok: resp.ok, body: json || text });

      if (!resp.ok) continue;

      const token = json?.access_token || json?.accessToken || json?.token || json?.data?.access_token || json?.data?.token;
      const expiresIn = json?.expires_in || json?.expiresIn || json?.data?.expires_in || 1800;
      if (token) {
        TOKEN_CACHE.token = token;
        TOKEN_CACHE.expiresAt = Date.now() + Number(expiresIn) * 1000;
        return { ok: true, token, attempts, cached: false };
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
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log("=== CREATE PAYMENT STARTED ===");
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const text = await req.text();
    let payload: PaymentRequest;
    try { payload = text ? JSON.parse(text) : {}; } catch {
      return new Response(JSON.stringify({ success: false, error: "Invalid JSON body" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders }});
    }

    const { orderId, amount: rawAmount, phone, callbackUrl } = payload ?? {};
    if (!orderId || rawAmount == null || !phone || !callbackUrl) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields: orderId, amount, phone, callbackUrl" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders }});
    }

    const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID") ?? "";
    const saltKey = Deno.env.get("PHONEPE_SALT_KEY") ?? Deno.env.get("PHONEPE_SECRET") ?? Deno.env.get("PHONEPE_SALT") ?? "";
    const saltIndex = Deno.env.get("PHONEPE_SALT_INDEX") ?? "1";
    const environment = (Deno.env.get("PHONEPE_ENV") ?? "sandbox").toLowerCase();

    if (!merchantId) return new Response(JSON.stringify({ success: false, error: "PHONEPE_MERCHANT_ID not set" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }});
    if (!saltKey) console.warn("PHONEPE_SALT_KEY not set (only required for legacy endpoints)");

    const amountNumber = Number(rawAmount);
    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      return new Response(JSON.stringify({ success: false, error: "Invalid amount" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders }});
    }
    const amountPaise = Math.round(amountNumber * 100);

    // create internal transaction ID and save
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;

    const { error: dbError } = await supabase.from("payments").insert({
      order_id: orderId,
      provider: "phonepe",
      provider_payment_id: transactionId,
      amount: amountNumber,
      status: "pending",
      phone
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      return new Response(JSON.stringify({ success: false, error: "DB insert failed", details: dbError }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }});
    }

    if (["sandbox","development","test"].includes(environment)) {
      const mockUrl = `${callbackUrl}/payment/success?transactionId=${transactionId}&status=SUCCESS`;
      return new Response(JSON.stringify({ success: true, paymentUrl: mockUrl, transactionId, message: "test-mode" }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders }});
    }

    // production (v2) path and fallback
    const phonepeBase = Deno.env.get("PHONEPE_BASE_URL") ?? "https://api.phonepe.com/apis/pg";
    const primaryPath = Deno.env.get("PHONEPE_PAY_PATH") ?? "/checkout/v2/pay";
    const fallbackPath = Deno.env.get("PHONEPE_PAY_FALLBACK") ?? "/pg/v1/pay"; // legacy if you need

    // require https origin for production
    if (environment === "production" && !/^https:\/\//i.test(callbackUrl)) {
      return new Response(JSON.stringify({ success: false, error: "In production callbackUrl must be https:// origin" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders }});
    }

    // Normalize mobile — add Indian country code if 10-digit number provided
    let mobileNumber = phone?.toString().trim();
    if (/^[6-9]\d{9}$/.test(mobileNumber)) {
      mobileNumber = `91${mobileNumber}`;
    }

    // fetch OAuth token (v2)
    const tokenRes = await fetchPhonePeToken();
    console.log("Token fetch result:", tokenRes);
    if (!tokenRes.ok || !tokenRes.token) {
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch PhonePe auth token", tokenResult: tokenRes }), { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders }});
    }
    const authToken = tokenRes.token;

    // For checkout/v2/pay: PhonePe expects plain JSON body (not base64 + X-VERIFY)
    async function callV2Pay(path: string) {
      // v2 payload shape — follow Postman / docs
      const payloadObj = {
        merchantOrderId: orderId,
        amount: amountPaise,
        // optional fields often expected
        expireAfter: 3600,
        paymentFlow: {
          type: "PG_CHECKOUT",
          merchantUrls: {
            redirectUrl: `${callbackUrl}/payment/success?transactionId=${transactionId}`
          }
        },
        metaInfo: {
          merchantTransactionId: transactionId,
          merchantUserId: `USER_${Date.now()}`,
          mobileNumber
        }
      };

      const resp = await fetch(`${phonepeBase}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `O-Bearer ${authToken}`,
          // X-MERCHANT-ID is optional for v2 (doc examples don't require it), safe to include
          "X-MERCHANT-ID": merchantId,
          "accept": "application/json"
        },
        body: JSON.stringify(payloadObj)
      });

      const text = await resp.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : {}; } catch { json = { rawText: text }; }

      return { ok: resp.ok, status: resp.status, json, raw: text, requestPayload: payloadObj };
    }

    // Legacy: base64 + X-VERIFY approach (only call if primary is legacy or fallback)
    async function callLegacyPay(path: string) {
      const payloadObj = {
        merchantOrderId: orderId,
        merchantId,
        merchantTransactionId: transactionId,
        merchantUserId: `USER_${Date.now()}`,
        amount: amountPaise,
        redirectUrl: `${callbackUrl}/payment/success?transactionId=${transactionId}`,
        redirectMode: "REDIRECT",
        callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/verify-payment?transactionId=${transactionId}`,
        mobileNumber,
        paymentInstrument: { type: "PAY_PAGE" }
      };

      const payloadString = JSON.stringify(payloadObj);
      const payloadBase64 = typeof btoa === "function" ? btoa(payloadString) : Buffer.from(payloadString).toString("base64");

      const stringToHash = payloadBase64 + path + saltKey;
      const signatureHex = await sha256Hex(stringToHash);
      const signature = signatureHex + "###" + saltIndex;

      const resp = await fetch(`${phonepeBase}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": signature,
          "X-MERCHANT-ID": merchantId,
          "Authorization": `O-Bearer ${authToken}`,
          "accept": "application/json"
        },
        body: JSON.stringify({ request: payloadBase64 })
      });

      const text = await resp.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : {}; } catch { json = { rawText: text }; }
      return { ok: resp.ok, status: resp.status, json, raw: text, requestPayload: payloadObj };
    }

    // First try v2 plain JSON if primaryPath includes 'checkout/v2'
    let firstAttempt;
    if (primaryPath.includes("/checkout/v2")) {
      firstAttempt = await callV2Pay(primaryPath);
      console.log("PhonePe v2 primary attempt:", { path: primaryPath, status: firstAttempt.status, ok: firstAttempt.ok, body: firstAttempt.json || firstAttempt.raw, requestPayload: firstAttempt.requestPayload });
    } else {
      // primary was configured as legacy
      firstAttempt = await callLegacyPay(primaryPath);
      console.log("PhonePe legacy primary attempt:", { path: primaryPath, status: firstAttempt.status, ok: firstAttempt.ok, body: firstAttempt.json || firstAttempt.raw, requestPayload: firstAttempt.requestPayload });
    }

    // If v2 succeeded and returned redirect / redirectUrl or instrumentResponse, return it
    if (firstAttempt.ok && (firstAttempt.json?.redirectUrl || firstAttempt.json?.data?.instrumentResponse?.redirectInfo?.url)) {
      const redirectUrl = firstAttempt.json?.redirectUrl || firstAttempt.json?.data?.instrumentResponse?.redirectInfo?.url;
      return new Response(JSON.stringify({ success: true, paymentUrl: redirectUrl, transactionId, usedPath: primaryPath }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders }});
    }

    // If primary was v2 and failed with 404, try fallback legacy
    if (firstAttempt.status === 404 && fallbackPath) {
      const secondAttempt = await callLegacyPay(fallbackPath);
      console.log("PhonePe fallback legacy attempt:", { path: fallbackPath, status: secondAttempt.status, ok: secondAttempt.ok, body: secondAttempt.json || secondAttempt.raw, requestPayload: secondAttempt.requestPayload });

      if (secondAttempt.ok && secondAttempt.json?.data?.instrumentResponse?.redirectInfo?.url) {
        return new Response(JSON.stringify({ success: true, paymentUrl: secondAttempt.json.data.instrumentResponse.redirectInfo.url, transactionId, usedPath: fallbackPath }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders }});
      }

      return new Response(JSON.stringify({ success: false, error: "PhonePe API request failed (both endpoints)", attempts: [{ path: primaryPath, status: firstAttempt.status, body: firstAttempt.json || firstAttempt.raw }, { path: fallbackPath, status: secondAttempt.status, body: secondAttempt.json || secondAttempt.raw }] }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders }});
    }

    // Otherwise return the primary attempt failure with details (this helps debugging)
    return new Response(JSON.stringify({ success: false, error: `PhonePe API request failed: ${firstAttempt.status}`, attempt: { path: primaryPath, status: firstAttempt.status, body: firstAttempt.json || firstAttempt.raw, requestPayload: firstAttempt.requestPayload } }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders }});

  } catch (err: any) {
    console.error("create-payment fatal:", err);
    return new Response(JSON.stringify({ success: false, error: err?.message || "internal error", stack: err?.stack }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }});
  }
});

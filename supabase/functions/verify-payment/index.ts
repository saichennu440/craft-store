// verify-payment/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey, X-VERIFY",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log("=== VERIFY PAYMENT FUNCTION STARTED ===");
    console.log("Method:", req.method, "URL:", req.url);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("- SUPABASE_URL:", (Deno.env.get("SUPABASE_URL") || "").substring(0, 30) + "...");
    console.log("- PHONEPE_ENV:", Deno.env.get("PHONEPE_ENV"));
    console.log("- PHONEPE_MERCHANT_ID:", Deno.env.get("PHONEPE_MERCHANT_ID") ? "[SET]" : "[MISSING]");
    console.log("- PHONEPE_SECRET exists:", !!Deno.env.get("PHONEPE_SECRET"));

    // transactionId may be in query param or in JSON body
    const url = new URL(req.url);
    let transactionId = url.searchParams.get("transactionId");

    if (!transactionId) {
      // try body
      const bodyText = await req.text();
      if (bodyText) {
        try {
          const b = JSON.parse(bodyText);
          transactionId = b?.transactionId || transactionId;
        } catch {
          // ignore
        }
      }
    }

    if (!transactionId) {
      return new Response(JSON.stringify({ success: false, error: "transactionId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID") ?? "";
    const saltKey = Deno.env.get("PHONEPE_SECRET") ?? "";
    const saltIndex = Deno.env.get("PHONEPE_SALT_INDEX") ?? "1";
    const environment = (Deno.env.get("PHONEPE_ENV") || "sandbox").toLowerCase();

    if (!merchantId || !saltKey) {
      return new Response(JSON.stringify({ success: false, error: "PhonePe env vars missing on server" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const isTestMode = ["sandbox", "development", "test"].includes(environment);
    console.log("Using test mode?", isTestMode);

    if (isTestMode) {
      // Simulate success and update DB
      const { error: updateError } = await supabase.from("payments").update({ status: "success" }).eq("provider_payment_id", transactionId);
      if (updateError) console.error("DB update error (test):", updateError);
      return new Response(JSON.stringify({ success: true, status: "SUCCESS", message: "Verified (test mode)" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Production: configurable
    const phonepeBase = Deno.env.get("PHONEPE_BASE_URL") ?? "https://api.phonepe.com/apis/pg";
    const statusPrefix = Deno.env.get("PHONEPE_STATUS_PREFIX") ?? "/v1/status"; // will be used as /v1/status/{merchantId}/{transactionId}
    const statusEndpointPath = `${statusPrefix}/${merchantId}/${transactionId}`; // e.g. /v1/status/<merchant>/<txn>

    // signature for status: endpointPath + saltKey
    const stringToHash = statusEndpointPath + saltKey;
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToHash);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('') + "###" + saltIndex;

    console.log("Calling PhonePe status:", phonepeBase + statusEndpointPath);

    const statusResponse = await fetch(`${phonepeBase}${statusEndpointPath}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": signature,
        "X-MERCHANT-ID": merchantId,
        "accept": "application/json"
      }
    });

    console.log("PhonePe status response code:", statusResponse.status);
    const responseText = await statusResponse.text();
    console.log("PhonePe status raw:", responseText);

    let statusData;
    try {
      statusData = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("Failed to parse PhonePe status response:", parseErr);
      return new Response(JSON.stringify({ success: false, error: "Invalid response from PhonePe", details: responseText }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("PhonePe status parsed:", statusData);

    if (!statusResponse.ok) {
      console.error("PhonePe returned non-ok status for verification:", statusData);
      // update payments table to failed
      await supabase.from("payments").update({ status: "failed" }).eq("provider_payment_id", transactionId);
      return new Response(JSON.stringify({ success: false, status: "FAILED", error: statusData?.message || "PhonePe error", raw: statusData }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // expected shape: statusData.success = true, statusData.data.state = "COMPLETED" or similar
    const paymentSuccess = !!(statusData?.success && statusData?.data && statusData.data.state === "COMPLETED");

    const newStatus = paymentSuccess ? "success" : "failed";
    const { error: updateError } = await supabase.from("payments").update({ status: newStatus }).eq("provider_payment_id", transactionId);
    if (updateError) console.error("DB update error:", updateError);

    // If success, try to update orders table (if you use orders)
    if (paymentSuccess) {
      const { data: payment } = await supabase.from("payments").select("order_id").eq("provider_payment_id", transactionId).single().catch(() => ({ data: null }));
      if (payment?.order_id) {
        const { error: orderError } = await supabase.from("orders").update({ status: "paid" }).eq("id", payment.order_id);
        if (orderError) console.error("Failed to update order status:", orderError);
      }
    }

    return new Response(JSON.stringify({
      success: paymentSuccess,
      status: paymentSuccess ? "SUCCESS" : "FAILED",
      data: statusData?.data ?? null
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (err: any) {
    console.error("verify-payment unhandled error:", err);
    return new Response(JSON.stringify({ success: false, error: err?.message || "Internal error", stack: err?.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

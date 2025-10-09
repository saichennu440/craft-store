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
  amount: number;
  phone: string;
  callbackUrl: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log("=== CREATE PAYMENT FUNCTION STARTED ===");
    console.log("Request method:", req.method);

    // supabase server client (must provide the service role key in function env)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Log safe subset of env
    console.log("Environment variables check:");
    console.log("- SUPABASE_URL:", (Deno.env.get("SUPABASE_URL") || "").substring(0, 30) + "...");
    console.log("- PHONEPE_ENV:", Deno.env.get("PHONEPE_ENV"));
    console.log("- PHONEPE_MERCHANT_ID:", Deno.env.get("PHONEPE_MERCHANT_ID") ? "[SET]" : "[MISSING]");
    console.log("- PHONEPE_SECRET exists:", !!Deno.env.get("PHONEPE_SECRET"));

    // parse body (allow JSON body)
    const bodyText = await req.text();
    let body: PaymentRequest;
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { orderId, amount, phone, callbackUrl } = body ?? {};

    if (!orderId || !amount || !phone || !callbackUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: orderId, amount, phone, callbackUrl",
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID") ?? "";
    const saltKey = Deno.env.get("PHONEPE_SECRET") ?? "";
    const saltIndex = Deno.env.get("PHONEPE_SALT_INDEX") ?? "1";
    const environment = (Deno.env.get("PHONEPE_ENV") || "sandbox").toLowerCase();

    if (!merchantId) {
      return new Response(JSON.stringify({ success: false, error: "PHONEPE_MERCHANT_ID not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!saltKey) {
      return new Response(JSON.stringify({ success: false, error: "PHONEPE_SECRET not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    console.log("Generated transaction ID:", transactionId);

    // store a pending payment record (adjust columns to your schema)
    const { error: dbError } = await supabase.from("payments").insert({
      order_id: orderId,
      provider: "phonepe",
      provider_payment_id: transactionId,
      amount: amount,
      status: "pending",
      phone: phone
    });

    if (dbError) {
      console.error("Database insert error:", dbError);
      return new Response(JSON.stringify({ success: false, error: "Failed to create payment record" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // mode check
    const isTestMode = ["sandbox", "development", "test"].includes(environment);
    console.log("Using test mode?", isTestMode);

    if (isTestMode) {
      // easy test-mode URL — your frontend can detect this and skip real redirect
      const mockUrl = `${callbackUrl}/payment/success?transactionId=${transactionId}&status=SUCCESS`;
      return new Response(JSON.stringify({
        success: true,
        paymentUrl: mockUrl,
        transactionId,
        message: "Payment created successfully (test mode)"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // PRODUCTION - configurable base URL & endpoints via env
    const phonepeBase = Deno.env.get("PHONEPE_BASE_URL") ?? "https://api.phonepe.com/apis/pg";
    const payPath = Deno.env.get("PHONEPE_PAY_PATH") ?? "/v1/pay"; // should start with /
    const statusPathPrefix = Deno.env.get("PHONEPE_STATUS_PREFIX") ?? "/v1/status"; // used in verify function

    // Build payload
    const paymentPayload = {
      merchantId,
      merchantTransactionId: transactionId,
      merchantUserId: `USER_${Date.now()}`,
      amount: Math.round(amount * 100), // rupees -> paise
      redirectUrl: `${callbackUrl}/payment/success?transactionId=${transactionId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/verify-payment?transactionId=${transactionId}`,
      mobileNumber: phone,
      paymentInstrument: { type: "PAY_PAGE" }
    };

    console.log("Payment payload (snippet):", JSON.stringify(paymentPayload).slice(0, 200));

    // base64 encode payload
    const payloadString = JSON.stringify(paymentPayload);
    // btoa exists in Deno global for base64 encode of utf-8? to be safe:
    const payloadBase64 = typeof btoa === "function"
      ? btoa(payloadString)
      : Buffer.from(payloadString).toString("base64");

    // signature: payloadBase64 + payPath + saltKey (this matches PhonePe docs for pay)
    const endpointForHash = payPath; // e.g. "/v1/pay"
    const stringToHash = payloadBase64 + endpointForHash + saltKey;
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToHash);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('') + "###" + saltIndex;

    console.log("Calling PhonePe at:", phonepeBase + payPath);

    const phonepeResponse = await fetch(`${phonepeBase}${payPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": signature,
        "accept": "application/json",
        "X-MERCHANT-ID": merchantId
      },
      body: JSON.stringify({ request: payloadBase64 })
    });

    console.log("PhonePe response status:", phonepeResponse.status);
    const responseText = await phonepeResponse.text();
    console.log("PhonePe raw response:", responseText);

    let phonepeData;
    try {
      phonepeData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse PhonePe response:", parseError);
      return new Response(JSON.stringify({ success: false, error: "Invalid response from PhonePe", details: responseText }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("PhonePe response parsed:", phonepeData);

    if (phonepeResponse.ok && phonepeData?.success && phonepeData?.data?.instrumentResponse?.redirectInfo?.url) {
      const redirectUrl = phonepeData.data.instrumentResponse.redirectInfo.url;
      // return full success
      return new Response(JSON.stringify({
        success: true,
        paymentUrl: redirectUrl,
        transactionId
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else {
      console.error("PhonePe API returned error:", phonepeData);
      return new Response(JSON.stringify({
        success: false,
        error: phonepeData?.message || phonepeData?.code || "PhonePe returned failure",
        raw: phonepeData
      }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (err: any) {
    console.error("create-payment unhandled error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err?.message || "Internal error",
      stack: err?.stack
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

/*
  # PhonePe Payment Creation Edge Function
  
  This function handles payment creation with PhonePe integration.
  It creates a payment request, generates the required payload and signature,
  and returns the payment URL for redirection.
*/

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

interface PaymentRequest {
  orderId: string;
  amount: number;
  phone: string;
  callbackUrl: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { orderId, amount, phone, callbackUrl }: PaymentRequest = await req.json();

    // Validate input
    if (!orderId || !amount || !phone || !callbackUrl) {
      throw new Error("Missing required fields: orderId, amount, phone, callbackUrl");
    }

    // PhonePe configuration
    const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID") ?? "PGTESTPAYUAT";
    const saltKey = Deno.env.get("PHONEPE_SECRET") ?? "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
    const saltIndex = "1";
    const environment = Deno.env.get("PHONEPE_ENV") ?? "sandbox";
    
    // Generate unique transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // PhonePe API endpoints
    const baseUrl = environment === "production" 
      ? "https://api.phonepe.com/apis/hermes"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox";

    // Create payment payload
    const paymentPayload = {
      merchantId: merchantId,
      merchantTransactionId: transactionId,
      merchantUserId: `USER_${Date.now()}`,
      amount: Math.round(amount * 100), // Convert to paise and ensure integer
      redirectUrl: `${callbackUrl}/payment/success?transactionId=${transactionId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/verify-payment`,
      mobileNumber: phone,
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    console.log("Payment payload:", JSON.stringify(paymentPayload, null, 2));

    // Store payment record first
    const { error: dbError } = await supabase
      .from("payments")
      .insert({
        order_id: orderId,
        provider: "phonepe",
        provider_payment_id: transactionId,
        amount: amount,
        status: "pending"
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to create payment record");
    }

    // For sandbox environment, return mock success for testing
    if (environment === "sandbox" || environment === "development") {
      console.log("Sandbox mode - returning mock payment URL");
      
      return new Response(
        JSON.stringify({
          success: true,
          paymentUrl: `${callbackUrl}/payment/success?transactionId=${transactionId}&status=SUCCESS`,
          transactionId: transactionId,
          message: "Payment created successfully (sandbox mode)"
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // For production, create actual PhonePe payment (only when PHONEPE_ENV=production)
    try {
      // Encode payload to base64
      const payloadString = JSON.stringify(paymentPayload);
      const payloadBase64 = btoa(payloadString);
      
      // Create signature
      const stringToHash = payloadBase64 + "/pg/v1/pay" + saltKey;
      const encoder = new TextEncoder();
      const data = encoder.encode(stringToHash);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('') + "###" + saltIndex;

      console.log("Making request to PhonePe API...");
      console.log("Environment:", environment, "Base URL:", baseUrl);

      // Make request to PhonePe API
      const phonepeResponse = await fetch(`${baseUrl}/pg/v1/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": signature
        },
        body: JSON.stringify({
          request: payloadBase64
        })
      });

      const phonepeData = await phonepeResponse.json();
      console.log("PhonePe response:", phonepeData);

      if (phonepeData.success) {
        return new Response(
          JSON.stringify({
            success: true,
            paymentUrl: phonepeData.data.instrumentResponse.redirectInfo.url,
            transactionId: transactionId
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      } else {
        throw new Error(phonepeData.message || "Payment creation failed");
      }
    } catch (phonepeError) {
      console.error("PhonePe API error:", phonepeError);
      throw new Error("PhonePe API request failed");
    }

  } catch (error) {
    console.error("Payment creation error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Payment creation failed"
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
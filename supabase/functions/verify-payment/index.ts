/*
  # PhonePe Payment Verification Edge Function
  
  This function handles payment verification webhook from PhonePe.
  It verifies the signature, checks payment status, and updates
  the order and payment records accordingly.
*/

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-VERIFY, x-client-info, apikey",
};

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

    // PhonePe configuration
    const saltKey = Deno.env.get("PHONEPE_SECRET") ?? "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
    const environment = Deno.env.get("PHONEPE_ENV") ?? "sandbox";

    // Handle GET request for manual verification
    if (req.method === "GET") {
      const url = new URL(req.url);
      const transactionId = url.searchParams.get("transactionId");
      const merchantTransactionId = url.searchParams.get("merchantTransactionId");

      if (!transactionId && !merchantTransactionId) {
        throw new Error("Transaction ID is required");
      }

      const txnId = merchantTransactionId || transactionId;
      console.log("Verifying payment for transaction:", txnId);

      // Find payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("*")
        .eq("provider_payment_id", txnId)
        .single();

      if (paymentError || !payment) {
        console.error("Payment not found:", paymentError);
        throw new Error("Payment not found");
      }

      // For sandbox, simulate successful verification
      if (environment === "sandbox") {
        console.log("Sandbox mode - simulating successful payment");
        
        // Update payment status to success
        const { error: paymentUpdateError } = await supabase
          .from("payments")
          .update({ status: "success" })
          .eq("id", payment.id);

        if (paymentUpdateError) {
          console.error("Failed to update payment status:", paymentUpdateError);
          throw new Error("Failed to update payment status");
        }

        // Update order status to paid
        const { error: orderUpdateError } = await supabase
          .from("orders")
          .update({ status: "paid" })
          .eq("id", payment.order_id);

        if (orderUpdateError) {
          console.error("Failed to update order status:", orderUpdateError);
          throw new Error("Failed to update order status");
        }

        console.log("Successfully updated payment and order status");

        return new Response(
          JSON.stringify({
            success: true,
            status: "SUCCESS",
            message: "Payment verified successfully (sandbox mode)"
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      // For production, make API call to PhonePe to verify
      const baseUrl = environment === "production" 
        ? "https://api.phonepe.com/apis/hermes"
        : "https://api-preprod.phonepe.com/apis/pg-sandbox";

      const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID") ?? "PGTESTPAYUAT";
      const checkPath = `/pg/v1/status/${merchantId}/${txnId}`;
      const stringToHash = checkPath + saltKey;
      
      const encoder = new TextEncoder();
      const data = encoder.encode(stringToHash);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('') + "###1";

      try {
        const verifyResponse = await fetch(`${baseUrl}${checkPath}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": signature,
            "X-MERCHANT-ID": merchantId
          }
        });

        const verifyData = await verifyResponse.json();
        console.log("PhonePe verification response:", verifyData);

        if (verifyData.success && verifyData.data.state === "COMPLETED") {
          // Update payment status to success
          const { error: paymentUpdateError } = await supabase
            .from("payments")
            .update({ status: "success" })
            .eq("id", payment.id);

          if (paymentUpdateError) {
            console.error("Failed to update payment status:", paymentUpdateError);
            throw new Error("Failed to update payment status");
          }

          // Update order status to paid
          const { error: orderUpdateError } = await supabase
            .from("orders")
            .update({ status: "paid" })
            .eq("id", payment.order_id);

          if (orderUpdateError) {
            console.error("Failed to update order status:", orderUpdateError);
            throw new Error("Failed to update order status");
          }

          console.log("Successfully updated payment and order status");

          return new Response(
            JSON.stringify({
              success: true,
              status: verifyData.data.state,
              message: "Payment verified successfully"
            }),
            {
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        } else {
          // Payment failed - update payment status
          const { error: paymentUpdateError } = await supabase
            .from("payments")
            .update({ status: "failed" })
            .eq("id", payment.id);

          if (paymentUpdateError) {
            console.error("Failed to update payment status:", paymentUpdateError);
          }

          throw new Error("Payment verification failed");
        }
      } catch (apiError) {
        console.error("PhonePe API error:", apiError);
        throw new Error("Payment verification API failed");
      }
    }

    // Handle POST webhook from PhonePe
    if (req.method === "POST") {
      const body = await req.text();
      const xVerifyHeader = req.headers.get("X-VERIFY");

      console.log("Received webhook:", body);
      console.log("X-VERIFY header:", xVerifyHeader);

      if (!xVerifyHeader && environment !== "sandbox") {
        throw new Error("X-VERIFY header missing");
      }

      // For sandbox, skip signature verification
      if (environment !== "sandbox" && xVerifyHeader) {
        // Implement signature verification logic
        const [signature, saltIndex] = xVerifyHeader.split("###");
        const stringToVerify = body + saltKey;
        
        const encoder = new TextEncoder();
        const data = encoder.encode(stringToVerify);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const computedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        if (signature !== computedSignature) {
          throw new Error("Invalid signature");
        }
      }

      const webhookData = JSON.parse(body);
      const transactionId = webhookData.transactionId || webhookData.merchantTransactionId;
      const status = webhookData.state || webhookData.status;

      console.log("Processing webhook for transaction:", transactionId, "status:", status);

      // Find payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("*")
        .eq("provider_payment_id", transactionId)
        .single();

      if (paymentError || !payment) {
        console.error("Payment not found for webhook:", paymentError);
        throw new Error("Payment not found");
      }

      // Update payment and order status based on webhook
      if (status === "COMPLETED" || status === "SUCCESS") {
        // Update payment status to success
        const { error: paymentUpdateError } = await supabase
          .from("payments")
          .update({ status: "success" })
          .eq("id", payment.id);

        if (paymentUpdateError) {
          console.error("Failed to update payment status:", paymentUpdateError);
          throw new Error("Failed to update payment status");
        }

        // Update order status to paid
        const { error: orderUpdateError } = await supabase
          .from("orders")
          .update({ status: "paid" })
          .eq("id", payment.order_id);

        if (orderUpdateError) {
          console.error("Failed to update order status:", orderUpdateError);
          throw new Error("Failed to update order status");
        }

        console.log("Webhook: Successfully updated payment and order status to paid");
      } else if (status === "FAILED" || status === "FAILURE") {
        // Update payment status to failed
        const { error: paymentUpdateError } = await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("id", payment.id);

        if (paymentUpdateError) {
          console.error("Failed to update payment status:", paymentUpdateError);
        }

        console.log("Webhook: Updated payment status to failed");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Webhook processed successfully"
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

  } catch (error) {
    console.error("Payment verification error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Payment verification failed"
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
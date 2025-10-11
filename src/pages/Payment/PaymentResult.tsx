// src/pages/payment/PaymentResult.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const SUCCESS_STATES = new Set(["SUCCESS", "success", "COMPLETED", "PAID", "completed", "paid"]);

function isPaymentSuccessShape(body: any) {
  if (!body) return false;
  // several accepted shapes
  if (body.success === true) return true;
  if (typeof body.status === "string" && SUCCESS_STATES.has(body.status)) return true;
  // sometimes the status is nested under data.state
  if (body.data && typeof body.data.state === "string" && SUCCESS_STATES.has(body.data.state)) return true;
  if (typeof body.state === "string" && SUCCESS_STATES.has(body.state)) return true;
  return false;
}

export const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get("transactionId");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function wait(ms: number) {
      return new Promise((res) => setTimeout(res, ms));
    }

    async function verifyPayment() {
      if (!transactionId) {
        navigate("/payment/failure?error=" + encodeURIComponent("Missing transaction ID"));
        return;
      }

      // try a few times in case DB update/phonepe webhook is slightly delayed
      const maxAttempts = 4;
      const baseDelayMs = 800; // small delay between attempts
      let lastErrorMessage = "Payment verification failed";

      for (let attempt = 1; attempt <= maxAttempts && mounted; attempt++) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_FUNCTION_URL}/verify-payment?transactionId=${encodeURIComponent(transactionId)}`,
            { method: "GET", headers: { "Content-Type": "application/json" } }
          );

          // Try to parse JSON safely
          let data: any = null;
          try {
            data = await res.json();
          } catch (parseErr) {
            // fallback to text
            const txt = await res.text().catch(() => "");
            data = { rawText: txt };
          }

          // if any accepted success shape — treat as success
          if (isPaymentSuccessShape(data)) {
            // optionally we can read a friendly message or order id
            const msg = data?.message || data?.data?.message || "Payment verified";
            if (mounted) {
              setLoading(false);
              navigate(`/payment/success?transactionId=${encodeURIComponent(transactionId)}`);
            }
            return;
          }

          // Not success: capture error info for final message
          lastErrorMessage = data?.error || data?.message || data?.data?.message || (res.status ? `HTTP ${res.status}` : lastErrorMessage);

          // If response explicitly says it's failed, break early
          const explicitFail = (data && (data.status === "FAILED" || data.status === "failed" || data.success === false));
          if (explicitFail && attempt === maxAttempts) break;

        } catch (err: any) {
          lastErrorMessage = err?.message || String(err) || lastErrorMessage;
        }

        // wait before next attempt (exponential-ish)
        if (attempt < maxAttempts && mounted) {
          await wait(baseDelayMs * attempt);
        }
      }

      // After attempts - treat as failure
      if (mounted) {
        setLoading(false);
        navigate(`/payment/failure?error=${encodeURIComponent(lastErrorMessage)}`);
      }
    }

    verifyPayment();

    return () => {
      mounted = false;
    };
  }, [transactionId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-medium mb-2">Verifying payment...</p>
        <p className="text-sm text-gray-600">Please wait — you will be redirected shortly.</p>
        <div className="mx-auto w-12 h-12 border-4 rounded-full animate-spin mt-4" />
      </div>
    </div>
  );
};

// src/pages/payment/PaymentResult.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase"; // <- use Supabase client so auth header is present

const SUCCESS_STATES = new Set(["SUCCESS", "success", "COMPLETED", "PAID", "completed", "paid"]);
const FAILED_STATES = new Set(["FAILED", "failed", "CANCELLED", "cancelled", "ERROR", "error"]);
const PENDING_STATES = new Set(["PENDING", "pending", "IN_PROGRESS", "in_progress", "PROCESSING", "processing"]);

function isSuccess(body: any) {
  if (!body) return false;
  if (body.success === true) return true;
  if (typeof body.status === "string" && SUCCESS_STATES.has(body.status)) return true;
  if (body.data && typeof body.data.state === "string" && SUCCESS_STATES.has(body.data.state)) return true;
  if (typeof body.state === "string" && SUCCESS_STATES.has(body.state)) return true;
  return false;
}
function isFailed(body: any) {
  if (!body) return false;
  if (body.success === false) return true;
  if (typeof body.status === "string" && FAILED_STATES.has(body.status)) return true;
  if (body.data && typeof body.data.state === "string" && FAILED_STATES.has(body.data.state)) return true;
  if (typeof body.state === "string" && FAILED_STATES.has(body.state)) return true;
  if (body.error && typeof body.error === "string" && body.error.toLowerCase().includes("failed")) return true;
  return false;
}
function isPending(body: any) {
  if (!body) return false;
  if (typeof body.status === "string" && PENDING_STATES.has(body.status)) return true;
  if (body.data && typeof body.data.state === "string" && PENDING_STATES.has(body.data.state)) return true;
  return false;
}

export const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get("transactionId");
  const [attemptsMade, setAttemptsMade] = useState(0);
  const [lastBody, setLastBody] = useState<any>(null);

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

      const maxAttempts = 12;
      const baseDelayMs = 600;
      let lastError = "Unknown verification error";

      for (let attempt = 1; attempt <= maxAttempts && mounted; attempt++) {
        setAttemptsMade(attempt);

        try {
          console.log(`[PaymentResult] invoke verify-payment attempt ${attempt} for ${transactionId}`);

          // Use supabase.functions.invoke so the request includes the anon key (avoids 401)
          const invokeResult = await supabase.functions.invoke("verify-payment", {
            body: { transactionId },
          });

          // supabase.functions.invoke returns { data, error } (or sometimes throws); handle both
          // If it throws, it will be caught by catch block below.
          // Normalize body:
          let body: any = null;
          if ((invokeResult as any).error) {
            // function returned non-2xx or supabase client wrapped error
            body = { error: (invokeResult as any).error?.message || (invokeResult as any).error };
            console.log("[PaymentResult] supabase.invoke error object:", (invokeResult as any).error);
          } else {
            body = (invokeResult as any).data ?? invokeResult;
          }

          console.log("[PaymentResult] verify response:", { attempt, body });

          setLastBody(body);

          // success -> redirect
          if (isSuccess(body)) {
            navigate(`/payment/success?transactionId=${encodeURIComponent(transactionId)}`);
            return;
          }

          // explicit failure -> redirect failure
          if (isFailed(body)) {
            const msg = body?.error || body?.message || body?.data?.message || "Payment failed";
            navigate(`/payment/failure?error=${encodeURIComponent(msg)}`);
            return;
          }

          // pending/ambiguous -> retry
          if (isPending(body) || (body && (body.attempts || body.rawText || body.message))) {
            lastError = body?.error || body?.message || `Attempt ${attempt} ambiguous`;
            // backoff
            await wait(baseDelayMs * attempt);
            continue;
          }

          // default fallback: treat as transient and retry a few times
          lastError = body?.error || body?.message || "Verification returned ambiguous response";
          await wait(baseDelayMs * attempt);

        } catch (err: any) {
          // network or thrown error from supabase client
          console.warn("[PaymentResult] invocation exception:", err);
          lastError = err?.message || String(err);
          // transient -> retry
          await wait(baseDelayMs * attempt);
          continue;
        }
      }

      // exhausted attempts -> failure
      if (mounted) {
        navigate(`/payment/failure?error=${encodeURIComponent(lastError)}`);
      }
    }

    verifyPayment();

    return () => {
      mounted = false;
    };
  }, [transactionId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md text-center p-4">
        <h3 className="text-lg font-medium mb-2">Verifying payment...</h3>
        <p className="text-sm text-gray-600 mb-4">
          We are checking your payment status — this may take a few seconds.
        </p>

        <div className="mb-4">
          <div className="mx-auto w-12 h-12 border-4 rounded-full animate-spin" />
        </div>

        <p className="text-sm text-gray-500">Attempts: {attemptsMade}</p>

        {lastBody && (
          <details className="text-left mt-4 text-xs text-gray-600">
            <summary className="cursor-pointer">Debug: last verify response</summary>
            <pre className="whitespace-pre-wrap mt-2">{JSON.stringify(lastBody, null, 2)}</pre>
          </details>
        )}
      </div>
    </div>
  );
};
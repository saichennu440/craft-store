// src/pages/payment/PaymentResult.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

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
  if (body.success === false && (typeof body.status === "string" && FAILED_STATES.has(body.status))) return true;
  if (typeof body.status === "string" && FAILED_STATES.has(body.status)) return true;
  if (body.data && typeof body.data.state === "string" && FAILED_STATES.has(body.data.state)) return true;
  if (typeof body.state === "string" && FAILED_STATES.has(body.state)) return true;
  // Some APIs return explicit error flags/messages
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

      const maxAttempts = 12;          // total tries
      const baseDelayMs = 600;        // base delay
      let lastError = "Unknown verification error";

      for (let attempt = 1; attempt <= maxAttempts && mounted; attempt++) {
        setAttemptsMade(attempt);
        try {
          const url = `${import.meta.env.VITE_SUPABASE_FUNCTION_URL}/verify-payment?transactionId=${encodeURIComponent(transactionId)}`;
          console.log(`[PaymentResult] verify attempt ${attempt} -> ${url}`);

          const res = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });

          // try parse JSON safely; if parse fails, capture text
          let body: any = null;
          try {
            body = await res.json();
          } catch (parseErr) {
            const txt = await res.text().catch(() => "");
            body = { rawText: txt };
          }

          // log the raw body to console for debugging
          console.log("[PaymentResult] verify response:", { httpStatus: res.status, body });

          // keep last body for UI/debug
          setLastBody(body);

          // success condition (multiple accepted shapes)
          if (isSuccess(body)) {
            // success — redirect
            navigate(`/payment/success?transactionId=${encodeURIComponent(transactionId)}`);
            return;
          }

          // explicit failure condition
          if (isFailed(body)) {
            const msg = body?.error || body?.message || body?.data?.message || "Payment failed";
            navigate(`/payment/failure?error=${encodeURIComponent(msg)}`);
            return;
          }

          // If server returns pending-ish state or ambiguous - retry
          if (isPending(body) || res.status >= 500 || res.status === 202 || (res.status === 200 && !body.success && !isFailed(body))) {
            // treat as transient: retry after waiting
            lastError = body?.error || body?.message || `Attempt ${attempt} status ${res.status}`;
            // small exponential backoff
            await wait(baseDelayMs * attempt);
            continue;
          }

          // Some 4xx responses might be transient (e.g., PhonePe returned BAD_REQUEST while it validates)
          if (res.status >= 400 && res.status < 500) {
            // If body contains "must not be null" etc it's likely a validation, but we still allow a few retries
            lastError = body?.error || body?.message || `HTTP ${res.status}`;
            await wait(baseDelayMs * attempt);
            continue;
          }

          // default: mark as failure after attempts exhausted
          lastError = body?.error || body?.message || `HTTP ${res.status}`;

        } catch (err: any) {
          console.warn("[PaymentResult] verify attempt error:", err);
          lastError = err?.message || String(err);
          // transient network error -> retry
          await wait(baseDelayMs * attempt);
          continue;
        }
      }

      // exhausted attempts -> treat as failure
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

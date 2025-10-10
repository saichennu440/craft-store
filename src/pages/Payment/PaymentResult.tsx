import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get("transactionId");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyPayment() {
      if (!transactionId) {
        navigate("/payment/failure?error=Missing transaction ID");
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_FUNCTION_URL}/verify-payment?transactionId=${transactionId}`
        );
        const data = await res.json();

        if (data.success && data.status === "SUCCESS") {
          navigate("/payment/success");
        } else {
          navigate(`/payment/failure?error=${data.error || "Payment failed"}`);
        }
      } catch (err) {
        navigate(`/payment/failure?error=${err.message || "Payment failed"}`);
      }
    }

    verifyPayment();
  }, [transactionId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Verifying payment...</p>
    </div>
  );
};

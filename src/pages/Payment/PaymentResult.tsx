// src/pages/payment/PaymentResult.tsx
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spinner } from '../../components/ui/Spinner'; // use your loader or simple text
import { verifyPayment } from '../../lib/phonepe'; // your existing helper that calls /verify-payment
import toast from 'react-hot-toast';

export const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get('transactionId');

  React.useEffect(() => {
    if (!transactionId) {
      toast.error('Missing transaction id');
      navigate('/payment/failure?error=Missing%20transaction%20id');
      return;
    }

    (async () => {
      try {
        // call your verify endpoint (supabase function) that returns { success: boolean, status, ... }
        const res = await verifyPayment(transactionId, transactionId); 
        // Note: your verifyPayment(client helper) accepted merchantTransactionId previously, adjust if needed.
        // The important part is verifyPayment returns success/status from the verify endpoint.

        if (res?.success && (res.status === 'SUCCESS' || res.status === 'COMPLETED' || res.status === 'success')) {
          // confirmed success
          navigate(`/payment/success?transactionId=${encodeURIComponent(transactionId)}`);
        } else {
          // payment not successful
          // pass message from server if available for display
          const errorMsg = res?.message || res?.error || 'Payment failed or was cancelled';
          navigate(`/payment/failure?error=${encodeURIComponent(errorMsg)}`);
        }
      } catch (err: any) {
        // network / unexpected error — show failure page with message
        const message = err?.message || 'Verification failed';
        navigate(`/payment/failure?error=${encodeURIComponent(message)}`);
      }
    })();
  }, [transactionId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-medium mb-2">Checking your payment status…</p>
        <p className="text-sm text-gray-600 mb-4">Please wait — you will be redirected shortly.</p>
        {/* Replace with your spinner component / animation */}
        <div className="mx-auto w-12 h-12 border-4 border-primary-600 rounded-full animate-spin" />
      </div>
    </div>
  );
}

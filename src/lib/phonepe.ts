import { supabase } from './supabase'

export interface PaymentRequest {
  orderId: string
  amount: number
  phone: string
  callbackUrl: string
}

export interface PaymentResponse {
  success: boolean
  paymentUrl?: string
  transactionId?: string
  error?: string
}

export const createPayment = async (paymentData: PaymentRequest): Promise<PaymentResponse> => {
  try {
    console.log('Creating payment with data:', paymentData)
    
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: paymentData
    })

    console.log('Supabase function response:', { data, error })
    
    if (error) throw error

    return data
  } catch (error) {
    console.error('Payment creation failed:', error)
    
    // Return more detailed error information
    return {
      success: false,
      error: error.message || 'Failed to create payment'
    }
  }
}

export const verifyPayment = async (transactionId: string, merchantTransactionId: string) => {
  try {
    console.log('Verifying payment:', { transactionId, merchantTransactionId })
    
    // Use fetch directly to call the verification endpoint with query parameters
    const verifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment?transactionId=${transactionId}`
    
    const response = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()

    console.log('Verification response:', data)
    
    if (!response.ok) {
      throw new Error(data.error || 'Verification request failed')
    }

    return data
  } catch (error) {
    console.error('Payment verification failed:', error)
    return {
      success: false,
      error: error.message || 'Payment verification failed'
    }
  }
}

// PhonePe UPI Intent helper
export const openPhonePeUPI = (transactionId: string, amount: number, merchantId: string) => {
  const upiString = `upi://pay?pa=${merchantId}@ybl&pn=Craftly&tr=${transactionId}&am=${amount}&cu=INR`
  
  // For mobile devices, try to open UPI app
  if (/Android|iPhone/i.test(navigator.userAgent)) {
    window.location.href = upiString
  } else {
    // For desktop, show QR code or payment link
    console.log('UPI String:', upiString)
  }
}
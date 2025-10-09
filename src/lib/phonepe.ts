// phonepe.ts (replace existing createPayment + verifyPayment)

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
  [k: string]: any
}

// Helper to call Supabase Edge Function via fetch so we get full response body
async function callFunction(functionName: string, body: any) {
  const base = import.meta.env.VITE_SUPABASE_URL
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

  const url = `${base}/functions/v1/${functionName}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // include anon key so function can see who is calling (Supabase requires apikey)
        'apikey': anon,
        'Authorization': `Bearer ${anon}`,
      },
      body: JSON.stringify(body),
    })

    const text = await res.text()
    let data: any = {}
    try { data = text ? JSON.parse(text) : {} } catch { data = { raw: text } }

    // Return whole object and status for easier debugging
    return { ok: res.ok, status: res.status, data }
  } catch (err: any) {
    console.error('callFunction network error:', err)
    return { ok: false, status: 0, data: { success: false, error: err?.message || 'Network error' } }
  }
}

export const createPayment = async (paymentData: PaymentRequest): Promise<PaymentResponse> => {
  console.log('Creating payment with data:', paymentData)
  const res = await callFunction('create-payment', paymentData)
  console.log('create-payment raw response:', res)

  if (!res.ok) {
    // Try to return friendly message extracted from function body
    const errMsg = res.data?.error || res.data?.message || JSON.stringify(res.data)
    return { success: false, error: `Function error (status ${res.status}): ${errMsg}` }
  }

  // success
  return res.data as PaymentResponse
}

export const verifyPayment = async (transactionId: string) => {
  console.log('Verifying payment (client):', transactionId)
  const res = await callFunction('verify-payment', { transactionId })
  console.log('verify-payment raw response:', res)

  if (!res.ok) {
    const errMsg = res.data?.error || res.data?.message || JSON.stringify(res.data)
    return { success: false, error: `Function error (status ${res.status}): ${errMsg}` }
  }
  return res.data
}

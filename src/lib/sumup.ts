interface CheckoutParams {
  amount: number
  description: string
  referenceId: string
}

interface CheckoutBody {
  amount: number
  currency: string
  checkout_reference: string
  merchant_code: string
  description: string
  redirect_url: string
}

export function buildCheckoutBody(params: CheckoutParams): CheckoutBody {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return {
    amount: params.amount,
    currency: 'EUR',
    checkout_reference: params.referenceId,
    merchant_code: process.env.SUMUP_MERCHANT_CODE || '',
    description: params.description,
    redirect_url: `${baseUrl}/payment/success?ref=${params.referenceId}`,
  }
}

interface SumUpCheckoutResponse {
  id: string
  checkout_reference: string
  amount: number
  status: string
}

export async function createCheckout(params: CheckoutParams): Promise<SumUpCheckoutResponse> {
  const apiKey = process.env.SUMUP_API_KEY
  if (!apiKey) throw new Error('SUMUP_API_KEY nicht konfiguriert')

  const body = buildCheckoutBody(params)
  const res = await fetch('https://api.sumup.com/v0.1/checkouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`SumUp API Fehler: ${res.status} ${error}`)
  }
  return res.json()
}

export async function getCheckoutStatus(checkoutId: string): Promise<SumUpCheckoutResponse> {
  const apiKey = process.env.SUMUP_API_KEY
  if (!apiKey) throw new Error('SUMUP_API_KEY nicht konfiguriert')

  const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) throw new Error(`SumUp API Fehler: ${res.status}`)
  return res.json()
}

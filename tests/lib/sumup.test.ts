import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.SUMUP_API_KEY = 'test-api-key'
  process.env.SUMUP_MERCHANT_CODE = 'TEST_MERCHANT'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
})

describe('sumup', () => {
  it('builds checkout request body correctly', async () => {
    const { buildCheckoutBody } = await import('@/lib/sumup')
    const body = buildCheckoutBody({
      amount: 80,
      description: '10er-Karte Yoga',
      referenceId: 'zk_123',
    })
    expect(body.amount).toBe(80)
    expect(body.description).toBe('10er-Karte Yoga')
    expect(body.checkout_reference).toBe('zk_123')
    expect(body.currency).toBe('EUR')
    expect(body.merchant_code).toBe('TEST_MERCHANT')
    expect(body.redirect_url).toContain('/payment/success')
  })

  it('builds checkout body for single booking', async () => {
    const { buildCheckoutBody } = await import('@/lib/sumup')
    const body = buildCheckoutBody({
      amount: 12,
      description: 'Einzelbuchung Qigong',
      referenceId: 'kb_456',
    })
    expect(body.amount).toBe(12)
    expect(body.checkout_reference).toBe('kb_456')
  })
})

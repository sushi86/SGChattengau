import { describe, it, expect, beforeEach } from 'vitest'

describe('rate-limit', () => {
  beforeEach(async () => {
    const mod = await import('@/lib/rate-limit')
    mod.resetRateLimitStore()
  })

  it('allows requests under the limit', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const result = checkRateLimit('test-ip-1', 5, 60000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('blocks requests over the limit', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    for (let i = 0; i < 3; i++) {
      checkRateLimit('test-ip-2', 3, 60000)
    }
    const result = checkRateLimit('test-ip-2', 3, 60000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('tracks different IPs separately', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    for (let i = 0; i < 3; i++) {
      checkRateLimit('ip-a', 3, 60000)
    }
    const resultA = checkRateLimit('ip-a', 3, 60000)
    const resultB = checkRateLimit('ip-b', 3, 60000)
    expect(resultA.allowed).toBe(false)
    expect(resultB.allowed).toBe(true)
  })
})

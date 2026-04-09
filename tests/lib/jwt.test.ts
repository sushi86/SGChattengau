import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-long!!'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-chars!!'
})

describe('jwt', () => {
  it('signs and verifies an access token', async () => {
    const { signAccessToken, verifyAccessToken } = await import('@/lib/jwt')
    const payload = { userId: 'user123', role: 'ADMIN' as const }
    const token = signAccessToken(payload)
    const decoded = verifyAccessToken(token)
    expect(decoded.userId).toBe('user123')
    expect(decoded.role).toBe('ADMIN')
  })

  it('signs and verifies a refresh token', async () => {
    const { signRefreshToken, verifyRefreshToken } = await import('@/lib/jwt')
    const token = signRefreshToken('user123')
    const decoded = verifyRefreshToken(token)
    expect(decoded.userId).toBe('user123')
  })

  it('rejects an expired access token', async () => {
    const { verifyAccessToken } = await import('@/lib/jwt')
    const jwt = await import('jsonwebtoken')
    const token = jwt.default.sign(
      { userId: 'u1', role: 'ADMIN' },
      process.env.JWT_SECRET!,
      { expiresIn: '0s' }
    )
    expect(verifyAccessToken(token)).toBeNull()
  })

  it('rejects a token signed with wrong secret', async () => {
    const { verifyAccessToken } = await import('@/lib/jwt')
    const jwt = await import('jsonwebtoken')
    const token = jwt.default.sign(
      { userId: 'u1', role: 'ADMIN' },
      'wrong-secret-wrong-secret-wrong!!'
    )
    expect(verifyAccessToken(token)).toBeNull()
  })
})

import jwt from 'jsonwebtoken'

interface AccessTokenPayload {
  userId: string
  role: string
}

interface RefreshTokenPayload {
  userId: string
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' })
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AccessTokenPayload
  } catch {
    return null
  }
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '30d',
  })
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET!
    ) as RefreshTokenPayload
  } catch {
    return null
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signAccessToken, verifyRefreshToken } from '@/lib/jwt'
import { apiSuccess, apiError } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/api-error'
import { refreshTokenSchema } from '@/lib/validations/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = refreshTokenSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const { refreshToken } = parsed.data
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) throw new UnauthorizedError('Ungültiger Refresh Token')

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } })
      throw new UnauthorizedError('Ungültiger Refresh Token')
    }

    const accessToken = signAccessToken({
      userId: stored.user.id,
      role: stored.user.role,
    })

    return apiSuccess({ accessToken })
  } catch (err) {
    return apiError(err)
  }
}

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import { apiSuccess, apiError } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/api-error'
import { loginSchema } from '@/lib/validations/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) throw new UnauthorizedError('Ungültige Anmeldedaten')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedError('Ungültige Anmeldedaten')

    const accessToken = signAccessToken({ userId: user.id, role: user.role })
    const refreshToken = signRefreshToken(user.id)

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    return apiSuccess({ accessToken, refreshToken })
  } catch (err) {
    return apiError(err)
  }
}

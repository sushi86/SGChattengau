import { NextRequest } from 'next/server'
import { auth } from './auth'
import { verifyAccessToken } from './jwt'
import type { UserRole } from '@/generated/prisma/enums'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  sparteId: string | null
  source: 'web' | 'app'
}

export async function authenticateRequest(
  req: NextRequest
): Promise<AuthUser | null> {
  // 1. Check Bearer Token (App)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = verifyAccessToken(token)
    if (payload) {
      return {
        id: payload.userId,
        email: '',
        name: '',
        role: payload.role as UserRole,
        sparteId: null,
        source: 'app',
      }
    }
  }

  // 2. Check Session (Web)
  const session = await auth()
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as UserRole,
      sparteId: session.user.sparteId,
      source: 'web',
    }
  }

  return null
}

export function requireRole(...roles: UserRole[]) {
  return async (req: NextRequest): Promise<AuthUser> => {
    const user = await authenticateRequest(req)
    if (!user) {
      throw new (await import('./api-error')).UnauthorizedError()
    }
    if (!roles.includes(user.role)) {
      throw new (await import('./api-error')).ForbiddenError()
    }
    return user
  }
}

import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { apiSuccess, apiError } from '@/lib/api-response'
import { UnauthorizedError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    return apiSuccess({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sparteId: user.sparteId,
    })
  } catch (err) {
    return apiError(err)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { UnauthorizedError, ForbiddenError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const url = new URL(req.url)
    const sparteId = url.searchParams.get('sparte')
    const datum = url.searchParams.get('datum')

    const where: Record<string, unknown> = {}

    if (user.role !== 'ADMIN') {
      if (!user.sparteId) throw new ForbiddenError()
      where.sparteId = user.sparteId
    } else if (sparteId) {
      where.sparteId = sparteId
    }

    if (datum) {
      const d = new Date(datum)
      const nextDay = new Date(d)
      nextDay.setDate(nextDay.getDate() + 1)
      where.datum = { gte: d, lt: nextDay }
    }

    const buchungen = await prisma.kursBuchung.findMany({
      where,
      include: {
        sparte: { select: { name: true } },
        zehnerkarte: { select: { id: true, verbleibend: true } },
        zahlung: { select: { status: true } },
      },
      orderBy: [{ datum: 'desc' }, { createdAt: 'desc' }],
    })

    return apiSuccess(buchungen)
  } catch (err) {
    return apiError(err)
  }
}

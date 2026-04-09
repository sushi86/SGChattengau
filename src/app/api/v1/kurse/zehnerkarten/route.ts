import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { UnauthorizedError, ForbiddenError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: Alle 10er-Karten für eine Sparte (Kursleiter/Admin)
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const url = new URL(req.url)
    const sparteId = url.searchParams.get('sparte')

    const where: Record<string, unknown> = {}

    if (user.role !== 'ADMIN') {
      if (!user.sparteId) throw new ForbiddenError()
      where.sparteId = user.sparteId
    } else if (sparteId) {
      where.sparteId = sparteId
    }

    const karten = await prisma.zehnerkarte.findMany({
      where,
      select: {
        id: true,
        kaeuferVorname: true,
        kaeuferNachname: true,
        kaeuferEmail: true,
        verbleibend: true,
        preis: true,
        istMitglied: true,
        zahlung: { select: { status: true } },
      },
      orderBy: [{ verbleibend: 'desc' }, { createdAt: 'desc' }],
    })

    return apiSuccess(karten)
  } catch (err) {
    return apiError(err)
  }
}

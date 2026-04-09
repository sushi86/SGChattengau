import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'

// POST: Stempel zurücknehmen (Kursleiter/Admin)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const { id } = await params
    const karte = await prisma.zehnerkarte.findUnique({ where: { id } })
    if (!karte) throw new NotFoundError('10er-Karte')

    if (user.role !== 'ADMIN' && user.sparteId !== karte.sparteId) {
      throw new ForbiddenError()
    }

    if (karte.verbleibend >= 10) {
      throw new ValidationError('Kein Stempel zum Zurücknehmen vorhanden')
    }

    const updated = await prisma.zehnerkarte.update({
      where: { id },
      data: { verbleibend: { increment: 1 } },
    })

    return apiSuccess({ id: updated.id, verbleibend: updated.verbleibend })
  } catch (err) {
    return apiError(err)
  }
}

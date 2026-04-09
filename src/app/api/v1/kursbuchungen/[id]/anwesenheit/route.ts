import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'
import { anwesenheitSchema } from '@/lib/validations/kurs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const { id } = await params
    const buchung = await prisma.kursBuchung.findUnique({ where: { id } })
    if (!buchung) throw new NotFoundError('Kursbuchung')

    if (user.role !== 'ADMIN' && user.sparteId !== buchung.sparteId) {
      throw new ForbiddenError()
    }

    const body = await req.json()
    const parsed = anwesenheitSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Ungültiger Status')
    }

    // Wenn storniert und 10er-Karte: Einheit zurückgeben
    if (parsed.data.anwesenheit === 'STORNIERT' && buchung.zehnerkarteId && buchung.anwesenheit !== 'STORNIERT') {
      await prisma.zehnerkarte.update({
        where: { id: buchung.zehnerkarteId },
        data: { verbleibend: { increment: 1 } },
      })
    }

    const updated = await prisma.kursBuchung.update({
      where: { id },
      data: { anwesenheit: parsed.data.anwesenheit },
    })

    return apiSuccess(updated)
  } catch (err) {
    return apiError(err)
  }
}

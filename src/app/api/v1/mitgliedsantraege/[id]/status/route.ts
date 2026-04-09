import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { ValidationError, NotFoundError } from '@/lib/api-error'
import { requireRole } from '@/lib/auth-middleware'

const statusSchema = z.object({
  status: z.enum(['EINGEGANGEN', 'IN_BEARBEITUNG', 'ABGESCHLOSSEN', 'EXPORTIERT', 'ABGELEHNT']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const checkAdmin = requireRole('ADMIN')
    const user = await checkAdmin(req)

    const { id } = await params
    const body = await req.json()
    const parsed = statusSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültiger Status',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const existing = await prisma.mitgliedsantrag.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Mitgliedsantrag')

    const updated = await prisma.mitgliedsantrag.update({
      where: { id },
      data: {
        status: parsed.data.status,
        bearbeitetAm: new Date(),
        bearbeitetVon: user.id,
      },
    })

    return apiSuccess({ id: updated.id, status: updated.status })
  } catch (err) {
    return apiError(err)
  }
}

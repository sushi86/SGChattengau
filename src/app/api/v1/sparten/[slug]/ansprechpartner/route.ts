import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { authenticateRequest } from '@/lib/auth-middleware'
import { ansprechpartnerUpdateSchema } from '@/lib/validations/sparte'
import { ValidationError, NotFoundError, ForbiddenError, UnauthorizedError } from '@/lib/api-error'

type RouteParams = { params: Promise<{ slug: string }> }

export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params
    const user = await authenticateRequest(req)
    if (!user) {
      throw new UnauthorizedError()
    }

    const sparte = await prisma.sparte.findUnique({ where: { slug } })
    if (!sparte) {
      throw new NotFoundError('Sparte')
    }

    // Admin can edit all, Spartenleiter/Kursleiter only their own
    if (user.role !== 'ADMIN') {
      if (user.sparteId !== sparte.id) {
        throw new ForbiddenError('Keine Berechtigung für diese Sparte')
      }
    }

    const body = await req.json()
    const parsed = ansprechpartnerUpdateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Validierung fehlgeschlagen',
        parsed.error.issues.map((e) => ({ feld: e.path.join('.'), meldung: e.message }))
      )
    }

    // Batch update: delete all existing, then recreate
    await prisma.$transaction(async (tx) => {
      await tx.ansprechpartner.deleteMany({ where: { sparteId: sparte.id } })
      if (parsed.data.ansprechpartner.length > 0) {
        await tx.ansprechpartner.createMany({
          data: parsed.data.ansprechpartner.map((a) => ({
            sparteId: sparte.id,
            name: a.name,
            rolle: a.rolle ?? null,
            telefon: a.telefon ?? null,
            email: a.email || null,
          })),
        })
      }
    })

    const ansprechpartner = await prisma.ansprechpartner.findMany({
      where: { sparteId: sparte.id },
    })

    return apiSuccess(ansprechpartner)
  } catch (err) {
    return apiError(err)
  }
}

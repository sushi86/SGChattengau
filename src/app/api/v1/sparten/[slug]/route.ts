import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { authenticateRequest } from '@/lib/auth-middleware'
import { sparteUpdateSchema } from '@/lib/validations/sparte'
import { ValidationError, NotFoundError, ForbiddenError, UnauthorizedError } from '@/lib/api-error'

type RouteParams = { params: Promise<{ slug: string }> }

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params

    const sparte = await prisma.sparte.findUnique({
      where: { slug },
      include: {
        trainingszeiten: { orderBy: { wochentag: 'asc' } },
        ansprechpartner: true,
        bilder: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!sparte) {
      throw new NotFoundError('Sparte')
    }

    return apiSuccess(sparte)
  } catch (err) {
    return apiError(err)
  }
}

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
    const parsed = sparteUpdateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Validierung fehlgeschlagen',
        parsed.error.issues.map((e) => ({ feld: e.path.join('.'), meldung: e.message }))
      )
    }

    const updated = await prisma.sparte.update({
      where: { id: sparte.id },
      data: parsed.data,
      include: {
        trainingszeiten: { orderBy: { wochentag: 'asc' } },
        ansprechpartner: true,
        bilder: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return apiSuccess(updated)
  } catch (err) {
    return apiError(err)
  }
}

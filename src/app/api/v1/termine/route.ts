import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { ValidationError, UnauthorizedError, ForbiddenError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'
import { terminCreateSchema } from '@/lib/validations/termin'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const sparteId = url.searchParams.get('sparte')
    const von = url.searchParams.get('von')
    const bis = url.searchParams.get('bis')

    const where: Record<string, unknown> = {}

    if (sparteId) {
      // Support comma-separated sparte IDs for multi-filter
      const ids = sparteId.split(',').filter(Boolean)
      if (ids.length === 1) {
        where.sparteId = ids[0]
      } else if (ids.length > 1) {
        where.sparteId = { in: ids }
      }
    }

    if (von || bis) {
      where.startzeit = {}
      if (von) (where.startzeit as Record<string, unknown>).gte = new Date(von)
      if (bis) (where.startzeit as Record<string, unknown>).lte = new Date(bis)
    }

    const termine = await prisma.termin.findMany({
      where,
      include: { sparte: { select: { id: true, name: true, slug: true } } },
      orderBy: { startzeit: 'asc' },
    })

    return apiSuccess(termine)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const body = await req.json()
    const parsed = terminCreateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const d = parsed.data

    // Spartenleiter/Kursleiter can only create for their own sparte
    if (user.role !== 'ADMIN') {
      if (d.sparteId && d.sparteId !== user.sparteId) {
        throw new ForbiddenError('Keine Berechtigung für diese Sparte')
      }
      if (!d.sparteId) {
        d.sparteId = user.sparteId || undefined
      }
    }

    const termin = await prisma.termin.create({
      data: {
        titel: d.titel,
        beschreibung: d.beschreibung || null,
        startzeit: new Date(d.startzeit),
        endzeit: d.endzeit ? new Date(d.endzeit) : null,
        ort: d.ort || null,
        ganztaegig: d.ganztaegig ?? false,
        sparteId: d.sparteId || null,
      },
    })

    return apiSuccess(termin, 201)
  } catch (err) {
    return apiError(err)
  }
}

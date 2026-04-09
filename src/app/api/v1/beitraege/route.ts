import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiPaginated, apiError } from '@/lib/api-response'
import { authenticateRequest } from '@/lib/auth-middleware'
import { beitragCreateSchema } from '@/lib/validations/beitrag'
import { ValidationError, UnauthorizedError } from '@/lib/api-error'
import { generateSlug } from '@/lib/slug'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const seite = Math.max(1, parseInt(searchParams.get('seite') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const sparteId = searchParams.get('sparteId')

    const where: Record<string, unknown> = { veroeffentlicht: true }
    if (sparteId) {
      where.sparteId = sparteId
    }

    const [beitraege, gesamt] = await Promise.all([
      prisma.beitrag.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (seite - 1) * limit,
        take: limit,
        include: {
          sparte: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.beitrag.count({ where }),
    ])

    return apiPaginated(beitraege, { seite, limit, gesamt })
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req)
    if (!user) {
      throw new UnauthorizedError()
    }

    const body = await req.json()
    const parsed = beitragCreateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Validierung fehlgeschlagen',
        parsed.error.issues.map((e) => ({ feld: e.path.join('.'), meldung: e.message }))
      )
    }

    const { titel, inhalt, auszug, bildUrl, sparteId, veroeffentlicht } = parsed.data

    // Auto-generate slug from title
    let slug = generateSlug(titel)
    const existing = await prisma.beitrag.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    // Non-admin users: auto-assign sparteId from their profile
    const effectiveSparteId = user.role === 'ADMIN' ? (sparteId ?? null) : (user.sparteId ?? null)

    const beitrag = await prisma.beitrag.create({
      data: {
        titel,
        slug,
        inhalt,
        auszug: auszug ?? null,
        bildUrl: bildUrl ?? null,
        sparteId: effectiveSparteId,
        authorId: user.id,
        veroeffentlicht: veroeffentlicht ?? false,
      },
      include: {
        sparte: { select: { id: true, name: true, slug: true } },
      },
    })

    return apiSuccess(beitrag, 201)
  } catch (err) {
    return apiError(err)
  }
}

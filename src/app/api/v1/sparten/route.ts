import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { requireRole } from '@/lib/auth-middleware'
import { sparteCreateSchema } from '@/lib/validations/sparte'
import { ValidationError } from '@/lib/api-error'
import { generateSlug } from '@/lib/slug'

export async function GET() {
  try {
    const sparten = await prisma.sparte.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        trainingszeiten: { orderBy: { wochentag: 'asc' } },
        ansprechpartner: true,
      },
    })

    return apiSuccess(sparten)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const authenticate = requireRole('ADMIN')
    await authenticate(req)

    const body = await req.json()
    const parsed = sparteCreateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Validierung fehlgeschlagen',
        parsed.error.issues.map((e) => ({ feld: e.path.join('.'), meldung: e.message }))
      )
    }

    const { name, typ } = parsed.data
    let slug = generateSlug(name)

    // Ensure slug uniqueness
    const existing = await prisma.sparte.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const sparte = await prisma.sparte.create({
      data: {
        name,
        slug,
        typ: typ ?? 'SPARTE',
      },
    })

    return apiSuccess(sparte, 201)
  } catch (err) {
    return apiError(err)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'
import { terminUpdateSchema } from '@/lib/validations/termin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const termin = await prisma.termin.findUnique({
      where: { id },
      include: { sparte: { select: { id: true, name: true, slug: true } } },
    })
    if (!termin) throw new NotFoundError('Termin')
    return apiSuccess(termin)
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const { id } = await params
    const termin = await prisma.termin.findUnique({ where: { id } })
    if (!termin) throw new NotFoundError('Termin')

    // Spartenleiter can only edit their sparte's termine
    if (user.role !== 'ADMIN' && termin.sparteId !== user.sparteId) {
      throw new ForbiddenError()
    }

    const body = await req.json()
    const parsed = terminUpdateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.titel !== undefined) data.titel = parsed.data.titel
    if (parsed.data.beschreibung !== undefined) data.beschreibung = parsed.data.beschreibung || null
    if (parsed.data.startzeit !== undefined) data.startzeit = new Date(parsed.data.startzeit)
    if (parsed.data.endzeit !== undefined) data.endzeit = parsed.data.endzeit ? new Date(parsed.data.endzeit) : null
    if (parsed.data.ort !== undefined) data.ort = parsed.data.ort || null
    if (parsed.data.ganztaegig !== undefined) data.ganztaegig = parsed.data.ganztaegig
    if (parsed.data.sparteId !== undefined) data.sparteId = parsed.data.sparteId || null

    const updated = await prisma.termin.update({ where: { id }, data })

    return apiSuccess(updated)
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const { id } = await params
    const termin = await prisma.termin.findUnique({ where: { id } })
    if (!termin) throw new NotFoundError('Termin')

    if (user.role !== 'ADMIN' && termin.sparteId !== user.sparteId) {
      throw new ForbiddenError()
    }

    await prisma.termin.delete({ where: { id } })

    return apiSuccess({ deleted: true })
  } catch (err) {
    return apiError(err)
  }
}

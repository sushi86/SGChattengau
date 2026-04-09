import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { authenticateRequest } from '@/lib/auth-middleware'
import { beitragUpdateSchema } from '@/lib/validations/beitrag'
import { ValidationError, NotFoundError, ForbiddenError, UnauthorizedError } from '@/lib/api-error'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    const beitrag = await prisma.beitrag.findUnique({
      where: { id },
      include: {
        sparte: { select: { id: true, name: true, slug: true } },
      },
    })

    if (!beitrag) {
      throw new NotFoundError('Beitrag')
    }

    return apiSuccess(beitrag)
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const user = await authenticateRequest(req)
    if (!user) {
      throw new UnauthorizedError()
    }

    const beitrag = await prisma.beitrag.findUnique({ where: { id } })
    if (!beitrag) {
      throw new NotFoundError('Beitrag')
    }

    // Only author or admin can edit
    if (user.role !== 'ADMIN' && beitrag.authorId !== user.id) {
      throw new ForbiddenError('Nur der Autor oder ein Administrator kann diesen Beitrag bearbeiten')
    }

    const body = await req.json()
    const parsed = beitragUpdateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Validierung fehlgeschlagen',
        parsed.error.issues.map((e) => ({ feld: e.path.join('.'), meldung: e.message }))
      )
    }

    const updated = await prisma.beitrag.update({
      where: { id },
      data: parsed.data,
      include: {
        sparte: { select: { id: true, name: true, slug: true } },
      },
    })

    return apiSuccess(updated)
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const user = await authenticateRequest(req)
    if (!user) {
      throw new UnauthorizedError()
    }

    const beitrag = await prisma.beitrag.findUnique({ where: { id } })
    if (!beitrag) {
      throw new NotFoundError('Beitrag')
    }

    // Only author or admin can delete
    if (user.role !== 'ADMIN' && beitrag.authorId !== user.id) {
      throw new ForbiddenError('Nur der Autor oder ein Administrator kann diesen Beitrag löschen')
    }

    await prisma.beitrag.delete({ where: { id } })

    return apiSuccess({ gelöscht: true })
  } catch (err) {
    return apiError(err)
  }
}

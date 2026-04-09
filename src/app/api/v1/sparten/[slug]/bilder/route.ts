import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { authenticateRequest } from '@/lib/auth-middleware'
import { saveUploadedFile } from '@/lib/upload'
import { NotFoundError, ForbiddenError, UnauthorizedError, ValidationError } from '@/lib/api-error'

type RouteParams = { params: Promise<{ slug: string }> }

export async function POST(
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

    if (user.role !== 'ADMIN') {
      if (user.sparteId !== sparte.id) {
        throw new ForbiddenError('Keine Berechtigung für diese Sparte')
      }
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      throw new ValidationError('Keine Datei hochgeladen')
    }

    const { url } = await saveUploadedFile(file)

    const alt = (formData.get('alt') as string) || null
    const sortOrder = parseInt((formData.get('sortOrder') as string) || '0', 10)

    const bild = await prisma.sparteBild.create({
      data: {
        sparteId: sparte.id,
        url,
        alt,
        sortOrder,
      },
    })

    return apiSuccess(bild, 201)
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(
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

    if (user.role !== 'ADMIN') {
      if (user.sparteId !== sparte.id) {
        throw new ForbiddenError('Keine Berechtigung für diese Sparte')
      }
    }

    const bildId = req.nextUrl.searchParams.get('id')
    if (!bildId) {
      throw new ValidationError('Bild-ID fehlt')
    }

    const bild = await prisma.sparteBild.findFirst({
      where: { id: bildId, sparteId: sparte.id },
    })

    if (!bild) {
      throw new NotFoundError('Bild')
    }

    await prisma.sparteBild.delete({ where: { id: bildId } })

    return apiSuccess({ gelöscht: true })
  } catch (err) {
    return apiError(err)
  }
}

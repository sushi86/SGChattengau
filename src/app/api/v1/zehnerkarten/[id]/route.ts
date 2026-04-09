import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError } from '@/lib/api-error'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const karte = await prisma.zehnerkarte.findUnique({
      where: { id },
      include: {
        sparte: { select: { name: true, slug: true } },
        buchungen: {
          orderBy: { datum: 'desc' },
          select: { id: true, datum: true, anwesenheit: true },
        },
        zahlung: { select: { status: true } },
      },
    })

    if (!karte) throw new NotFoundError('10er-Karte')

    return apiSuccess(karte)
  } catch (err) {
    return apiError(err)
  }
}

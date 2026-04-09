import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError } from '@/lib/api-error'
import { requireRole } from '@/lib/auth-middleware'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const checkAdmin = requireRole('ADMIN')
    await checkAdmin(req)

    const { id } = await params
    const buchung = await prisma.buchung.findUnique({ where: { id } })
    if (!buchung) throw new NotFoundError('Buchung')

    return apiSuccess(buchung)
  } catch (err) {
    return apiError(err)
  }
}

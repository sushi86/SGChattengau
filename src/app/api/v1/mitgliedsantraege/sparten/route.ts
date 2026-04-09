import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET() {
  try {
    const sparten = await prisma.sparte.findMany({
      where: { isActive: true },
      select: { id: true, name: true, typ: true },
      orderBy: { sortOrder: 'asc' },
    })

    return apiSuccess(sparten)
  } catch (err) {
    return apiError(err)
  }
}

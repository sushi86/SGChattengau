import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const von = url.searchParams.get('von')
    const bis = url.searchParams.get('bis')

    const where: Record<string, unknown> = {
      status: { in: ['ANGEFRAGT', 'GENEHMIGT'] },
    }

    if (von || bis) {
      where.datum = {}
      if (von) (where.datum as Record<string, unknown>).gte = new Date(von)
      if (bis) (where.datum as Record<string, unknown>).lte = new Date(bis)
    }

    const buchungen = await prisma.buchung.findMany({
      where,
      select: {
        datum: true,
        startzeit: true,
        endzeit: true,
        status: true,
        // Keine persönlichen Daten!
      },
      orderBy: { datum: 'asc' },
    })

    return apiSuccess(buchungen)
  } catch (err) {
    return apiError(err)
  }
}

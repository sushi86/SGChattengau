import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET() {
  try {
    const kurse = await prisma.sparte.findMany({
      where: { typ: 'KURS', isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        trainingszeiten: { orderBy: { wochentag: 'asc' } },
        ansprechpartner: true,
        _count: {
          select: {
            kursBuchungen: {
              where: { anwesenheit: { not: 'STORNIERT' } },
            },
          },
        },
      },
    })

    const result = kurse.map((k) => ({
      ...k,
      freiePlaetze: k.maxTeilnehmer ? k.maxTeilnehmer - k._count.kursBuchungen : null,
    }))

    return apiSuccess(result)
  } catch (err) {
    return apiError(err)
  }
}

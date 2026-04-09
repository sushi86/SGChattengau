import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, ValidationError } from '@/lib/api-error'
import { kursBuchungSchema } from '@/lib/validations/kurs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const kurs = await prisma.sparte.findUnique({ where: { slug } })

    if (!kurs || kurs.typ !== 'KURS') throw new NotFoundError('Kurs')

    const body = await req.json()
    const parsed = kursBuchungSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const d = parsed.data

    // Buchung nur mit 10er-Karte möglich
    const karte = await prisma.zehnerkarte.findUnique({ where: { id: d.zehnerkarteId } })
    if (!karte || karte.sparteId !== kurs.id) {
      throw new ValidationError('Ungültige 10er-Karte')
    }
    if (karte.verbleibend <= 0) {
      throw new ValidationError('10er-Karte ist aufgebraucht')
    }

    const [buchung] = await prisma.$transaction([
      prisma.kursBuchung.create({
        data: {
          sparteId: kurs.id,
          teilnehmerVorname: d.vorname,
          teilnehmerNachname: d.nachname,
          teilnehmerEmail: d.email,
          datum: new Date(d.datum),
          zehnerkarteId: karte.id,
        },
      }),
      prisma.zehnerkarte.update({
        where: { id: karte.id },
        data: { verbleibend: { decrement: 1 } },
      }),
    ])

    return apiSuccess({ id: buchung.id, type: 'zehnerkarte' }, 201)
  } catch (err) {
    return apiError(err)
  }
}

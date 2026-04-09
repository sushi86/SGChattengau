import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, ValidationError } from '@/lib/api-error'
import { zehnerkarteKaufSchema } from '@/lib/validations/kurs'
import { createCheckout } from '@/lib/sumup'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const kurs = await prisma.sparte.findUnique({ where: { slug } })

    if (!kurs || kurs.typ !== 'KURS') throw new NotFoundError('Kurs')

    const body = await req.json()
    const parsed = zehnerkarteKaufSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const d = parsed.data

    const preis = d.istMitglied ? kurs.preisZehnerkarteMitglied : kurs.preisZehnerkarteGast

    if (!preis || preis <= 0) {
      throw new ValidationError('Für diesen Kurs sind keine 10er-Karten verfügbar')
    }

    const zahlung = await prisma.zahlung.create({
      data: {
        betrag: preis,
        typ: 'ZEHNERKARTE',
        status: 'AUSSTEHEND',
      },
    })

    const karte = await prisma.zehnerkarte.create({
      data: {
        sparteId: kurs.id,
        kaeuferVorname: d.vorname,
        kaeuferNachname: d.nachname,
        kaeuferEmail: d.email,
        istMitglied: d.istMitglied,
        preis,
        zahlungId: zahlung.id,
      },
    })

    try {
      const checkout = await createCheckout({
        amount: preis,
        description: `10er-Karte ${kurs.name}`,
        referenceId: zahlung.id,
      })

      await prisma.zahlung.update({
        where: { id: zahlung.id },
        data: { sumupCheckoutId: checkout.id },
      })

      return apiSuccess({ id: karte.id, type: 'payment', checkoutUrl: `https://pay.sumup.com/b2c/Q${checkout.id}` }, 201)
    } catch {
      // SumUp nicht konfiguriert
      return apiSuccess({ id: karte.id, type: 'pending_payment' }, 201)
    }
  } catch (err) {
    return apiError(err)
  }
}

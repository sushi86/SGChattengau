import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, ValidationError } from '@/lib/api-error'

// GET: 10er-Karten für eine E-Mail-Adresse abfragen (public)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const kurs = await prisma.sparte.findUnique({ where: { slug } })
    if (!kurs || kurs.typ !== 'KURS') throw new NotFoundError('Kurs')

    const url = new URL(req.url)
    const email = url.searchParams.get('email')
    if (!email) throw new ValidationError('E-Mail-Adresse fehlt')

    const emailNorm = email.toLowerCase().trim()

    // Karten für diesen Kurs
    const karten = await prisma.zehnerkarte.findMany({
      where: { sparteId: kurs.id, kaeuferEmail: emailNorm },
      select: {
        id: true,
        kaeuferVorname: true,
        kaeuferNachname: true,
        verbleibend: true,
        preis: true,
        istMitglied: true,
        zahlung: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Wenn keine Karten für diesen Kurs: Karten bei anderen Kursen suchen
    let andereKurse: { kursName: string; kursSlug: string; anzahl: number }[] = []
    if (karten.length === 0) {
      const andereKarten = await prisma.zehnerkarte.findMany({
        where: { kaeuferEmail: emailNorm, sparteId: { not: kurs.id }, verbleibend: { gt: 0 } },
        select: { sparte: { select: { name: true, slug: true } } },
      })
      const grouped = new Map<string, { kursName: string; kursSlug: string; anzahl: number }>()
      for (const k of andereKarten) {
        const key = k.sparte.slug
        if (!grouped.has(key)) {
          grouped.set(key, { kursName: k.sparte.name, kursSlug: k.sparte.slug, anzahl: 0 })
        }
        grouped.get(key)!.anzahl++
      }
      andereKurse = Array.from(grouped.values())
    }

    return apiSuccess({ karten, andereKurse })
  } catch (err) {
    return apiError(err)
  }
}

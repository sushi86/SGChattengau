import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiPaginated, apiError } from '@/lib/api-response'
import { ValidationError } from '@/lib/api-error'
import { requireRole } from '@/lib/auth-middleware'
import { buchungAnfrageSchema } from '@/lib/validations/buchung'
import { sendMail } from '@/lib/email'
import { renderBuchungBestaetigung } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = buchungAnfrageSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const d = parsed.data

    // Honeypot
    if (d.website && d.website.length > 0) {
      return apiSuccess({ id: 'ok' }, 201)
    }

    const buchung = await prisma.buchung.create({
      data: {
        name: d.name,
        email: d.email,
        telefon: d.telefon || null,
        datum: new Date(d.datum),
        startzeit: 'Ganztags',
        endzeit: 'Ganztags',
        anlass: d.anlass,
        nachricht: d.nachricht || null,
      },
    })

    // Bestätigung an Anfragenden (fire-and-forget)
    const formatDatum = new Date(d.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const emailData = { name: d.name, email: d.email, datum: formatDatum, startzeit: 'Ganztags', endzeit: 'Ganztags', anlass: d.anlass }
    const mail = renderBuchungBestaetigung(emailData)
    sendMail({ to: d.email, ...mail }).catch((err) => console.error('E-Mail-Fehler:', err))

    return apiSuccess({ id: buchung.id }, 201)
  } catch (err) {
    return apiError(err)
  }
}

export async function GET(req: NextRequest) {
  try {
    const checkAdmin = requireRole('ADMIN')
    await checkAdmin(req)

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const seite = parseInt(url.searchParams.get('seite') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [buchungen, gesamt] = await Promise.all([
      prisma.buchung.findMany({
        where,
        orderBy: { datum: 'desc' },
        skip: (seite - 1) * limit,
        take: limit,
      }),
      prisma.buchung.count({ where }),
    ])

    return apiPaginated(buchungen, { seite, limit, gesamt })
  } catch (err) {
    return apiError(err)
  }
}

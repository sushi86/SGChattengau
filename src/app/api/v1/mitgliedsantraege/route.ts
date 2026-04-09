import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt, extractLast4 } from '@/lib/encryption'
import { apiSuccess, apiPaginated, apiError } from '@/lib/api-response'
import { ValidationError } from '@/lib/api-error'
import { antragSubmitSchema } from '@/lib/validations/mitgliedsantrag'
import { requireRole } from '@/lib/auth-middleware'
import { sendMail } from '@/lib/email'
import { renderAntragBestaetigung, renderAntragBenachrichtigung } from '@/lib/email-templates'

// POST: Neuen Antrag einreichen (öffentlich)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = antragSubmitSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }))
      )
    }

    const d = parsed.data

    // Honeypot check
    if (d.website && d.website.length > 0) {
      // Silently accept but don't save (bot trap)
      return apiSuccess({ id: 'ok' }, 201)
    }

    // Encrypt sensitive fields
    const ibanClean = d.iban.replace(/\s/g, '')
    const ibanEncrypted = encrypt(ibanClean)
    const ibanLast4 = extractLast4(ibanClean)
    const kontoinhaberEncrypted = encrypt(d.kontoinhaber)
    const signaturMitgliedEncrypted = d.signaturMitglied ? encrypt(d.signaturMitglied) : null
    const signaturSepaEncrypted = d.signaturSepa ? encrypt(d.signaturSepa) : null
    const signaturErzBerechEncrypted = d.signaturErzBerech ? encrypt(d.signaturErzBerech) : null

    const antrag = await prisma.mitgliedsantrag.create({
      data: {
        vorname: d.vorname,
        nachname: d.nachname,
        geburtsdatum: new Date(d.geburtsdatum),
        geschlecht: d.geschlecht,
        strasse: d.strasse,
        plz: d.plz,
        ort: d.ort,
        telefon: d.telefon || null,
        email: d.email,
        erziehungsberechtigter: d.erziehungsberechtigter || null,
        sparteId: d.sparteId,
        eintrittsdatum: new Date(d.eintrittsdatum),
        ibanEncrypted,
        ibanLast4,
        kontoinhaberEncrypted,
        kreditinstitut: d.kreditinstitut,
        signaturMitgliedEncrypted,
        signaturSepaEncrypted,
        signaturErzBerechEncrypted,
        satzungAkzeptiert: d.satzungAkzeptiert,
        datenschutzAkzeptiert: d.datenschutzAkzeptiert,
        sepaAkzeptiert: d.sepaAkzeptiert,
        ipAdresse: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        userAgent: req.headers.get('user-agent') || null,
      },
    })

    // E-Mail-Benachrichtigungen (fire-and-forget, Fehler dürfen den Antrag nicht blockieren)
    const sparteName = (await prisma.sparte.findUnique({ where: { id: d.sparteId }, select: { name: true } }))?.name || ''
    const emailData = { vorname: d.vorname, nachname: d.nachname, email: d.email, sparteName, eintrittsdatum: d.eintrittsdatum }

    const bestaetigung = renderAntragBestaetigung(emailData)
    const benachrichtigung = renderAntragBenachrichtigung(emailData)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sg1898chattengau.de'

    // Fire-and-forget
    Promise.all([
      sendMail({ to: d.email, ...bestaetigung }),
      sendMail({ to: adminEmail, ...benachrichtigung }),
    ]).catch((err) => console.error('E-Mail-Versand fehlgeschlagen:', err))

    return apiSuccess({ id: antrag.id }, 201)
  } catch (err) {
    return apiError(err)
  }
}

// GET: Antragsliste (nur Admin)
export async function GET(req: NextRequest) {
  try {
    const checkAdmin = requireRole('ADMIN')
    await checkAdmin(req)

    const url = new URL(req.url)
    const seite = parseInt(url.searchParams.get('seite') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const status = url.searchParams.get('status')
    const sparteId = url.searchParams.get('sparte')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (sparteId) where.sparteId = sparteId

    const [antraege, gesamt] = await Promise.all([
      prisma.mitgliedsantrag.findMany({
        where,
        include: { sparte: { select: { name: true, typ: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (seite - 1) * limit,
        take: limit,
      }),
      prisma.mitgliedsantrag.count({ where }),
    ])

    // Strip encrypted fields from list view
    const safe = antraege.map((a) => ({
      id: a.id,
      status: a.status,
      vorname: a.vorname,
      nachname: a.nachname,
      email: a.email,
      geburtsdatum: a.geburtsdatum,
      geschlecht: a.geschlecht,
      sparte: a.sparte,
      ibanLast4: a.ibanLast4,
      createdAt: a.createdAt,
      bearbeitetAm: a.bearbeitetAm,
      exportiertAm: a.exportiertAm,
    }))

    return apiPaginated(safe, { seite, limit, gesamt })
  } catch (err) {
    return apiError(err)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { apiError } from '@/lib/api-response'
import { requireRole } from '@/lib/auth-middleware'

function formatDate(date: Date): string {
  const d = new Date(date)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

function escapeCSV(value: string | null | undefined): string {
  if (!value) return ''
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET(req: NextRequest) {
  try {
    const checkAdmin = requireRole('ADMIN')
    await checkAdmin(req)

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const sparteId = url.searchParams.get('sparte')
    const nurNeue = url.searchParams.get('nur_neue') === 'true'

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (sparteId) where.sparteId = sparteId
    if (nurNeue) where.exportiertAm = null

    const antraege = await prisma.mitgliedsantrag.findMany({
      where,
      include: { sparte: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    })

    // CSV header (Vereinsmeister-kompatibel, Semikolon-getrennt)
    const header = 'Nachname;Vorname;Strasse;PLZ;Ort;Geburtsdatum;Geschlecht;Telefon;Email;Eintrittsdatum;Sparte;IBAN;Kontoinhaber;Kreditinstitut;Mandatsreferenz;Erziehungsberechtigter'

    const rows = antraege.map((a) => {
      const iban = decrypt(a.ibanEncrypted)
      const kontoinhaber = decrypt(a.kontoinhaberEncrypted)

      return [
        escapeCSV(a.nachname),
        escapeCSV(a.vorname),
        escapeCSV(a.strasse),
        escapeCSV(a.plz),
        escapeCSV(a.ort),
        formatDate(a.geburtsdatum),
        a.geschlecht,
        escapeCSV(a.telefon),
        escapeCSV(a.email),
        formatDate(a.eintrittsdatum),
        escapeCSV(a.sparte.name),
        iban,
        escapeCSV(kontoinhaber),
        escapeCSV(a.kreditinstitut),
        '', // Mandatsreferenz — wird vom Vereinsmeister generiert
        escapeCSV(a.erziehungsberechtigter),
      ].join(';')
    })

    // Mark as exported
    if (antraege.length > 0) {
      await prisma.mitgliedsantrag.updateMany({
        where: { id: { in: antraege.map((a) => a.id) } },
        data: { exportiertAm: new Date() },
      })
    }

    // UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF'
    const csv = bom + header + '\n' + rows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="mitglieder-export-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-cache, no-store',
      },
    })
  } catch (err) {
    return apiError(err)
  }
}

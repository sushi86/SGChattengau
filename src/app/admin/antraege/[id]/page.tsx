import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { AntragDetailView } from '@/components/admin/antrag-detail'

export default async function AntragDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login')

  const { id } = await params

  const antrag = await prisma.mitgliedsantrag.findUnique({
    where: { id },
    include: { sparte: { select: { name: true, typ: true } } },
  })

  if (!antrag) redirect('/admin/antraege')

  // Decrypt sensitive fields server-side
  const decrypted = {
    id: antrag.id,
    status: antrag.status,
    vorname: antrag.vorname,
    nachname: antrag.nachname,
    strasse: antrag.strasse,
    plz: antrag.plz,
    ort: antrag.ort,
    telefon: antrag.telefon,
    email: antrag.email,
    geschlecht: antrag.geschlecht,
    erziehungsberechtigter: antrag.erziehungsberechtigter,
    sparte: antrag.sparte,
    ibanLast4: antrag.ibanLast4,
    kreditinstitut: antrag.kreditinstitut,
    satzungAkzeptiert: antrag.satzungAkzeptiert,
    datenschutzAkzeptiert: antrag.datenschutzAkzeptiert,
    sepaAkzeptiert: antrag.sepaAkzeptiert,
    ipAdresse: antrag.ipAdresse,
    userAgent: antrag.userAgent,
    // Serialize dates to ISO strings
    geburtsdatum: antrag.geburtsdatum.toISOString(),
    eintrittsdatum: antrag.eintrittsdatum.toISOString(),
    createdAt: antrag.createdAt.toISOString(),
    bearbeitetAm: antrag.bearbeitetAm?.toISOString() || null,
    // Decrypt sensitive fields
    iban: decrypt(antrag.ibanEncrypted),
    kontoinhaber: decrypt(antrag.kontoinhaberEncrypted),
    signaturMitglied: antrag.signaturMitgliedEncrypted ? decrypt(antrag.signaturMitgliedEncrypted) : null,
    signaturSepa: antrag.signaturSepaEncrypted ? decrypt(antrag.signaturSepaEncrypted) : null,
    signaturErzBerech: antrag.signaturErzBerechEncrypted ? decrypt(antrag.signaturErzBerechEncrypted) : null,
  }

  return (
    <div>
      <Link
        href="/admin/antraege"
        className="text-sm text-primary hover:text-primary-hover mb-4 inline-block"
      >
        ← Zurück zur Liste
      </Link>
      <AntragDetailView antrag={decrypted} />
    </div>
  )
}

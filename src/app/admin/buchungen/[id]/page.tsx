import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BuchungDetailView } from '@/components/admin/buchung-detail'

export default async function BuchungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login')

  const { id } = await params

  const buchung = await prisma.buchung.findUnique({
    where: { id },
  })

  if (!buchung) redirect('/admin/buchungen')

  const serialized = {
    id: buchung.id,
    status: buchung.status,
    name: buchung.name,
    email: buchung.email,
    telefon: buchung.telefon,
    datum: buchung.datum.toISOString(),
    startzeit: buchung.startzeit,
    endzeit: buchung.endzeit,
    anlass: buchung.anlass,
    nachricht: buchung.nachricht,
    bearbeitetAm: buchung.bearbeitetAm?.toISOString() || null,
    createdAt: buchung.createdAt.toISOString(),
  }

  return (
    <div>
      <Link
        href="/admin/buchungen"
        className="text-sm text-primary hover:text-primary-hover mb-4 inline-block"
      >
        ← Zurück zur Liste
      </Link>
      <BuchungDetailView buchung={serialized} />
    </div>
  )
}

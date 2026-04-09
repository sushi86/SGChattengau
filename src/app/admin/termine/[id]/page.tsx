import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TerminForm } from '@/components/admin/termin-form'

export default async function TerminEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params

  const termin = await prisma.termin.findUnique({ where: { id } })
  if (!termin) notFound()

  // Spartenleiter can only edit termine of their own sparte
  if (session.user.role !== 'ADMIN') {
    if (!session.user.sparteId || termin.sparteId !== session.user.sparteId) {
      redirect('/admin/termine')
    }
  }

  const sparten = await prisma.sparte.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  // Serialize dates to ISO strings for the client component
  const terminData = {
    id: termin.id,
    titel: termin.titel,
    beschreibung: termin.beschreibung,
    startzeit: termin.startzeit.toISOString(),
    endzeit: termin.endzeit?.toISOString() ?? null,
    ort: termin.ort,
    ganztaegig: termin.ganztaegig,
    sparteId: termin.sparteId,
  }

  return (
    <div>
      <Link href="/admin/termine" className="text-sm text-primary hover:text-primary-hover mb-4 inline-block">
        &larr; Zurück zur Liste
      </Link>
      <h1 className="font-heading text-h1 text-text-heading mb-6">Termin bearbeiten</h1>
      <div className="bg-white p-6 rounded-lg border border-border max-w-3xl">
        <TerminForm termin={terminData} sparten={sparten} />
      </div>
    </div>
  )
}

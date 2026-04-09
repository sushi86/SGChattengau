import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { KursTeilnehmer } from '@/components/admin/kurs-teilnehmer'

export default async function KursDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params
  const kurs = await prisma.sparte.findUnique({ where: { id } })
  if (!kurs || kurs.typ !== 'KURS') notFound()

  if (session.user.role !== 'ADMIN' && session.user.sparteId !== kurs.id) {
    redirect('/admin/kurse')
  }

  return (
    <div>
      {session.user.role === 'ADMIN' && (
        <Link href="/admin/kurse" className="text-sm text-primary hover:text-primary-hover mb-4 inline-block">
          ← Zurück zur Übersicht
        </Link>
      )}
      <h1 className="font-heading text-h1 text-text-heading mb-6">{kurs.name} — 10er-Karten</h1>
      <KursTeilnehmer sparteId={kurs.id} kursName={kurs.name} />
    </div>
  )
}

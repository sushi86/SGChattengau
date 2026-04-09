import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Spartenleiter/Kursleiter: direkt zur eigenen Sparte
  if (session.user.role !== 'ADMIN' && session.user.sparteId) {
    redirect(`/admin/sparten/${session.user.sparteId}`)
  }

  const [antragCount, neueAntraege, buchungCount, neueBuchungen] = await Promise.all([
    prisma.mitgliedsantrag.count(),
    prisma.mitgliedsantrag.count({ where: { status: 'EINGEGANGEN' } }),
    prisma.buchung.count(),
    prisma.buchung.count({ where: { status: 'ANGEFRAGT' } }),
  ])

  return (
    <div>
      <h1 className="font-heading text-h1 text-text-heading mb-6">Admin-Dashboard</h1>
      <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-border">
          <p className="text-sm text-text-body">Mitgliedsanträge</p>
          <p className="text-3xl font-bold text-text-heading mt-1">{antragCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <p className="text-sm text-text-body">Neue Anträge</p>
          <p className="text-3xl font-bold text-primary mt-1">{neueAntraege}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <p className="text-sm text-text-body">Vereinsheim-Buchungen</p>
          <p className="text-3xl font-bold text-text-heading mt-1">{buchungCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <p className="text-sm text-text-body">Offene Buchungsanfragen</p>
          <p className="text-3xl font-bold text-primary mt-1">{neueBuchungen}</p>
        </div>
      </div>
    </div>
  )
}

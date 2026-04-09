import { prisma } from '@/lib/prisma'

export default async function AdminDashboardPage() {
  const [antragCount, neueAntraege] = await Promise.all([
    prisma.mitgliedsantrag.count(),
    prisma.mitgliedsantrag.count({ where: { status: 'EINGEGANGEN' } }),
  ])

  return (
    <div>
      <h1 className="font-heading text-h1 text-text-heading mb-6">Admin-Dashboard</h1>
      <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-border">
          <p className="text-sm text-text-body">Mitgliedsanträge gesamt</p>
          <p className="text-3xl font-bold text-text-heading mt-1">{antragCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <p className="text-sm text-text-body">Neue Anträge</p>
          <p className="text-3xl font-bold text-primary mt-1">{neueAntraege}</p>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function AdminSpartenPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Spartenleiter: redirect to their sparte
  if (session.user.role !== 'ADMIN' && session.user.sparteId) {
    const sparte = await prisma.sparte.findFirst({
      where: { id: session.user.sparteId },
      select: { id: true },
    })
    if (sparte) redirect(`/admin/sparten/${sparte.id}`)
  }

  const sparten = await prisma.sparte.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { trainingszeiten: true, ansprechpartner: true, bilder: true } },
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-h1 text-text-heading">Sparten-Verwaltung</h1>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-section-alt">
              <th className="text-left p-3 font-medium text-text-heading">Name</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Typ</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Status</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Inhalte</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {sparten.map((s) => (
              <tr key={s.id} className="border-b border-border-light hover:bg-section-alt">
                <td className="p-3 font-medium text-text-heading">{s.name}</td>
                <td className="p-3 hidden tablet:table-cell text-text-body">
                  {s.typ === 'KURS' ? 'Kurs' : 'Sparte'}
                </td>
                <td className="p-3 hidden tablet:table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {s.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="p-3 hidden tablet:table-cell text-text-body text-xs">
                  {s._count.trainingszeiten} Zeiten · {s._count.ansprechpartner} Kontakte · {s._count.bilder} Bilder
                </td>
                <td className="p-3">
                  <Link href={`/admin/sparten/${s.id}`} className="text-primary hover:text-primary-hover text-sm">
                    Bearbeiten
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

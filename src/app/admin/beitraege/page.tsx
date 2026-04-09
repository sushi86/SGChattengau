import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'

export default async function AdminBeitraegePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const where: Record<string, unknown> = {}
  // Spartenleiter: only their own sparte's articles or their authored ones
  if (session.user.role !== 'ADMIN') {
    where.OR = [
      { authorId: session.user.id },
      ...(session.user.sparteId ? [{ sparteId: session.user.sparteId }] : []),
    ]
  }

  const beitraege = await prisma.beitrag.findMany({
    where,
    include: { sparte: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-h1 text-text-heading">Beiträge</h1>
        <Link href="/admin/beitraege/neu">
          <Button className="text-sm">+ Neuer Beitrag</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-section-alt">
              <th className="text-left p-3 font-medium text-text-heading">Titel</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Sparte</th>
              <th className="text-left p-3 font-medium text-text-heading">Status</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Datum</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {beitraege.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-body">Keine Beiträge vorhanden.</td></tr>
            ) : (
              beitraege.map((b) => (
                <tr key={b.id} className="border-b border-border-light hover:bg-section-alt">
                  <td className="p-3 font-medium text-text-heading">{b.titel}</td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">{b.sparte?.name || '—'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.veroeffentlicht ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {b.veroeffentlicht ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">
                    {b.createdAt.toLocaleDateString('de-DE')}
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/beitraege/${b.id}`} className="text-primary hover:text-primary-hover text-sm">
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

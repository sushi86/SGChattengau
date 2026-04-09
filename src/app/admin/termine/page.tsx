import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'

export default async function AdminTerminePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const where: Record<string, unknown> = {}
  // Spartenleiter: only their own sparte's termine
  if (session.user.role !== 'ADMIN') {
    if (session.user.sparteId) {
      where.sparteId = session.user.sparteId
    } else {
      // No sparte assigned — show nothing
      where.id = 'none'
    }
  }

  const termine = await prisma.termin.findMany({
    where,
    include: { sparte: { select: { name: true } } },
    orderBy: { startzeit: 'asc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-h1 text-text-heading">Termine</h1>
        <Link href="/admin/termine/neu">
          <Button className="text-sm">+ Neuer Termin</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-section-alt">
              <th className="text-left p-3 font-medium text-text-heading">Titel</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Sparte</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Startzeit</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Ort</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {termine.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-body">Keine Termine vorhanden.</td></tr>
            ) : (
              termine.map((t) => (
                <tr key={t.id} className="border-b border-border-light hover:bg-section-alt">
                  <td className="p-3 font-medium text-text-heading">{t.titel}</td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">{t.sparte?.name || '—'}</td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">
                    {t.ganztaegig
                      ? t.startzeit.toLocaleDateString('de-DE')
                      : t.startzeit.toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">{t.ort || '—'}</td>
                  <td className="p-3">
                    <Link href={`/admin/termine/${t.id}`} className="text-primary hover:text-primary-hover text-sm">
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

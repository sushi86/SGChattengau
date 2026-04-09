import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function AdminKursePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Kursleiter: direkt zu ihrem Kurs
  if (session.user.role !== 'ADMIN' && session.user.sparteId) {
    const kurs = await prisma.sparte.findFirst({
      where: { id: session.user.sparteId, typ: 'KURS' },
    })
    if (kurs) redirect(`/admin/kurse/${kurs.id}`)
  }

  const kurse = await prisma.sparte.findMany({
    where: { typ: 'KURS' },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          kursBuchungen: { where: { anwesenheit: { not: 'STORNIERT' } } },
          zehnerkarten: true,
        },
      },
    },
  })

  return (
    <div>
      <h1 className="font-heading text-h1 text-text-heading mb-6">Kurse</h1>

      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-section-alt">
              <th className="text-left p-3 font-medium text-text-heading">Kurs</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">10er-Karte (Mitglied/Gast)</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Buchungen</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">10er-Karten</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {kurse.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-body">Keine Kurse vorhanden.</td></tr>
            ) : (
              kurse.map((k) => (
                <tr key={k.id} className="border-b border-border-light hover:bg-section-alt">
                  <td className="p-3 font-medium text-text-heading">{k.name}</td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">
                    {k.preisZehnerkarteMitglied != null && k.preisZehnerkarteGast != null
                      ? `${k.preisZehnerkarteMitglied.toFixed(2)} € / ${k.preisZehnerkarteGast.toFixed(2)} €`
                      : '—'}
                  </td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">{k._count.kursBuchungen}</td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">{k._count.zehnerkarten}</td>
                  <td className="p-3">
                    <Link href={`/admin/kurse/${k.id}`} className="text-primary hover:text-primary-hover text-sm">
                      Teilnehmer
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

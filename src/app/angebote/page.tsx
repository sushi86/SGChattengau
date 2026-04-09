import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Container } from '@/components/layout/container'
import { SparteCard } from '@/components/sparten/sparte-card'

export const metadata: Metadata = {
  title: 'Sportangebote',
  description: 'Alle Sparten und Kursangebote der SG 1898 Chattengau e.V.',
}

export default async function AngebotePage() {
  const sparten = await prisma.sparte.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      trainingszeiten: { orderBy: { wochentag: 'asc' } },
      bilder: { orderBy: { sortOrder: 'asc' }, take: 1 },
    },
  })

  const spartenList = sparten.filter((s) => s.typ === 'SPARTE')
  const kurseList = sparten.filter((s) => s.typ === 'KURS')

  return (
    <section className="py-8 tablet:py-12">
      <Container>
        <h1 className="font-heading text-h1 text-text-heading mb-8">Sportangebote</h1>

        {spartenList.length > 0 && (
          <div className="mb-12">
            <h2 className="font-heading text-h2 text-text-heading mb-4">Sparten</h2>
            <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
              {spartenList.map((s) => (
                <SparteCard key={s.id} {...s} />
              ))}
            </div>
          </div>
        )}

        {kurseList.length > 0 && (
          <div>
            <h2 className="font-heading text-h2 text-text-heading mb-4">Kurse</h2>
            <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
              {kurseList.map((s) => (
                <SparteCard key={s.id} {...s} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  )
}

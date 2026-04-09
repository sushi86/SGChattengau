import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Container } from '@/components/layout/container'
import { BeitragCard } from '@/components/beitraege/beitrag-card'

export const metadata: Metadata = {
  title: 'Aktuelles',
  description: 'Neuigkeiten aus dem Verein und den Sparten.',
}

export default async function AktuellesPage() {
  const beitraege = await prisma.beitrag.findMany({
    where: { veroeffentlicht: true },
    include: { sparte: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return (
    <section className="py-8 tablet:py-12">
      <Container>
        <h1 className="font-heading text-h1 text-text-heading mb-8">Aktuelles</h1>

        {beitraege.length === 0 ? (
          <p className="text-text-body">Noch keine Neuigkeiten vorhanden.</p>
        ) : (
          <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
            {beitraege.map((b) => (
              <BeitragCard
                key={b.id}
                titel={b.titel}
                slug={b.slug}
                auszug={b.auszug}
                bildUrl={b.bildUrl}
                sparte={b.sparte}
                createdAt={b.createdAt.toISOString()}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}

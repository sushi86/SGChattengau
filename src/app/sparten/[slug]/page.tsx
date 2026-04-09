import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Container } from '@/components/layout/container'
import { TrainingszeitenDisplay } from '@/components/sparten/trainingszeiten-display'
import { AnsprechpartnerDisplay } from '@/components/sparten/ansprechpartner-display'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const sparte = await prisma.sparte.findUnique({ where: { slug }, select: { name: true } })
  if (!sparte) return { title: 'Nicht gefunden' }
  return { title: sparte.name }
}

export default async function SpartePage({ params }: Props) {
  const { slug } = await params

  const sparte = await prisma.sparte.findUnique({
    where: { slug },
    include: {
      trainingszeiten: { orderBy: { wochentag: 'asc' } },
      ansprechpartner: true,
      bilder: { orderBy: { sortOrder: 'asc' } },
      beitraege: {
        where: { veroeffentlicht: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, titel: true, slug: true, auszug: true, createdAt: true },
      },
    },
  })

  if (!sparte || !sparte.isActive) notFound()

  return (
    <section className="py-8 tablet:py-12">
      <Container>
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="font-heading text-h1 text-text-heading">{sparte.name}</h1>
            {sparte.typ === 'KURS' && (
              <span className="text-sm bg-primary-light text-primary px-3 py-1 rounded-full">Kurs</span>
            )}
          </div>

          {/* Bilder */}
          {sparte.bilder.length > 0 && (
            <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 mb-6">
              {sparte.bilder.map((bild) => (
                <div key={bild.id} className="aspect-video relative rounded-lg overflow-hidden">
                  <Image
                    src={bild.url}
                    alt={bild.alt || sparte.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 tablet:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="tablet:col-span-2">
            {sparte.beschreibung && (
              <div
                className="prose prose-sm max-w-none text-text-body"
                dangerouslySetInnerHTML={{ __html: sparte.beschreibung }}
              />
            )}

            {/* News der Sparte */}
            {sparte.beitraege.length > 0 && (
              <div className="mt-8">
                <h3 className="font-heading text-h3 text-text-heading mb-3">Aktuelles</h3>
                <div className="space-y-3">
                  {sparte.beitraege.map((b) => (
                    <a key={b.id} href={`/aktuelles/${b.slug}`} className="block p-3 bg-white rounded-md border border-border hover:border-primary transition-colors">
                      <p className="font-medium text-text-heading">{b.titel}</p>
                      {b.auszug && <p className="text-sm text-text-body mt-1">{b.auszug}</p>}
                      <p className="text-xs text-text-body mt-1">{new Date(b.createdAt).toLocaleDateString('de-DE')}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TrainingszeitenDisplay trainingszeiten={sparte.trainingszeiten} />
            <AnsprechpartnerDisplay ansprechpartner={sparte.ansprechpartner} />
          </div>
        </div>
      </Container>
    </section>
  )
}

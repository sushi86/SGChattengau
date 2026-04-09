import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Container } from '@/components/layout/container'
import { TrainingszeitenDisplay } from '@/components/sparten/trainingszeiten-display'
import { AnsprechpartnerDisplay } from '@/components/sparten/ansprechpartner-display'
import { KursBuchungCard } from '@/components/kurse/kurs-buchung-card'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const kurs = await prisma.sparte.findUnique({ where: { slug }, select: { name: true } })
  if (!kurs) return { title: 'Nicht gefunden' }
  return { title: kurs.name }
}

export default async function KursPage({ params }: Props) {
  const { slug } = await params

  const kurs = await prisma.sparte.findUnique({
    where: { slug },
    include: {
      trainingszeiten: { orderBy: { wochentag: 'asc' } },
      ansprechpartner: true,
      bilder: { orderBy: { sortOrder: 'asc' } },
      _count: {
        select: {
          kursBuchungen: { where: { anwesenheit: { not: 'STORNIERT' } } },
        },
      },
    },
  })

  if (!kurs || kurs.typ !== 'KURS' || !kurs.isActive) notFound()

  const freiePlaetze = kurs.maxTeilnehmer ? kurs.maxTeilnehmer - kurs._count.kursBuchungen : null

  return (
    <section className="py-8 tablet:py-12">
      <Container>
        <div className="grid grid-cols-1 tablet:grid-cols-3 gap-8">
          {/* Hauptinhalt */}
          <div className="tablet:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="font-heading text-h1 text-text-heading">{kurs.name}</h1>
              <span className="text-sm bg-primary-light text-primary px-3 py-1 rounded-full">Kurs</span>
            </div>

            {kurs.beschreibung && (
              <div
                className="prose prose-sm max-w-none text-text-body mb-8"
                dangerouslySetInnerHTML={{ __html: kurs.beschreibung }}
              />
            )}

            {/* Preisinfo */}
            {(kurs.preisZehnerkarteMitglied !== null || kurs.preisZehnerkarteGast !== null) && (
              <div className="bg-section-alt p-4 rounded-lg mb-8">
                <h3 className="font-heading text-h3 text-text-heading mb-2">Preise</h3>
                <div className="space-y-1 text-text-body">
                  {kurs.preisZehnerkarteMitglied !== null && kurs.preisZehnerkarteMitglied > 0 && (
                    <p>10er-Karte Mitglied: <strong>{kurs.preisZehnerkarteMitglied.toFixed(2)} €</strong></p>
                  )}
                  {kurs.preisZehnerkarteGast !== null && kurs.preisZehnerkarteGast > 0 && (
                    <p>10er-Karte Gast: <strong>{kurs.preisZehnerkarteGast.toFixed(2)} €</strong></p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Seitenleiste */}
          <div className="space-y-6">
            <KursBuchungCard
              kursSlug={kurs.slug}
              kursName={kurs.name}
              preisZehnerkarteMitglied={kurs.preisZehnerkarteMitglied}
              preisZehnerkarteGast={kurs.preisZehnerkarteGast}
            />
            <TrainingszeitenDisplay trainingszeiten={kurs.trainingszeiten} />
            <AnsprechpartnerDisplay ansprechpartner={kurs.ansprechpartner} />
          </div>
        </div>
      </Container>
    </section>
  )
}

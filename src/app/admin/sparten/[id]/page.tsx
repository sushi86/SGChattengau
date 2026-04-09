import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SparteEditForm } from '@/components/admin/sparte-edit-form'
import { TrainingszeitenEditor } from '@/components/admin/trainingszeiten-editor'
import { AnsprechpartnerEditor } from '@/components/admin/ansprechpartner-editor'
import { BildUpload } from '@/components/admin/bild-upload'
import { KursEinstellungen } from '@/components/admin/kurs-einstellungen'

export default async function SparteEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params

  const sparte = await prisma.sparte.findUnique({
    where: { id },
    include: {
      trainingszeiten: { orderBy: { wochentag: 'asc' } },
      ansprechpartner: true,
      bilder: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!sparte) notFound()

  // Check permissions
  const isAdmin = session.user.role === 'ADMIN'
  if (!isAdmin && session.user.sparteId !== sparte.id) {
    redirect('/admin')
  }

  const trainingszeiten = sparte.trainingszeiten.map((t) => ({
    id: t.id,
    wochentag: t.wochentag,
    startzeit: t.startzeit,
    endzeit: t.endzeit,
    ort: t.ort || '',
    hinweis: t.hinweis || '',
  }))

  const ansprechpartner = sparte.ansprechpartner.map((a) => ({
    id: a.id,
    name: a.name,
    rolle: a.rolle || '',
    telefon: a.telefon || '',
    email: a.email || '',
  }))

  return (
    <div>
      {isAdmin && (
        <Link href="/admin/sparten" className="text-sm text-primary hover:text-primary-hover mb-4 inline-block">
          &larr; Zurück zur Liste
        </Link>
      )}

      <h1 className="font-heading text-h1 text-text-heading mb-6">{sparte.name} bearbeiten</h1>

      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg border border-border">
          <SparteEditForm
            sparte={{ slug: sparte.slug, name: sparte.name, beschreibung: sparte.beschreibung, typ: sparte.typ, isActive: sparte.isActive }}
            isAdmin={isAdmin}
          />
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <TrainingszeitenEditor initial={trainingszeiten} sparteSlug={sparte.slug} />
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <AnsprechpartnerEditor initial={ansprechpartner} sparteSlug={sparte.slug} />
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <BildUpload initial={sparte.bilder} sparteSlug={sparte.slug} />
        </div>

        {sparte.typ === 'KURS' && (
          <div className="bg-white p-6 rounded-lg border border-border">
            <KursEinstellungen
              sparteSlug={sparte.slug}
              initial={{
                maxTeilnehmer: sparte.maxTeilnehmer,
                preisZehnerkarteMitglied: sparte.preisZehnerkarteMitglied,
                preisZehnerkarteGast: sparte.preisZehnerkarteGast,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

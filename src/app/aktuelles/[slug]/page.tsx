import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Container } from '@/components/layout/container'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const beitrag = await prisma.beitrag.findUnique({ where: { slug }, select: { titel: true, auszug: true } })
  if (!beitrag) return { title: 'Nicht gefunden' }
  return { title: beitrag.titel, description: beitrag.auszug || undefined }
}

export default async function BeitragPage({ params }: Props) {
  const { slug } = await params

  const beitrag = await prisma.beitrag.findUnique({
    where: { slug },
    include: { sparte: { select: { name: true, slug: true } } },
  })

  if (!beitrag || !beitrag.veroeffentlicht) notFound()

  return (
    <article className="py-8 tablet:py-12">
      <Container className="max-w-3xl">
        {beitrag.bildUrl && (
          <div className="aspect-video relative rounded-lg overflow-hidden mb-6">
            <Image
              src={beitrag.bildUrl}
              alt={beitrag.titel}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        <h1 className="font-heading text-h1 text-text-heading mb-2">{beitrag.titel}</h1>

        <div className="flex items-center gap-2 text-sm text-text-body mb-8">
          <time>{new Date(beitrag.createdAt).toLocaleDateString('de-DE')}</time>
          {beitrag.sparte && (
            <>
              <span>&middot;</span>
              <Link href={`/sparten/${beitrag.sparte.slug}`} className="text-primary hover:text-primary-hover">
                {beitrag.sparte.name}
              </Link>
            </>
          )}
        </div>

        <div
          className="prose prose-sm max-w-none text-text-body"
          dangerouslySetInnerHTML={{ __html: beitrag.inhalt }}
        />

        <div className="mt-8 pt-8 border-t border-border">
          <Link href="/aktuelles" className="text-primary hover:text-primary-hover text-sm">
            &larr; Zur&uuml;ck zu Aktuelles
          </Link>
        </div>
      </Container>
    </article>
  )
}

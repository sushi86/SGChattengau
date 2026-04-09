import Link from 'next/link'
import Image from 'next/image'

interface BeitragCardProps {
  titel: string
  slug: string
  auszug: string | null
  bildUrl: string | null
  sparte: { name: string; slug: string } | null
  createdAt: string
}

export function BeitragCard({ titel, slug, auszug, bildUrl, sparte, createdAt }: BeitragCardProps) {
  return (
    <Link
      href={`/aktuelles/${slug}`}
      className="block bg-white rounded-lg border border-border hover:border-primary
        transition-colors overflow-hidden group"
    >
      {bildUrl && (
        <div className="aspect-video relative overflow-hidden">
          <Image
            src={bildUrl}
            alt={titel}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-heading text-h3 text-text-heading mb-1">{titel}</h3>
        <div className="flex items-center gap-2 text-xs text-text-body mb-2">
          <time>{new Date(createdAt).toLocaleDateString('de-DE')}</time>
          {sparte && (
            <>
              <span>&middot;</span>
              <span>{sparte.name}</span>
            </>
          )}
        </div>
        {auszug && <p className="text-sm text-text-body line-clamp-3">{auszug}</p>}
      </div>
    </Link>
  )
}

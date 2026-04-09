import Link from 'next/link'
import Image from 'next/image'

interface SparteCardProps {
  name: string
  slug: string
  beschreibung: string | null
  typ: string
  bilder: { url: string; alt: string | null }[]
  trainingszeiten: { wochentag: number; startzeit: string; endzeit: string }[]
}

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

// Farbpalette für Sparten ohne Bilder
const GRADIENTS = [
  'from-blue-600 to-blue-400',
  'from-emerald-600 to-emerald-400',
  'from-orange-600 to-orange-400',
  'from-purple-600 to-purple-400',
  'from-rose-600 to-rose-400',
  'from-cyan-600 to-cyan-400',
  'from-amber-600 to-amber-400',
  'from-indigo-600 to-indigo-400',
  'from-teal-600 to-teal-400',
  'from-pink-600 to-pink-400',
  'from-lime-600 to-lime-400',
  'from-sky-600 to-sky-400',
  'from-fuchsia-600 to-fuchsia-400',
  'from-red-600 to-red-400',
  'from-violet-600 to-violet-400',
  'from-green-600 to-green-400',
  'from-yellow-600 to-yellow-400',
  'from-slate-600 to-slate-400',
]

function hashSlug(slug: string): number {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function SparteCard({ name, slug, beschreibung, typ, bilder, trainingszeiten }: SparteCardProps) {
  const erstesTraining = trainingszeiten[0]
  const hasBild = bilder.length > 0
  const gradient = GRADIENTS[hashSlug(slug) % GRADIENTS.length]

  const plainDesc = beschreibung
    ? beschreibung.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim().slice(0, 100)
    : ''

  return (
    <Link
      href={typ === 'KURS' ? `/kurse/${slug}` : `/sparten/${slug}`}
      className="block rounded-xl overflow-hidden group shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Hero-Bereich: Bild oder Gradient */}
      <div className="relative h-48 overflow-hidden">
        {hasBild ? (
          <>
            <Image
              src={bilder[0].url}
              alt={bilder[0].alt || name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Dunkler Overlay für Text-Lesbarkeit */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} group-hover:scale-110 transition-transform duration-500 origin-center`} />
        )}

        {/* Name als Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-xl font-bold text-white drop-shadow-md">{name}</h3>
            {typ === 'KURS' && (
              <span className="text-[10px] bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full border border-white/30">
                Kurs
              </span>
            )}
          </div>
          {erstesTraining && (
            <p className="text-xs text-white/80 mt-1">
              {WOCHENTAGE[erstesTraining.wochentag]} {erstesTraining.startzeit}–{erstesTraining.endzeit}
              {trainingszeiten.length > 1 && ` · +${trainingszeiten.length - 1} weitere`}
            </p>
          )}
        </div>
      </div>

      {/* Beschreibung */}
      {plainDesc && (
        <div className="p-4 bg-white">
          <p className="text-sm text-text-body line-clamp-2">{plainDesc}…</p>
        </div>
      )}
    </Link>
  )
}

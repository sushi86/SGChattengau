import { getSparteColor } from './termin-filter'

interface Termin {
  id: string
  titel: string
  beschreibung: string | null
  startzeit: string
  endzeit: string | null
  ort: string | null
  ganztaegig: boolean
  sparte: { id: string; name: string; slug: string } | null
}

interface TerminListProps {
  termine: Termin[]
  sparteIndexMap: Map<string, number>
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function TerminList({ termine, sparteIndexMap }: TerminListProps) {
  if (termine.length === 0) {
    return <p className="text-text-body py-8 text-center">Keine Termine gefunden.</p>
  }

  // Group by date
  const grouped = new Map<string, Termin[]>()
  for (const t of termine) {
    const dateKey = new Date(t.startzeit).toISOString().slice(0, 10)
    if (!grouped.has(dateKey)) grouped.set(dateKey, [])
    grouped.get(dateKey)!.push(t)
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([dateKey, dayTermine]) => (
        <div key={dateKey}>
          <h3 className="font-heading text-sm font-semibold text-text-heading mb-2 uppercase tracking-wide">
            {formatDate(dayTermine[0].startzeit)}
          </h3>
          <div className="space-y-2">
            {dayTermine.map((t) => {
              const colorIdx = t.sparte ? (sparteIndexMap.get(t.sparte.id) ?? 0) : 0
              const color = getSparteColor(colorIdx)
              return (
                <div key={t.id} className="bg-white rounded-md border border-border p-3 flex gap-3">
                  <div className={`w-1 rounded-full ${color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-heading">{t.titel}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-body mt-1">
                      {!t.ganztaegig && (
                        <span>
                          {formatTime(t.startzeit)}
                          {t.endzeit && ` – ${formatTime(t.endzeit)}`}
                        </span>
                      )}
                      {t.ganztaegig && <span>Ganztägig</span>}
                      {t.ort && <span>{t.ort}</span>}
                      {t.sparte && <span className="text-primary">{t.sparte.name}</span>}
                    </div>
                    {t.beschreibung && (
                      <p className="text-sm text-text-body mt-1 line-clamp-2">{t.beschreibung}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

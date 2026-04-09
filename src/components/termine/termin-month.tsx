import { getSparteColor } from './termin-filter'

interface Termin {
  id: string
  titel: string
  startzeit: string
  ganztaegig: boolean
  sparte: { id: string; name: string } | null
}

interface TerminMonthProps {
  termine: Termin[]
  year: number
  month: number // 0-indexed
  onPrev: () => void
  onNext: () => void
  sparteIndexMap: Map<string, number>
}

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function TerminMonth({ termine, year, month, onPrev, onNext, sparteIndexMap }: TerminMonthProps) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  // Build grid
  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  // Map termine to days
  const termineByDay = new Map<number, Termin[]>()
  for (const t of termine) {
    const d = new Date(t.startzeit)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!termineByDay.has(day)) termineByDay.set(day, [])
      termineByDay.get(day)!.push(t)
    }
  }

  const today = new Date()
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="text-primary hover:text-primary-hover min-h-[44px] px-3 text-lg">&larr;</button>
        <h3 className="font-heading text-h3 text-text-heading">{MONATE[month]} {year}</h3>
        <button onClick={onNext} className="text-primary hover:text-primary-hover min-h-[44px] px-3 text-lg">&rarr;</button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }} className="mb-1">
        {WOCHENTAGE.map((tag) => (
          <div key={tag} className="text-center text-xs font-medium text-text-body py-1">{tag}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }} className="bg-border rounded-md overflow-hidden">
        {cells.map((day, i) => (
          <div
            key={i}
            className={`bg-white min-h-[80px] p-1 ${day === null ? 'bg-section-alt' : ''}`}
          >
            {day !== null && (
              <>
                <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full
                  ${isToday(day) ? 'bg-primary text-white' : 'text-text-heading'}`}>
                  {day}
                </span>
                <div className="space-y-0.5 mt-0.5">
                  {(termineByDay.get(day) || []).slice(0, 3).map((t) => {
                    const colorIdx = t.sparte ? (sparteIndexMap.get(t.sparte.id) ?? 0) : 0
                    const color = getSparteColor(colorIdx)
                    return (
                      <div key={t.id} className={`text-[10px] leading-tight text-white px-1 py-0.5 rounded truncate ${color}`}>
                        {!t.ganztaegig && `${formatTime(t.startzeit)} `}{t.titel}
                      </div>
                    )
                  })}
                  {(termineByDay.get(day) || []).length > 3 && (
                    <div className="text-[10px] text-text-body px-1">+{(termineByDay.get(day) || []).length - 3} weitere</div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

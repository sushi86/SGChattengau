'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { TerminFilter } from './termin-filter'
import { TerminList } from './termin-list'
import { TerminMonth } from './termin-month'

interface SparteOption {
  id: string
  name: string
  slug: string
}

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

interface KalenderProps {
  sparten: SparteOption[]
  baseUrl: string // for webcal link
}

type ViewMode = 'list' | 'month'

export function Kalender({ sparten, baseUrl }: KalenderProps) {
  const [view, setView] = useState<ViewMode>('list')
  const [selectedSparten, setSelectedSparten] = useState<string[]>([])
  const [termine, setTermine] = useState<Termin[]>([])
  const [loading, setLoading] = useState(true)
  const [monthYear, setMonthYear] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const sparteIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    sparten.forEach((s, i) => map.set(s.id, i))
    return map
  }, [sparten])

  const fetchTermine = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedSparten.length > 0) {
      params.set('sparte', selectedSparten.join(','))
    }
    // For month view, filter by month range
    if (view === 'month') {
      const von = new Date(monthYear.year, monthYear.month, 1)
      const bis = new Date(monthYear.year, monthYear.month + 1, 0, 23, 59, 59)
      params.set('von', von.toISOString())
      params.set('bis', bis.toISOString())
    }

    const res = await fetch(`/api/v1/termine?${params}`)
    if (res.ok) {
      const body = await res.json()
      setTermine(body.data || [])
    }
    setLoading(false)
  }, [selectedSparten, view, monthYear])

  useEffect(() => { fetchTermine() }, [fetchTermine])

  // Detect mobile for default view
  useEffect(() => {
    if (window.innerWidth >= 768) setView('month')
  }, [])

  const icalUrl = `${baseUrl}/api/v1/termine/ical${selectedSparten.length > 0 ? `?sparte=${selectedSparten.join(',')}` : ''}`
  const webcalUrl = icalUrl.replace(/^https?:/, 'webcal:')

  return (
    <div className="space-y-4">
      {/* View toggle + iCal */}
      <div className="flex flex-col tablet:flex-row items-start tablet:items-center justify-between gap-3">
        <div className="flex gap-1 bg-section-alt rounded-md p-1">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded text-sm min-h-[36px] transition-colors
              ${view === 'list' ? 'bg-white text-text-heading shadow-sm' : 'text-text-body'}`}
          >
            Liste
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1.5 rounded text-sm min-h-[36px] transition-colors
              ${view === 'month' ? 'bg-white text-text-heading shadow-sm' : 'text-text-body'}`}
          >
            Monat
          </button>
        </div>

        <a href={webcalUrl} className="text-sm text-primary hover:text-primary-hover">
          Kalender abonnieren (iCal)
        </a>
      </div>

      {/* Spartenfilter */}
      <TerminFilter
        sparten={sparten}
        selected={selectedSparten}
        onChange={setSelectedSparten}
      />

      {/* Content */}
      {loading ? (
        <p className="text-text-body py-8 text-center">Laden...</p>
      ) : view === 'list' ? (
        <TerminList termine={termine} sparteIndexMap={sparteIndexMap} />
      ) : (
        <TerminMonth
          termine={termine}
          year={monthYear.year}
          month={monthYear.month}
          sparteIndexMap={sparteIndexMap}
          onPrev={() => setMonthYear((p) => {
            const d = new Date(p.year, p.month - 1)
            return { year: d.getFullYear(), month: d.getMonth() }
          })}
          onNext={() => setMonthYear((p) => {
            const d = new Date(p.year, p.month + 1)
            return { year: d.getFullYear(), month: d.getMonth() }
          })}
        />
      )}
    </div>
  )
}

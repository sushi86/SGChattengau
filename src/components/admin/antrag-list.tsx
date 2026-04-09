'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { StatusBadge } from './status-badge'
import { Button } from '@/components/ui/button'

interface Antrag {
  id: string
  status: string
  vorname: string
  nachname: string
  email: string
  geburtsdatum: string
  ibanLast4: string
  sparte: { name: string; typ: string }
  createdAt: string
}

interface PaginationMeta {
  seite: number
  limit: number
  gesamt: number
}

export function AntragList() {
  const [antraege, setAntraege] = useState<Antrag[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({ seite: 1, limit: 20, gesamt: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchAntraege = useCallback(async (seite = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ seite: String(seite), limit: '20' })
    if (statusFilter) params.set('status', statusFilter)

    const res = await fetch(`/api/v1/mitgliedsantraege?${params}`)
    const body = await res.json()
    setAntraege(body.data || [])
    setMeta(body.meta || { seite: 1, limit: 20, gesamt: 0 })
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchAntraege() }, [fetchAntraege])

  const totalPages = Math.ceil(meta.gesamt / meta.limit)

  return (
    <div>
      {/* Filter + Export */}
      <div className="flex flex-col tablet:flex-row gap-4 mb-4 items-start tablet:items-center justify-between">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm bg-white"
        >
          <option value="">Alle Status</option>
          <option value="EINGEGANGEN">Eingegangen</option>
          <option value="IN_BEARBEITUNG">In Bearbeitung</option>
          <option value="ABGESCHLOSSEN">Abgeschlossen</option>
          <option value="EXPORTIERT">Exportiert</option>
          <option value="ABGELEHNT">Abgelehnt</option>
        </select>

        <a href="/api/v1/mitgliedsantraege/export/csv?nur_neue=true" download>
          <Button variant="secondary" className="text-sm">CSV-Export (neue)</Button>
        </a>
      </div>

      {/* Tabelle */}
      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-section-alt">
              <th className="text-left p-3 font-medium text-text-heading">Name</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Sparte</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">IBAN</th>
              <th className="text-left p-3 font-medium text-text-heading">Status</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Datum</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-text-body">Laden...</td></tr>
            ) : antraege.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-text-body">Keine Anträge gefunden.</td></tr>
            ) : (
              antraege.map((a) => (
                <tr key={a.id} className="border-b border-border-light hover:bg-section-alt">
                  <td className="p-3">
                    <div className="font-medium text-text-heading">{a.vorname} {a.nachname}</div>
                    <div className="text-xs text-text-body tablet:hidden">{a.sparte.name}</div>
                  </td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">{a.sparte.name}</td>
                  <td className="p-3 hidden tablet:table-cell text-text-body font-mono">****{a.ibanLast4}</td>
                  <td className="p-3"><StatusBadge status={a.status} /></td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">
                    {new Date(a.createdAt).toLocaleDateString('de-DE')}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/antraege/${a.id}`}
                      className="text-primary hover:text-primary-hover text-sm"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            className="text-sm"
            disabled={meta.seite <= 1}
            onClick={() => fetchAntraege(meta.seite - 1)}
          >
            Zurück
          </Button>
          <span className="flex items-center text-sm text-text-body">
            Seite {meta.seite} von {totalPages}
          </span>
          <Button
            variant="outline"
            className="text-sm"
            disabled={meta.seite >= totalPages}
            onClick={() => fetchAntraege(meta.seite + 1)}
          >
            Weiter
          </Button>
        </div>
      )}
    </div>
  )
}

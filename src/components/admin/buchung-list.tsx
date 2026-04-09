'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { StatusBadge } from './status-badge'
import { Button } from '@/components/ui/button'

interface Buchung {
  id: string
  status: string
  name: string
  email: string
  datum: string
  startzeit: string
  endzeit: string
  anlass: string
  createdAt: string
}

interface PaginationMeta {
  seite: number
  limit: number
  gesamt: number
}

export function BuchungList() {
  const [buchungen, setBuchungen] = useState<Buchung[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({ seite: 1, limit: 20, gesamt: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchBuchungen = useCallback(async (seite = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ seite: String(seite), limit: '20' })
    if (statusFilter) params.set('status', statusFilter)

    const res = await fetch(`/api/v1/buchungen?${params}`)
    const body = await res.json()
    setBuchungen(body.data || [])
    setMeta(body.meta || { seite: 1, limit: 20, gesamt: 0 })
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchBuchungen() }, [fetchBuchungen])

  const totalPages = Math.ceil(meta.gesamt / meta.limit)

  return (
    <div>
      {/* Filter */}
      <div className="flex flex-col tablet:flex-row gap-4 mb-4 items-start tablet:items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm bg-white"
        >
          <option value="">Alle Status</option>
          <option value="ANGEFRAGT">Angefragt</option>
          <option value="GENEHMIGT">Genehmigt</option>
          <option value="ABGELEHNT">Abgelehnt</option>
          <option value="STORNIERT">Storniert</option>
        </select>
      </div>

      {/* Tabelle */}
      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-section-alt">
              <th className="text-left p-3 font-medium text-text-heading">Name</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Datum &amp; Zeit</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Anlass</th>
              <th className="text-left p-3 font-medium text-text-heading">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-body">Laden...</td></tr>
            ) : buchungen.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-body">Keine Buchungen gefunden.</td></tr>
            ) : (
              buchungen.map((b) => (
                <tr key={b.id} className="border-b border-border-light hover:bg-section-alt">
                  <td className="p-3">
                    <div className="font-medium text-text-heading">{b.name}</div>
                    <div className="text-xs text-text-body">{b.email}</div>
                    <div className="text-xs text-text-body tablet:hidden">
                      {new Date(b.datum).toLocaleDateString('de-DE')} {b.startzeit}–{b.endzeit}
                    </div>
                  </td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">
                    <div>{new Date(b.datum).toLocaleDateString('de-DE')}</div>
                    <div className="text-xs">{b.startzeit}–{b.endzeit} Uhr</div>
                  </td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">{b.anlass}</td>
                  <td className="p-3"><StatusBadge status={b.status} /></td>
                  <td className="p-3">
                    <Link
                      href={`/admin/buchungen/${b.id}`}
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
            onClick={() => fetchBuchungen(meta.seite - 1)}
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
            onClick={() => fetchBuchungen(meta.seite + 1)}
          >
            Weiter
          </Button>
        </div>
      )}
    </div>
  )
}

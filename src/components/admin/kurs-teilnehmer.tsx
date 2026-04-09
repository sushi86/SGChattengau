'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Zehnerkarte {
  id: string
  kaeuferVorname: string
  kaeuferNachname: string
  kaeuferEmail: string
  verbleibend: number
  preis: number
  istMitglied: boolean
  zahlung: { status: string } | null
}

interface Props {
  sparteId: string
  kursName: string
}

export function KursTeilnehmer({ sparteId, kursName }: Props) {
  const [karten, setKarten] = useState<Zehnerkarte[]>([])
  const [loading, setLoading] = useState(true)
  const [stempeling, setStempeling] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newVorname, setNewVorname] = useState('')
  const [newNachname, setNewNachname] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newIstMitglied, setNewIstMitglied] = useState(false)
  const [newVerbleibend, setNewVerbleibend] = useState('10')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const fetchKarten = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/v1/kurse/zehnerkarten?sparte=${sparteId}`)
    if (res.ok) {
      const body = await res.json()
      setKarten(body.data || [])
    }
    setLoading(false)
  }, [sparteId])

  useEffect(() => { fetchKarten() }, [fetchKarten])

  async function entstempeln(karteId: string) {
    setStempeling(karteId)
    try {
      const res = await fetch(`/api/v1/zehnerkarten/${karteId}/entstempeln`, {
        method: 'POST',
      })
      if (res.ok) {
        fetchKarten()
      }
    } finally {
      setStempeling(null)
    }
  }

  async function abstempeln(karteId: string) {
    setStempeling(karteId)
    try {
      const res = await fetch(`/api/v1/zehnerkarten/${karteId}/stempeln`, {
        method: 'POST',
      })
      if (res.ok) {
        fetchKarten()
      }
    } finally {
      setStempeling(null)
    }
  }

  async function karteAnlegen() {
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/v1/kurse/zehnerkarten/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sparteId,
          vorname: newVorname,
          nachname: newNachname,
          email: newEmail,
          istMitglied: newIstMitglied,
          verbleibend: parseInt(newVerbleibend) || 10,
        }),
      })
      if (!res.ok) {
        const body = await res.json()
        setCreateError(body.error?.message || 'Fehler beim Anlegen')
        return
      }
      setShowCreate(false)
      setNewVorname('')
      setNewNachname('')
      setNewEmail('')
      setNewIstMitglied(false)
      setNewVerbleibend('10')
      fetchKarten()
    } finally {
      setCreating(false)
    }
  }

  const aktiveKarten = karten.filter((k) => k.verbleibend > 0)
  const aufgebrauchteKarten = karten.filter((k) => k.verbleibend <= 0)

  return (
    <div className="space-y-6">
      {/* Karte manuell anlegen */}
      <div>
        <Button variant="outline" className="text-sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Abbrechen' : '+ 10er-Karte manuell anlegen'}
        </Button>

        {showCreate && (
          <div className="mt-4 bg-white p-4 rounded-lg border border-border space-y-3 max-w-lg">
            <p className="text-sm text-text-body">Für Barzahler oder nachträgliche Erfassung.</p>
            {createError && <p className="text-sm text-error">{createError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Vorname" value={newVorname} onChange={(e) => setNewVorname(e.target.value)} required />
              <Input label="Nachname" value={newNachname} onChange={(e) => setNewNachname(e.target.value)} required />
            </div>
            <Input label="E-Mail (optional)" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} hint="Über die E-Mail können Teilnehmer:innen den Status ihrer 10er-Karte online abfragen" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-2 min-h-[44px]">
                  <input type="checkbox" checked={newIstMitglied} onChange={(e) => setNewIstMitglied(e.target.checked)} className="accent-primary w-4 h-4" />
                  <span className="text-sm text-text-heading">Mitglied</span>
                </label>
              </div>
              <Input
                label="Verbleibende Einheiten"
                type="number"
                min="1"
                max="10"
                value={newVerbleibend}
                onChange={(e) => setNewVerbleibend(e.target.value)}
                hint="Standard: 10"
              />
            </div>
            <Button onClick={karteAnlegen} disabled={creating || !newVorname || !newNachname}>
              {creating ? 'Wird angelegt...' : '10er-Karte anlegen'}
            </Button>
          </div>
        )}
      </div>

      {/* Aktive Karten — zum Abstempeln */}
      <div>
        <h2 className="font-heading text-h2 text-text-heading mb-4">Aktive 10er-Karten</h2>

        {loading ? (
          <p className="text-text-body">Laden...</p>
        ) : aktiveKarten.length === 0 ? (
          <p className="text-text-body">Keine aktiven 10er-Karten vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {aktiveKarten.map((k) => (
              <div key={k.id} className="bg-white p-4 rounded-lg border border-border flex flex-col tablet:flex-row tablet:items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-text-heading">
                    {k.kaeuferVorname} {k.kaeuferNachname}
                  </p>
                  <p className="text-xs text-text-body">
                    {k.kaeuferEmail} · {k.istMitglied ? 'Mitglied' : 'Gast'}
                    {k.zahlung && k.zahlung.status !== 'BEZAHLT' && (
                      <span className="text-warning ml-1">· Zahlung ausstehend</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Stempel-Anzeige — blaue Kreise klickbar zum Zurücknehmen */}
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }, (_, i) => {
                      const istGestempelt = i < (10 - k.verbleibend)
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={!istGestempelt || stempeling === k.id}
                          onClick={() => istGestempelt && entstempeln(k.id)}
                          title={istGestempelt ? 'Stempel zurücknehmen' : ''}
                          className={`w-5 h-5 rounded-full border-2 transition-colors ${
                            istGestempelt
                              ? 'bg-primary border-primary hover:bg-primary-hover hover:border-primary-hover cursor-pointer'
                              : 'border-border-light cursor-default'
                          }`}
                        />
                      )
                    })}
                  </div>

                  <span className="text-sm font-medium text-text-heading whitespace-nowrap">
                    {k.verbleibend}/10
                  </span>

                  <Button
                    className="text-sm shrink-0"
                    onClick={() => abstempeln(k.id)}
                    disabled={stempeling === k.id || k.verbleibend <= 0}
                  >
                    {stempeling === k.id ? '...' : 'Abstempeln'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aufgebrauchte Karten */}
      {aufgebrauchteKarten.length > 0 && (
        <div>
          <h2 className="font-heading text-h3 text-text-body mb-3">Aufgebraucht</h2>
          <div className="space-y-2">
            {aufgebrauchteKarten.map((k) => (
              <div key={k.id} className="bg-section-alt p-3 rounded-lg border border-border-light flex items-center gap-4 opacity-60">
                <div className="flex-1">
                  <p className="text-sm text-text-heading">{k.kaeuferVorname} {k.kaeuferNachname}</p>
                  <p className="text-xs text-text-body">{k.kaeuferEmail}</p>
                </div>
                <span className="text-sm text-text-body">{k.verbleibend}/10 übrig</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

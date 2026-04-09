'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface KursBuchungCardProps {
  kursSlug: string
  kursName: string
  preisZehnerkarteMitglied: number | null
  preisZehnerkarteGast: number | null
}

interface ZehnerkarteInfo {
  id: string
  kaeuferVorname: string
  kaeuferNachname: string
  verbleibend: number
  preis: number
  istMitglied: boolean
  zahlung: { status: string } | null
}

export function KursBuchungCard({ kursSlug, kursName, preisZehnerkarteMitglied, preisZehnerkarteGast }: KursBuchungCardProps) {
  const [mode, setMode] = useState<'auswahl' | 'kaufen' | 'status' | 'success'>('auswahl')
  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
  const [email, setEmail] = useState('')
  const [istMitglied, setIstMitglied] = useState(false)
  const [statusEmail, setStatusEmail] = useState('')
  const [karten, setKarten] = useState<ZehnerkarteInfo[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function zehnerkarteKaufen() {
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/kurse/${kursSlug}/zehnerkarte`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vorname, nachname, email, istMitglied }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error?.message || 'Fehler beim Kauf')
        return
      }

      const body = await res.json()
      if (body.data.checkoutUrl) {
        window.location.href = body.data.checkoutUrl
      } else {
        setMode('success')
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setSubmitting(false)
    }
  }

  const [andereKurse, setAndereKurse] = useState<{ kursName: string; kursSlug: string; anzahl: number }[]>([])
  const [searched, setSearched] = useState(false)

  async function statusAbfragen() {
    setSubmitting(true)
    setError('')
    setAndereKurse([])
    setSearched(false)

    try {
      const res = await fetch(`/api/v1/kurse/${kursSlug}/zehnerkarten?email=${encodeURIComponent(statusEmail)}`)

      if (!res.ok) {
        setError('Fehler beim Abrufen')
        return
      }

      const body = await res.json()
      setKarten(body.data.karten || [])
      setAndereKurse(body.data.andereKurse || [])
      setSearched(true)
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setSubmitting(false)
    }
  }

  const aktuellerPreis = istMitglied ? preisZehnerkarteMitglied : preisZehnerkarteGast

  // === Erfolgs-Seite nach Kauf ===
  if (mode === 'success') {
    return (
      <div className="bg-white p-6 rounded-lg border border-border text-center">
        <div className="text-4xl mb-3">✓</div>
        <h3 className="font-heading text-h3 text-text-heading mb-2">10er-Karte bestellt!</h3>
        <p className="text-text-body text-sm">
          Deine 10er-Karte für <strong>{kursName}</strong> wird nach Zahlungseingang freigeschaltet.
        </p>
        <p className="text-text-body text-sm mt-2">
          Die Zahlungsinformationen erhältst du per E-Mail an <strong>{email}</strong>.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => setMode('auswahl')}>
          Zurück
        </Button>
      </div>
    )
  }

  // === Auswahl: Kaufen oder Status ===
  if (mode === 'auswahl') {
    return (
      <div className="bg-white p-6 rounded-lg border border-border space-y-4">
        <h3 className="font-heading text-h3 text-text-heading">10er-Karte</h3>

        <div className="space-y-2">
          <button
            onClick={() => setMode('kaufen')}
            className="w-full p-4 rounded-md border border-border hover:border-primary text-left transition-colors"
          >
            <span className="font-medium text-text-heading">10er-Karte kaufen</span>
            <span className="block text-sm text-text-body">
              Mitglieder: {preisZehnerkarteMitglied?.toFixed(2) || '—'} € · Gäste: {preisZehnerkarteGast?.toFixed(2) || '—'} €
            </span>
          </button>

          <button
            onClick={() => setMode('status')}
            className="w-full p-4 rounded-md border border-border hover:border-primary text-left transition-colors"
          >
            <span className="font-medium text-text-heading">Status abfragen</span>
            <span className="block text-sm text-text-body">Deine 10er-Karten einsehen</span>
          </button>
        </div>
      </div>
    )
  }

  // === Kaufen ===
  if (mode === 'kaufen') {
    return (
      <div className="bg-white p-6 rounded-lg border border-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-h3 text-text-heading">10er-Karte kaufen</h3>
          <button onClick={() => setMode('auswahl')} className="text-sm text-text-body hover:text-primary">← Zurück</button>
        </div>

        {error && <div className="p-2 bg-red-50 text-error rounded text-sm">{error}</div>}

        <Input label="Vorname" value={vorname} onChange={(e) => setVorname(e.target.value)} required />
        <Input label="Nachname" value={nachname} onChange={(e) => setNachname(e.target.value)} required />
        <Input label="E-Mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label className="flex items-center gap-3 p-3 rounded-md border cursor-pointer min-h-[44px] transition-colors border-border hover:border-primary">
          <input
            type="checkbox"
            checked={istMitglied}
            onChange={(e) => setIstMitglied(e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          <div className="flex-1">
            <span className="text-text-heading text-sm">Ich bin Vereinsmitglied</span>
            {istMitglied && preisZehnerkarteMitglied !== null && preisZehnerkarteGast !== null && preisZehnerkarteMitglied < preisZehnerkarteGast && (
              <span className="text-xs text-success ml-2">
                {Math.round((1 - preisZehnerkarteMitglied / preisZehnerkarteGast) * 100)}% Rabatt
              </span>
            )}
          </div>
        </label>

        <div className="text-center py-2">
          <span className="text-2xl font-bold text-primary">{aktuellerPreis?.toFixed(2)} €</span>
          {istMitglied && preisZehnerkarteGast !== null && preisZehnerkarteMitglied !== null && preisZehnerkarteMitglied < preisZehnerkarteGast && (
            <span className="text-sm text-text-body line-through ml-2">{preisZehnerkarteGast.toFixed(2)} €</span>
          )}
        </div>

        <Button
          className="w-full"
          onClick={zehnerkarteKaufen}
          disabled={submitting || !vorname || !nachname || !email}
        >
          {submitting ? 'Wird verarbeitet...' : `Jetzt kaufen (${aktuellerPreis?.toFixed(2)} €)`}
        </Button>
      </div>
    )
  }

  // === Status abfragen ===
  return (
    <div className="bg-white p-6 rounded-lg border border-border space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-h3 text-text-heading">Meine 10er-Karten</h3>
        <button onClick={() => { setMode('auswahl'); setKarten([]); setError('') }} className="text-sm text-text-body hover:text-primary">← Zurück</button>
      </div>

      {error && <div className="p-2 bg-red-50 text-error rounded text-sm">{error}</div>}

      {karten.length === 0 && !searched ? (
        <div className="space-y-3">
          <Input
            label="E-Mail-Adresse"
            type="email"
            value={statusEmail}
            onChange={(e) => setStatusEmail(e.target.value)}
            placeholder="Deine E-Mail-Adresse"
            required
          />
          <Button className="w-full" onClick={statusAbfragen} disabled={submitting || !statusEmail}>
            {submitting ? 'Laden...' : 'Status abfragen'}
          </Button>
        </div>
      ) : karten.length === 0 && searched && andereKurse.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-text-body">
            Keine 10er-Karte für <strong>{statusEmail}</strong> gefunden.
          </p>

          <button
            onClick={() => setMode('kaufen')}
            className="w-full p-3 rounded-md border border-primary text-primary hover:bg-primary-light text-sm font-medium transition-colors"
          >
            10er-Karte für {kursName} kaufen
          </button>

          <Button variant="outline" className="w-full text-sm" onClick={() => { setSearched(false); setStatusEmail('') }}>
            Andere E-Mail abfragen
          </Button>
        </div>
      ) : karten.length === 0 && andereKurse.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-text-body">
            Für <strong>{kursName}</strong> wurde keine 10er-Karte gefunden.
          </p>

          <div className="p-3 bg-section-alt rounded-md">
            <p className="text-sm text-text-heading font-medium mb-2">Du hast 10er-Karten bei:</p>
            {andereKurse.map((ak) => (
              <a
                key={ak.kursSlug}
                href={`/kurse/${ak.kursSlug}`}
                className="block text-sm text-primary hover:text-primary-hover py-1"
              >
                → {ak.kursName} ({ak.anzahl} {ak.anzahl === 1 ? 'Karte' : 'Karten'})
              </a>
            ))}
          </div>

          <button
            onClick={() => setMode('kaufen')}
            className="w-full p-3 rounded-md border border-primary text-primary hover:bg-primary-light text-sm font-medium transition-colors"
          >
            10er-Karte für {kursName} kaufen
          </button>

          <Button variant="outline" className="w-full text-sm" onClick={() => { setAndereKurse([]); setStatusEmail('') }}>
            Andere E-Mail abfragen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {karten.map((k) => (
            <div key={k.id} className="p-4 rounded-md border border-border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-text-heading">{k.kaeuferVorname} {k.kaeuferNachname}</p>
                  <p className="text-xs text-text-body">{k.istMitglied ? 'Mitglied' : 'Gast'} · {k.preis.toFixed(2)} €</p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${k.verbleibend > 2 ? 'text-success' : k.verbleibend > 0 ? 'text-warning' : 'text-error'}`}>
                    {k.verbleibend}
                  </span>
                  <span className="text-sm text-text-body"> / 10</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-border-light rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${k.verbleibend > 2 ? 'bg-success' : k.verbleibend > 0 ? 'bg-warning' : 'bg-error'}`}
                  style={{ width: `${(k.verbleibend / 10) * 100}%` }}
                />
              </div>
              {k.zahlung && k.zahlung.status !== 'BEZAHLT' && (
                <p className="text-xs text-text-body mt-1">Zahlung ausstehend</p>
              )}
            </div>
          ))}
          <Button variant="outline" className="w-full text-sm" onClick={() => { setKarten([]); setStatusEmail('') }}>
            Andere E-Mail abfragen
          </Button>
        </div>
      )}
    </div>
  )
}

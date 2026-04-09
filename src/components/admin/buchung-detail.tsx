'use client'

import { useState } from 'react'
import { StatusBadge } from './status-badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface BuchungDetail {
  id: string
  status: string
  name: string
  email: string
  telefon: string | null
  datum: string
  startzeit: string
  endzeit: string
  anlass: string
  nachricht: string | null
  ablehnungsgrund?: string | null
  bearbeitetAm: string | null
  createdAt: string
}

interface BuchungDetailProps {
  buchung: BuchungDetail
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex flex-col tablet:flex-row gap-1 tablet:gap-4 py-2 border-b border-border-light">
      <dt className="text-sm text-text-body tablet:w-48 shrink-0">{label}</dt>
      <dd className="text-text-heading break-all">{value}</dd>
    </div>
  )
}

export function BuchungDetailView({ buchung: initial }: BuchungDetailProps) {
  const [buchung, setBuchung] = useState(initial)
  const [updating, setUpdating] = useState(false)
  const [showAblehnungForm, setShowAblehnungForm] = useState(false)
  const [ablehnungsgrund, setAblehnungsgrund] = useState('')

  async function updateStatus(newStatus: string, grund?: string) {
    setUpdating(true)
    try {
      const body: Record<string, string> = { status: newStatus }
      if (grund) body.ablehnungsgrund = grund

      const res = await fetch(`/api/v1/buchungen/${buchung.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setBuchung({
          ...buchung,
          status: newStatus,
          ablehnungsgrund: grund || buchung.ablehnungsgrund,
          bearbeitetAm: new Date().toISOString(),
        })
        setShowAblehnungForm(false)
        setAblehnungsgrund('')
      }
    } finally {
      setUpdating(false)
    }
  }

  function handleAblehnen() {
    if (showAblehnungForm) {
      updateStatus('ABGELEHNT', ablehnungsgrund)
    } else {
      setShowAblehnungForm(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col tablet:flex-row tablet:items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-h1 text-text-heading">{buchung.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={buchung.status} />
            <span className="text-sm text-text-body">
              Angefragt am {new Date(buchung.createdAt).toLocaleDateString('de-DE')}
            </span>
          </div>
        </div>

        {/* Workflow-Buttons */}
        {buchung.status === 'ANGEFRAGT' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="text-sm"
                onClick={() => updateStatus('GENEHMIGT')}
                disabled={updating}
              >
                Genehmigen
              </Button>
              <Button
                variant="outline"
                className="text-sm"
                onClick={handleAblehnen}
                disabled={updating}
              >
                Ablehnen
              </Button>
            </div>
            {showAblehnungForm && (
              <div className="space-y-2 max-w-sm">
                <Textarea
                  label="Ablehnungsgrund"
                  value={ablehnungsgrund}
                  onChange={(e) => setAblehnungsgrund(e.target.value)}
                  rows={3}
                  placeholder="Optionale Begründung für den Antragsteller..."
                />
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    className="text-sm"
                    onClick={() => updateStatus('ABGELEHNT', ablehnungsgrund)}
                    disabled={updating}
                  >
                    Ablehnung bestätigen
                  </Button>
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={() => { setShowAblehnungForm(false); setAblehnungsgrund('') }}
                    disabled={updating}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {buchung.status === 'GENEHMIGT' && (
          <Button
            variant="outline"
            className="text-sm"
            onClick={() => updateStatus('STORNIERT')}
            disabled={updating}
          >
            Stornieren
          </Button>
        )}
      </div>

      {/* Buchungsdetails */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h2 className="font-heading text-h3 text-text-heading mb-4">Buchungsdetails</h2>
        <dl>
          <Row label="Datum" value={new Date(buchung.datum).toLocaleDateString('de-DE')} />
          <Row label="Zeit" value={`${buchung.startzeit}–${buchung.endzeit} Uhr`} />
          <Row label="Anlass" value={buchung.anlass} />
          <Row label="Nachricht" value={buchung.nachricht} />
        </dl>
      </div>

      {/* Kontaktdaten */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h2 className="font-heading text-h3 text-text-heading mb-4">Kontaktdaten</h2>
        <dl>
          <Row label="Name" value={buchung.name} />
          <Row label="E-Mail" value={buchung.email} />
          <Row label="Telefon" value={buchung.telefon} />
        </dl>
      </div>

      {/* Bearbeitung */}
      {(buchung.ablehnungsgrund || buchung.bearbeitetAm) && (
        <div className="bg-white p-6 rounded-lg border border-border">
          <h2 className="font-heading text-h3 text-text-heading mb-4">Bearbeitung</h2>
          <dl>
            <Row
              label="Bearbeitet am"
              value={buchung.bearbeitetAm ? new Date(buchung.bearbeitetAm).toLocaleDateString('de-DE') : null}
            />
            <Row label="Ablehnungsgrund" value={buchung.ablehnungsgrund} />
          </dl>
        </div>
      )}
    </div>
  )
}

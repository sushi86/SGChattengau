'use client'

import { useState } from 'react'
import { StatusBadge } from './status-badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface AntragDetail {
  id: string
  status: string
  vorname: string
  nachname: string
  geburtsdatum: string
  geschlecht: string
  strasse: string
  plz: string
  ort: string
  telefon: string | null
  email: string
  erziehungsberechtigter: string | null
  sparte: { name: string; typ: string }
  eintrittsdatum: string
  iban: string
  ibanLast4: string
  kontoinhaber: string
  kreditinstitut: string
  signaturMitglied: string | null
  signaturSepa: string | null
  signaturErzBerech: string | null
  satzungAkzeptiert: boolean
  datenschutzAkzeptiert: boolean
  sepaAkzeptiert: boolean
  ipAdresse: string | null
  userAgent: string | null
  createdAt: string
  bearbeitetAm: string | null
}

interface AntragDetailProps {
  antrag: AntragDetail
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  EINGEGANGEN: ['IN_BEARBEITUNG', 'ABGELEHNT'],
  IN_BEARBEITUNG: ['ABGESCHLOSSEN', 'ABGELEHNT'],
  ABGESCHLOSSEN: ['EXPORTIERT'],
  EXPORTIERT: [],
  ABGELEHNT: ['EINGEGANGEN'],
}

const STATUS_LABELS: Record<string, string> = {
  EINGEGANGEN: 'Eingegangen',
  IN_BEARBEITUNG: 'In Bearbeitung',
  ABGESCHLOSSEN: 'Abgeschlossen',
  EXPORTIERT: 'Exportiert',
  ABGELEHNT: 'Abgelehnt',
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

export function AntragDetailView({ antrag: initial }: AntragDetailProps) {
  const [antrag, setAntrag] = useState(initial)
  const [updating, setUpdating] = useState(false)

  async function updateStatus(newStatus: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/v1/mitgliedsantraege/${antrag.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setAntrag({ ...antrag, status: newStatus, bearbeitetAm: new Date().toISOString() })
      }
    } finally {
      setUpdating(false)
    }
  }

  const transitions = STATUS_TRANSITIONS[antrag.status] || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-h1 text-text-heading">
            {antrag.vorname} {antrag.nachname}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={antrag.status} />
            <span className="text-sm text-text-body">
              Eingegangen am {new Date(antrag.createdAt).toLocaleDateString('de-DE')}
            </span>
          </div>
        </div>

        {transitions.length > 0 && (
          <div className="flex gap-2">
            {transitions.map((s) => (
              <Button
                key={s}
                variant={s === 'ABGELEHNT' ? 'outline' : 'primary'}
                className="text-sm"
                onClick={() => updateStatus(s)}
                disabled={updating}
              >
                → {STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Persoenliche Daten */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h2 className="font-heading text-h3 text-text-heading mb-4">Persönliche Daten</h2>
        <dl>
          <Row label="Vorname" value={antrag.vorname} />
          <Row label="Nachname" value={antrag.nachname} />
          <Row label="Geburtsdatum" value={new Date(antrag.geburtsdatum).toLocaleDateString('de-DE')} />
          <Row label="Geschlecht" value={antrag.geschlecht} />
          <Row label="Adresse" value={`${antrag.strasse}, ${antrag.plz} ${antrag.ort}`} />
          <Row label="Telefon" value={antrag.telefon} />
          <Row label="E-Mail" value={antrag.email} />
          <Row label="Erziehungsberechtigter" value={antrag.erziehungsberechtigter} />
        </dl>
      </div>

      {/* Sparte */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h2 className="font-heading text-h3 text-text-heading mb-4">Sparte</h2>
        <dl>
          <Row label="Sparte" value={antrag.sparte.name} />
          <Row label="Eintrittsdatum" value={new Date(antrag.eintrittsdatum).toLocaleDateString('de-DE')} />
        </dl>
      </div>

      {/* Bankdaten (entschluesselt) */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h2 className="font-heading text-h3 text-text-heading mb-4">Bankverbindung (entschlüsselt)</h2>
        <dl>
          <Row label="IBAN" value={antrag.iban} />
          <Row label="Kontoinhaber" value={antrag.kontoinhaber} />
          <Row label="Kreditinstitut" value={antrag.kreditinstitut} />
        </dl>
      </div>

      {/* Signaturen */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h2 className="font-heading text-h3 text-text-heading mb-4">Unterschriften</h2>
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
          {antrag.signaturMitglied && (
            <div>
              <p className="text-sm text-text-body mb-1">Mitgliedsantrag</p>
              <Image src={antrag.signaturMitglied} alt="Unterschrift Mitglied" width={300} height={120} className="border border-border rounded w-auto h-auto" />
            </div>
          )}
          {antrag.signaturSepa && (
            <div>
              <p className="text-sm text-text-body mb-1">SEPA-Mandat</p>
              <Image src={antrag.signaturSepa} alt="Unterschrift SEPA" width={300} height={120} className="border border-border rounded w-auto h-auto" />
            </div>
          )}
          {antrag.signaturErzBerech && (
            <div>
              <p className="text-sm text-text-body mb-1">Erziehungsberechtigte/r</p>
              <Image src={antrag.signaturErzBerech} alt="Unterschrift Erz.Berech." width={300} height={120} className="border border-border rounded w-auto h-auto" />
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h2 className="font-heading text-h3 text-text-heading mb-4">Meta-Daten</h2>
        <dl>
          <Row label="IP-Adresse" value={antrag.ipAdresse} />
          <Row label="User-Agent" value={antrag.userAgent} />
          <Row label="Bearbeitet am" value={antrag.bearbeitetAm ? new Date(antrag.bearbeitetAm).toLocaleDateString('de-DE') : null} />
        </dl>
      </div>
    </div>
  )
}

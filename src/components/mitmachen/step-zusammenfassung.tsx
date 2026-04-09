'use client'

import { Button } from '@/components/ui/button'

interface ZusammenfassungProps {
  data: {
    vorname: string
    nachname: string
    geburtsdatum: string
    geschlecht: string
    strasse: string
    plz: string
    ort: string
    telefon: string
    email: string
    erziehungsberechtigter: string
    sparteId: string
    eintrittsdatum: string
    iban: string
    kontoinhaber: string
    kreditinstitut: string
  }
  sparteName: string
  submitting: boolean
  onSubmit: () => void
  onBack: () => void
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex flex-col tablet:flex-row tablet:gap-4 py-2 border-b border-border-light">
      <dt className="text-sm text-text-body tablet:w-48 shrink-0">{label}</dt>
      <dd className="text-text-heading">{value}</dd>
    </div>
  )
}

const GESCHLECHT_LABELS: Record<string, string> = {
  M: 'Männlich',
  W: 'Weiblich',
  D: 'Divers',
}

export function StepZusammenfassung({ data, sparteName, submitting, onSubmit, onBack }: ZusammenfassungProps) {
  // IBAN maskieren: nur letzte 4 Zeichen zeigen
  const ibanMasked = data.iban
    ? '\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ' + data.iban.replace(/\s/g, '').slice(-4)
    : ''

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-h2 text-text-heading">Zusammenfassung</h2>
      <p className="text-text-body">Bitte pruefe deine Angaben. Mit &quot;Antrag absenden&quot; wird der Antrag verbindlich eingereicht.</p>

      <div>
        <h3 className="font-heading text-h3 text-text-heading mb-2">Persönliche Daten</h3>
        <dl>
          <Row label="Name" value={`${data.vorname} ${data.nachname}`} />
          <Row label="Geburtsdatum" value={data.geburtsdatum} />
          <Row label="Geschlecht" value={GESCHLECHT_LABELS[data.geschlecht] || data.geschlecht} />
          <Row label="Adresse" value={`${data.strasse}, ${data.plz} ${data.ort}`} />
          <Row label="Telefon" value={data.telefon} />
          <Row label="E-Mail" value={data.email} />
          <Row label="Erziehungsberechtigter" value={data.erziehungsberechtigter} />
        </dl>
      </div>

      <div>
        <h3 className="font-heading text-h3 text-text-heading mb-2">Sparte</h3>
        <dl>
          <Row label="Sparte/Kurs" value={sparteName} />
          <Row label="Eintrittsdatum" value={data.eintrittsdatum} />
        </dl>
      </div>

      <div>
        <h3 className="font-heading text-h3 text-text-heading mb-2">Bankverbindung</h3>
        <dl>
          <Row label="IBAN" value={ibanMasked} />
          <Row label="Kontoinhaber" value={data.kontoinhaber} />
          <Row label="Kreditinstitut" value={data.kreditinstitut} />
        </dl>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={submitting}>Zurück</Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Wird gesendet...' : 'Antrag absenden'}
        </Button>
      </div>
    </div>
  )
}

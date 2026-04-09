'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props {
  sparteSlug: string
  initial: {
    maxTeilnehmer: number | null
    preisZehnerkarteMitglied: number | null
    preisZehnerkarteGast: number | null
  }
}

export function KursEinstellungen({ sparteSlug, initial }: Props) {
  const [maxTeilnehmer, setMaxTeilnehmer] = useState(initial.maxTeilnehmer?.toString() || '')
  const [preisZehnerkarteMitglied, setPreisZehnerkarteMitglied] = useState(initial.preisZehnerkarteMitglied?.toString() || '')
  const [preisZehnerkarteGast, setPreisZehnerkarteGast] = useState(initial.preisZehnerkarteGast?.toString() || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/v1/sparten/${sparteSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxTeilnehmer: maxTeilnehmer ? parseInt(maxTeilnehmer) : null,
          preisZehnerkarteMitglied: preisZehnerkarteMitglied ? parseFloat(preisZehnerkarteMitglied) : null,
          preisZehnerkarteGast: preisZehnerkarteGast ? parseFloat(preisZehnerkarteGast) : null,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-h3 text-text-heading">Kurs-Einstellungen</h3>
      <Input
        label="Max. Teilnehmer"
        type="number"
        value={maxTeilnehmer}
        onChange={(e) => setMaxTeilnehmer(e.target.value)}
        hint="Leer lassen für unbegrenzt"
      />
      <Input
        label="10er-Karte Mitglied (€)"
        type="number"
        step="0.01"
        value={preisZehnerkarteMitglied}
        onChange={(e) => setPreisZehnerkarteMitglied(e.target.value)}
        hint="Standard: 30 €"
      />
      <Input
        label="10er-Karte Gast (€)"
        type="number"
        step="0.01"
        value={preisZehnerkarteGast}
        onChange={(e) => setPreisZehnerkarteGast(e.target.value)}
        hint="Standard: 60 €"
      />
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</Button>
        {saved && <span className="text-sm text-success">Gespeichert!</span>}
      </div>
    </div>
  )
}

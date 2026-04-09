'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const WOCHENTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

interface Trainingszeit {
  id?: string
  wochentag: number
  startzeit: string
  endzeit: string
  ort: string
  hinweis: string
}

interface Props {
  initial: Trainingszeit[]
  sparteSlug: string
}

export function TrainingszeitenEditor({ initial, sparteSlug }: Props) {
  const [zeiten, setZeiten] = useState<Trainingszeit[]>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function addZeit() {
    setZeiten([...zeiten, { wochentag: 0, startzeit: '18:00', endzeit: '20:00', ort: '', hinweis: '' }])
  }

  function removeZeit(index: number) {
    setZeiten(zeiten.filter((_, i) => i !== index))
  }

  function updateZeit(index: number, field: keyof Trainingszeit, value: string | number) {
    const updated = [...zeiten]
    updated[index] = { ...updated[index], [field]: value }
    setZeiten(updated)
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/v1/sparten/${sparteSlug}/trainingszeiten`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingszeiten: zeiten }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-h3 text-text-heading">Trainingszeiten</h3>
        <Button variant="outline" className="text-sm" onClick={addZeit}>+ Hinzufügen</Button>
      </div>

      {zeiten.map((z, i) => (
        <div key={i} className="bg-white p-4 rounded-md border border-border space-y-3">
          <div className="flex justify-between items-center">
            <select
              value={z.wochentag}
              onChange={(e) => updateZeit(i, 'wochentag', parseInt(e.target.value))}
              className="rounded-md border border-border px-3 py-2 text-sm bg-white"
            >
              {WOCHENTAGE.map((tag, wi) => (
                <option key={wi} value={wi}>{tag}</option>
              ))}
            </select>
            <button onClick={() => removeZeit(i)} className="text-error text-sm hover:underline min-h-[44px] px-2">
              Entfernen
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Von" type="time" value={z.startzeit} onChange={(e) => updateZeit(i, 'startzeit', e.target.value)} />
            <Input label="Bis" type="time" value={z.endzeit} onChange={(e) => updateZeit(i, 'endzeit', e.target.value)} />
          </div>
          <Input label="Ort" value={z.ort} onChange={(e) => updateZeit(i, 'ort', e.target.value)} />
          <Input label="Hinweis" value={z.hinweis} onChange={(e) => updateZeit(i, 'hinweis', e.target.value)} />
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</Button>
        {saved && <span className="text-sm text-success">Gespeichert!</span>}
      </div>
    </div>
  )
}

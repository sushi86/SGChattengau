'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface AnsprechpartnerItem {
  id?: string
  name: string
  rolle: string
  telefon: string
  email: string
}

interface Props {
  initial: AnsprechpartnerItem[]
  sparteSlug: string
}

export function AnsprechpartnerEditor({ initial, sparteSlug }: Props) {
  const [personen, setPersonen] = useState<AnsprechpartnerItem[]>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function add() {
    setPersonen([...personen, { name: '', rolle: '', telefon: '', email: '' }])
  }

  function remove(index: number) {
    setPersonen(personen.filter((_, i) => i !== index))
  }

  function update(index: number, field: keyof AnsprechpartnerItem, value: string) {
    const updated = [...personen]
    updated[index] = { ...updated[index], [field]: value }
    setPersonen(updated)
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/v1/sparten/${sparteSlug}/ansprechpartner`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ansprechpartner: personen }),
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
        <h3 className="font-heading text-h3 text-text-heading">Ansprechpartner</h3>
        <Button variant="outline" className="text-sm" onClick={add}>+ Hinzufügen</Button>
      </div>

      {personen.map((p, i) => (
        <div key={i} className="bg-white p-4 rounded-md border border-border space-y-3">
          <div className="flex justify-end">
            <button onClick={() => remove(i)} className="text-error text-sm hover:underline min-h-[44px] px-2">
              Entfernen
            </button>
          </div>
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
            <Input label="Name" value={p.name} onChange={(e) => update(i, 'name', e.target.value)} required />
            <Input label="Rolle" value={p.rolle} onChange={(e) => update(i, 'rolle', e.target.value)} placeholder="z.B. Spartenleiter" />
          </div>
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
            <Input label="Telefon" type="tel" value={p.telefon} onChange={(e) => update(i, 'telefon', e.target.value)} />
            <Input label="E-Mail" type="email" value={p.email} onChange={(e) => update(i, 'email', e.target.value)} />
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</Button>
        {saved && <span className="text-sm text-success">Gespeichert!</span>}
      </div>
    </div>
  )
}

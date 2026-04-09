'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TiptapEditor } from '@/components/ui/tiptap-editor'

interface Props {
  sparte: {
    slug: string
    name: string
    beschreibung: string | null
    typ: string
    isActive: boolean
  }
  isAdmin: boolean
}

export function SparteEditForm({ sparte, isAdmin }: Props) {
  const [name, setName] = useState(sparte.name)
  const [beschreibung, setBeschreibung] = useState(sparte.beschreibung || '')
  const [isActive, setIsActive] = useState(sparte.isActive)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/v1/sparten/${sparte.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isAdmin && { name }),
          beschreibung,
          ...(isAdmin && { isActive }),
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
      <h3 className="font-heading text-h3 text-text-heading">Allgemein</h3>

      {isAdmin && (
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      )}

      <div>
        <label className="block text-sm font-medium text-text-heading mb-1">Beschreibung</label>
        <TiptapEditor content={beschreibung} onChange={setBeschreibung} placeholder="Beschreibung der Sparte..." />
      </div>

      {isAdmin && (
        <label className="flex items-center gap-2 min-h-[44px]">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          <span className="text-text-heading text-sm">Aktiv (auf der Website sichtbar)</span>
        </label>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</Button>
        {saved && <span className="text-sm text-success">Gespeichert!</span>}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TiptapEditor } from '@/components/ui/tiptap-editor'

interface SparteOption {
  id: string
  name: string
}

interface BeitragFormProps {
  beitrag?: {
    id: string
    titel: string
    inhalt: string
    auszug: string | null
    bildUrl: string | null
    sparteId: string | null
    veroeffentlicht: boolean
  }
  sparten: SparteOption[]
  fixedSparteId?: string | null
}

export function BeitragForm({ beitrag, sparten, fixedSparteId }: BeitragFormProps) {
  const router = useRouter()
  const isNew = !beitrag

  const [titel, setTitel] = useState(beitrag?.titel || '')
  const [inhalt, setInhalt] = useState(beitrag?.inhalt || '')
  const [auszug, setAuszug] = useState(beitrag?.auszug || '')
  const [bildUrl, setBildUrl] = useState(beitrag?.bildUrl || '')
  const [sparteId, setSparteId] = useState(beitrag?.sparteId || fixedSparteId || '')
  const [veroeffentlicht, setVeroeffentlicht] = useState(beitrag?.veroeffentlicht ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/v1/upload', { method: 'POST', body: formData })
    if (res.ok) {
      const body = await res.json()
      setBildUrl(body.data.url)
    }
    e.target.value = ''
  }

  async function save() {
    setSaving(true)
    setError('')

    try {
      const url = isNew ? '/api/v1/beitraege' : `/api/v1/beitraege/${beitrag!.id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titel, inhalt, auszug: auszug || undefined, bildUrl: bildUrl || undefined, sparteId: sparteId || undefined, veroeffentlicht }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error?.message || 'Fehler beim Speichern')
        return
      }

      router.push('/admin/beitraege')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-error rounded-md text-sm">{error}</div>}

      <Input label="Titel" value={titel} onChange={(e) => setTitel(e.target.value)} required />

      <div>
        <label className="block text-sm font-medium text-text-heading mb-1">Inhalt</label>
        <TiptapEditor content={inhalt} onChange={setInhalt} placeholder="Beitragsinhalt..." />
      </div>

      <Input label="Auszug (kurze Vorschau)" value={auszug} onChange={(e) => setAuszug(e.target.value)} hint="Optional. Wird in der Übersicht angezeigt." />

      <div>
        <label className="block text-sm font-medium text-text-heading mb-1">Beitragsbild</label>
        <div className="flex items-center gap-3">
          {bildUrl && <img src={bildUrl} alt="Vorschau" className="w-20 h-14 object-cover rounded border border-border" />}
          <label className="cursor-pointer">
            <Button variant="outline" className="text-sm pointer-events-none">Bild wählen</Button>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
          {bildUrl && <button onClick={() => setBildUrl('')} className="text-sm text-error">Entfernen</button>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-heading mb-1">Sparte</label>
        <select
          value={sparteId}
          onChange={(e) => setSparteId(e.target.value)}
          disabled={!!fixedSparteId}
          className={`w-full rounded-md border border-border px-4 py-3 text-text-heading bg-white ${fixedSparteId ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {!fixedSparteId && <option value="">Keine Zuordnung (Vereinsnews)</option>}
          {sparten.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 min-h-[44px]">
        <input
          type="checkbox"
          checked={veroeffentlicht}
          onChange={(e) => setVeroeffentlicht(e.target.checked)}
          className="accent-primary w-4 h-4"
        />
        <span className="text-text-heading text-sm">Veröffentlicht</span>
      </label>

      <div className="flex gap-3 pt-4">
        <Button onClick={save} disabled={saving}>{saving ? 'Speichern...' : isNew ? 'Erstellen' : 'Speichern'}</Button>
        <Button variant="outline" onClick={() => router.back()}>Abbrechen</Button>
      </div>
    </div>
  )
}

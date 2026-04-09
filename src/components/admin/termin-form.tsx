'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SparteOption {
  id: string
  name: string
}

interface TerminFormProps {
  termin?: {
    id: string
    titel: string
    beschreibung: string | null
    startzeit: string
    endzeit: string | null
    ort: string | null
    ganztaegig: boolean
    sparteId: string | null
  }
  sparten: SparteOption[]
}

function toDatetimeLocal(iso: string): string {
  // Convert ISO string to datetime-local format: "YYYY-MM-DDTHH:MM"
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toDateLocal(iso: string): string {
  // Convert ISO string to date input format: "YYYY-MM-DD"
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function TerminForm({ termin, sparten }: TerminFormProps) {
  const router = useRouter()
  const isNew = !termin

  const [titel, setTitel] = useState(termin?.titel || '')
  const [beschreibung, setBeschreibung] = useState(termin?.beschreibung || '')
  const [ganztaegig, setGanztaegig] = useState(termin?.ganztaegig ?? false)
  const [startzeit, setStartzeit] = useState(() => {
    if (!termin?.startzeit) return ''
    return ganztaegig ? toDateLocal(termin.startzeit) : toDatetimeLocal(termin.startzeit)
  })
  const [endzeit, setEndzeit] = useState(() => {
    if (!termin?.endzeit) return ''
    return toDatetimeLocal(termin.endzeit)
  })
  const [ort, setOrt] = useState(termin?.ort || '')
  const [sparteId, setSparteId] = useState(termin?.sparteId || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleGanztaegigChange(checked: boolean) {
    setGanztaegig(checked)
    // Reset times when switching mode to avoid invalid formats
    setStartzeit('')
    setEndzeit('')
  }

  async function save() {
    setSaving(true)
    setError('')

    try {
      // Convert local datetime strings to ISO
      let startzeitIso: string | undefined
      let endzeitIso: string | undefined

      if (startzeit) {
        if (ganztaegig) {
          // For all-day events, use midnight UTC
          startzeitIso = new Date(startzeit + 'T00:00:00').toISOString()
        } else {
          startzeitIso = new Date(startzeit).toISOString()
        }
      }

      if (endzeit && !ganztaegig) {
        endzeitIso = new Date(endzeit).toISOString()
      }

      const url = isNew ? '/api/v1/termine' : `/api/v1/termine/${termin!.id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titel,
          beschreibung: beschreibung || undefined,
          startzeit: startzeitIso,
          endzeit: endzeitIso || undefined,
          ort: ort || undefined,
          ganztaegig,
          sparteId: sparteId || undefined,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error?.message || 'Fehler beim Speichern')
        return
      }

      router.push('/admin/termine')
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
        <label className="block text-sm font-medium text-text-heading mb-1">Beschreibung</label>
        <textarea
          value={beschreibung}
          onChange={(e) => setBeschreibung(e.target.value)}
          rows={4}
          placeholder="Beschreibung des Termins (optional)"
          className="w-full rounded-md border border-border px-4 py-3 text-text-heading bg-white resize-y"
        />
      </div>

      <label className="flex items-center gap-2 min-h-[44px]">
        <input
          type="checkbox"
          checked={ganztaegig}
          onChange={(e) => handleGanztaegigChange(e.target.checked)}
          className="accent-primary w-4 h-4"
        />
        <span className="text-text-heading text-sm">Ganztägig</span>
      </label>

      <div>
        <label className="block text-sm font-medium text-text-heading mb-1">
          {ganztaegig ? 'Datum' : 'Startzeit'}
        </label>
        <input
          type={ganztaegig ? 'date' : 'datetime-local'}
          value={startzeit}
          onChange={(e) => setStartzeit(e.target.value)}
          required
          className="w-full rounded-md border border-border px-4 py-3 text-text-heading bg-white"
        />
      </div>

      {!ganztaegig && (
        <div>
          <label className="block text-sm font-medium text-text-heading mb-1">Endzeit (optional)</label>
          <input
            type="datetime-local"
            value={endzeit}
            onChange={(e) => setEndzeit(e.target.value)}
            className="w-full rounded-md border border-border px-4 py-3 text-text-heading bg-white"
          />
        </div>
      )}

      <Input label="Ort" value={ort} onChange={(e) => setOrt(e.target.value)} hint="Optional" />

      <div>
        <label className="block text-sm font-medium text-text-heading mb-1">Sparte</label>
        <select
          value={sparteId}
          onChange={(e) => setSparteId(e.target.value)}
          className="w-full rounded-md border border-border px-4 py-3 text-text-heading bg-white"
        >
          <option value="">Keine Zuordnung (Vereinstermin)</option>
          {sparten.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={save} disabled={saving}>{saving ? 'Speichern...' : isNew ? 'Erstellen' : 'Speichern'}</Button>
        <Button variant="outline" onClick={() => router.back()}>Abbrechen</Button>
      </div>
    </div>
  )
}

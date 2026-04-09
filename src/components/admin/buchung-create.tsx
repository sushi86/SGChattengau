'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function AdminBuchungCreate() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [datum, setDatum] = useState('')
  const [anlass, setAnlass] = useState('')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/v1/buchungen/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datum,
          anlass,
          name: name || undefined,
          status: 'GENEHMIGT',
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error?.message || 'Fehler')
        return
      }

      setOpen(false)
      setDatum('')
      setAnlass('')
      setName('')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-6">
      <Button variant="outline" className="text-sm" onClick={() => setOpen(!open)}>
        {open ? 'Abbrechen' : '+ Tag blockieren / Belegung einspeichern'}
      </Button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 bg-white p-4 rounded-lg border border-border space-y-3 max-w-lg">
          {error && <p className="text-sm text-error">{error}</p>}
          <Input label="Datum" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} required />
          <Input label="Anlass / Grund" value={anlass} onChange={(e) => setAnlass(e.target.value)} placeholder="z.B. Vereinsfeier, Gesperrt" required />
          <Input label="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Name des Mieters" />
          <Button type="submit" disabled={saving}>{saving ? 'Speichern...' : 'Belegung einspeichern'}</Button>
        </form>
      )}
    </div>
  )
}

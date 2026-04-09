'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export function BuchungFormular() {
  const [data, setData] = useState({
    name: '', email: '', telefon: '', datum: '', startzeit: '14:00', endzeit: '22:00', anlass: '', nachricht: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function update(field: string, value: string) {
    setData({ ...data, [field]: value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})

    try {
      const res = await fetch('/api/v1/buchungen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, website: '' }),
      })

      if (!res.ok) {
        const body = await res.json()
        if (body.error?.details) {
          const fieldErrors: Record<string, string> = {}
          for (const d of body.error.details) {
            fieldErrors[d.field] = d.message
          }
          setErrors(fieldErrors)
        } else {
          setErrors({ submit: body.error?.message || 'Fehler beim Absenden' })
        }
        return
      }

      setSubmitted(true)
    } catch {
      setErrors({ submit: 'Netzwerkfehler. Bitte versuche es erneut.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">&#10003;</div>
        <h3 className="font-heading text-h3 text-text-heading mb-2">Anfrage gesendet!</h3>
        <p className="text-text-body">Du erhältst eine Bestätigung per E-Mail an <strong>{data.email}</strong>.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && <div className="p-3 bg-red-50 text-error rounded-md text-sm">{errors.submit}</div>}

      {/* Honeypot */}
      <div className="hidden"><input type="text" name="website" tabIndex={-1} autoComplete="off" /></div>

      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
        <Input label="Name" value={data.name} onChange={(e) => update('name', e.target.value)} error={errors.name} required />
        <Input label="E-Mail" type="email" value={data.email} onChange={(e) => update('email', e.target.value)} error={errors.email} required />
      </div>

      <Input label="Telefon" type="tel" value={data.telefon} onChange={(e) => update('telefon', e.target.value)} error={errors.telefon} />

      <div className="grid grid-cols-1 tablet:grid-cols-3 gap-4">
        <Input label="Datum" type="date" value={data.datum} onChange={(e) => update('datum', e.target.value)} error={errors.datum} required />
        <Input label="Von" type="time" value={data.startzeit} onChange={(e) => update('startzeit', e.target.value)} error={errors.startzeit} required />
        <Input label="Bis" type="time" value={data.endzeit} onChange={(e) => update('endzeit', e.target.value)} error={errors.endzeit} required />
      </div>

      <Input label="Anlass" value={data.anlass} onChange={(e) => update('anlass', e.target.value)} error={errors.anlass} placeholder="z.B. Geburtstagsfeier, Vereinsfeier" required />

      <Textarea label="Nachricht (optional)" value={data.nachricht} onChange={(e) => update('nachricht', e.target.value)} error={errors.nachricht} placeholder="Besondere Wünsche oder Hinweise" />

      <div className="p-4 bg-primary-light rounded-md text-sm text-text-body">
        <strong className="text-text-heading">Hinweis:</strong> Die Nutzungsgebühr beträgt 50,00 € pro Tag. Nach Genehmigung erhältst du die Zahlungsinformationen per E-Mail.
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Wird gesendet...' : 'Anfrage absenden'}
      </Button>
    </form>
  )
}

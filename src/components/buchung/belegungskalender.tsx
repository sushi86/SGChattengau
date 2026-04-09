'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface BelegterTag {
  datum: string
  status: string
}

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

export function Belegungskalender() {
  const [monthYear, setMonthYear] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [belegteTage, setBelegteTage] = useState<BelegterTag[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', telefon: '', anlass: '', nachricht: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const fetchBelegung = useCallback(async () => {
    const von = new Date(monthYear.year, monthYear.month, 1).toISOString()
    const bis = new Date(monthYear.year, monthYear.month + 1, 0).toISOString()
    const res = await fetch(`/api/v1/buchungen/kalender?von=${von}&bis=${bis}`)
    if (res.ok) {
      const body = await res.json()
      setBelegteTage(body.data || [])
    }
  }, [monthYear])

  useEffect(() => { fetchBelegung() }, [fetchBelegung])

  const { year, month } = monthYear
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  let startDow = new Date(year, month, 1).getDay() - 1
  if (startDow < 0) startDow = 6

  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const belegtByDay = new Map<number, string>()
  for (const b of belegteTage) {
    const d = new Date(b.datum)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      // GENEHMIGT has priority over ANGEFRAGT
      if (!belegtByDay.has(day) || b.status === 'GENEHMIGT') {
        belegtByDay.set(day, b.status)
      }
    }
  }

  const today = new Date()
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  const isPast = (day: number) => new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())

  function handleDayClick(day: number) {
    if (isPast(day)) return
    const status = belegtByDay.get(day)
    if (status === 'GENEHMIGT') return // Belegt, nicht klickbar

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
    setFormData({ name: '', email: '', telefon: '', anlass: '', nachricht: '' })
    setErrors({})
    setSubmitted(false)
  }

  function closeModal() {
    setSelectedDate(null)
    setSubmitted(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})

    try {
      const res = await fetch('/api/v1/buchungen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, datum: selectedDate, website: '' }),
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
      fetchBelegung() // Refresh calendar
    } catch {
      setErrors({ submit: 'Netzwerkfehler. Bitte versuche es erneut.' })
    } finally {
      setSubmitting(false)
    }
  }

  const formatSelectedDate = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonthYear((p) => { const d = new Date(p.year, p.month - 1); return { year: d.getFullYear(), month: d.getMonth() } })}
          className="text-primary hover:text-primary-hover min-h-[44px] px-3 text-lg"
        >←</button>
        <h3 className="font-heading text-h3 text-text-heading">{MONATE[month]} {year}</h3>
        <button
          onClick={() => setMonthYear((p) => { const d = new Date(p.year, p.month + 1); return { year: d.getFullYear(), month: d.getMonth() } })}
          className="text-primary hover:text-primary-hover min-h-[44px] px-3 text-lg"
        >→</button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }} className="mb-1">
        {WOCHENTAGE.map((tag) => (
          <div key={tag} className="text-center text-xs font-medium text-text-body py-1">{tag}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }} className="bg-border rounded-md overflow-hidden">
        {cells.map((day, i) => {
          const status = day ? belegtByDay.get(day) : undefined
          const past = day ? isPast(day) : false
          const isFree = day !== null && !past && status !== 'GENEHMIGT'
          const isClickable = isFree

          return (
            <div
              key={i}
              onClick={() => day !== null && isClickable && handleDayClick(day)}
              className={`min-h-[70px] p-1.5 overflow-hidden transition-colors flex items-center justify-center
                ${day === null ? 'bg-section-alt' : ''}
                ${past ? 'opacity-40' : ''}
                ${status === 'GENEHMIGT' ? 'bg-red-200' : status === 'ANGEFRAGT' ? 'bg-yellow-200' : 'bg-white'}
                ${isClickable ? 'cursor-pointer hover:bg-primary-light' : ''}`}
            >
              {day !== null && (
                <span className={`text-sm font-medium inline-flex items-center justify-center w-8 h-8 rounded-full
                  ${isToday(day) ? 'bg-primary text-white' :
                    status === 'GENEHMIGT' ? 'text-red-800' :
                    status === 'ANGEFRAGT' ? 'text-yellow-800' :
                    'text-text-heading'}`}>
                  {day}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-text-body">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Belegt</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200" /> Angefragt</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border border-border" /> Frei — klicken zum Buchen</span>
      </div>

      {/* Booking Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            {submitted ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✓</div>
                <h3 className="font-heading text-h3 text-text-heading mb-2">Anfrage gesendet!</h3>
                <p className="text-text-body text-sm mb-4">
                  Du erhältst eine Bestätigung per E-Mail an <strong>{formData.email}</strong>.
                </p>
                <Button onClick={closeModal}>Schließen</Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-h3 text-text-heading">Buchungsanfrage</h3>
                  <button onClick={closeModal} className="text-text-body hover:text-text-heading min-h-[44px] min-w-[44px] flex items-center justify-center text-xl">×</button>
                </div>

                <p className="text-sm text-primary font-medium mb-4">{formatSelectedDate}</p>

                <form onSubmit={handleSubmit} className="space-y-2">
                  {errors.submit && <div className="p-2 bg-red-50 text-error rounded-md text-sm">{errors.submit}</div>}

                  <div className="hidden"><input type="text" name="website" tabIndex={-1} autoComplete="off" /></div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} required />
                    <Input label="E-Mail" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={errors.email} required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Telefon" type="tel" value={formData.telefon} onChange={(e) => setFormData({ ...formData, telefon: e.target.value })} />
                    <Input label="Anlass" value={formData.anlass} onChange={(e) => setFormData({ ...formData, anlass: e.target.value })} error={errors.anlass} placeholder="z.B. Geburtstagsfeier" required />
                  </div>
                  <Textarea label="Nachricht (optional)" value={formData.nachricht} onChange={(e) => setFormData({ ...formData, nachricht: e.target.value })} placeholder="Besondere Wünsche" rows={2} />

                  <p className="text-xs text-text-body">
                    <strong>Hinweis:</strong> Nutzungsgebühr 50,00 € / Tag.
                  </p>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Wird gesendet...' : 'Anfrage absenden'}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

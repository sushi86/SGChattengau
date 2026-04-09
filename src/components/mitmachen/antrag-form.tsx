'use client'

import { useState, useEffect, useCallback } from 'react'
import { StepIndicator } from './step-indicator'
import { StepPersoenlich } from './step-persoenlich'
import { StepSparte } from './step-sparte'
import { StepSepa } from './step-sepa'
import { StepEinwilligungen } from './step-einwilligungen'
import { StepSignatur } from './step-signatur'
import { StepZusammenfassung } from './step-zusammenfassung'
import {
  persoenlichesDatenSchema,
  spartenwahlSchema,
  sepaSchema,
  einwilligungenSchema,
  signaturenSchema,
} from '@/lib/validations/mitgliedsantrag'
import { validateIban } from '@/lib/iban'

interface SparteOption {
  id: string
  name: string
  typ: string
}

const INITIAL_DATA = {
  vorname: '',
  nachname: '',
  geburtsdatum: '',
  geschlecht: '',
  strasse: '',
  plz: '',
  ort: '',
  telefon: '',
  email: '',
  erziehungsberechtigter: '',
  sparteId: '',
  eintrittsdatum: '',
  iban: '',
  kontoinhaber: '',
  kreditinstitut: '',
  satzungAkzeptiert: false,
  datenschutzAkzeptiert: false,
  sepaAkzeptiert: false,
  signaturMitglied: '',
  signaturSepa: '',
  signaturErzBerech: '',
}

export function AntragForm() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState(INITIAL_DATA)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sparten, setSparten] = useState<SparteOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/v1/mitgliedsantraege/sparten')
      .then((r) => r.json())
      .then((r) => setSparten(r.data || []))
      .catch(() => {})
  }, [])

  const validateStep = useCallback((stepIndex: number): boolean => {
    let result
    switch (stepIndex) {
      case 0:
        result = persoenlichesDatenSchema.safeParse(data)
        break
      case 1:
        result = spartenwahlSchema.safeParse(data)
        break
      case 2: {
        // Extra IBAN validation
        const ibanResult = validateIban(data.iban)
        if (!ibanResult.valid) {
          setErrors({ iban: ibanResult.error || 'Ungültige IBAN' })
          return false
        }
        result = sepaSchema.safeParse(data)
        break
      }
      case 3:
        result = einwilligungenSchema.safeParse(data)
        break
      case 4:
        result = signaturenSchema.safeParse(data)
        break
      default:
        return true
    }

    if (result && !result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path.join('.')
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return false
    }

    setErrors({})
    return true
  }, [data])

  function goNext() {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 5))
      window.scrollTo(0, 0)
    }
  }

  function goBack() {
    setErrors({})
    setStep((s) => Math.max(s - 1, 0))
    window.scrollTo(0, 0)
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/mitgliedsantraege', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          website: '', // Honeypot — must be empty
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        setErrors({ submit: body.error?.message || 'Fehler beim Absenden' })
        return
      }

      setSubmitted(true)
    } catch {
      setErrors({ submit: 'Netzwerkfehler. Bitte versuche es erneut.' })
    } finally {
      setSubmitting(false)
    }
  }

  // Ist der Antragsteller minderjaehrig?
  const isMinor = data.geburtsdatum
    ? new Date().getFullYear() - new Date(data.geburtsdatum).getFullYear() < 18
    : false

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">{'\u2713'}</div>
        <h2 className="font-heading text-h2 text-text-heading mb-4">
          Antrag erfolgreich eingereicht!
        </h2>
        <p className="text-text-body max-w-md mx-auto">
          Vielen Dank für deinen Mitgliedsantrag. Du erhältst in Kürze eine
          Bestaetigung per E-Mail an <strong>{data.email}</strong>.
        </p>
      </div>
    )
  }

  const sparteName = sparten.find((s) => s.id === data.sparteId)?.name || ''

  return (
    <div>
      <StepIndicator currentStep={step} />

      {errors.submit && (
        <div className="mb-4 p-4 bg-red-50 text-error rounded-md">{errors.submit}</div>
      )}

      {step === 0 && (
        <StepPersoenlich
          data={data}
          onChange={(d) => setData({ ...data, ...d })}
          errors={errors}
          onNext={goNext}
        />
      )}
      {step === 1 && (
        <StepSparte
          data={data}
          onChange={(d) => setData({ ...data, ...d })}
          errors={errors}
          sparten={sparten}
          onNext={goNext}
          onBack={goBack}
        />
      )}
      {step === 2 && (
        <StepSepa
          data={data}
          onChange={(d) => setData({ ...data, ...d })}
          errors={errors}
          onNext={goNext}
          onBack={goBack}
        />
      )}
      {step === 3 && (
        <StepEinwilligungen
          data={data}
          onChange={(d) => setData({ ...data, ...d })}
          errors={errors}
          onNext={goNext}
          onBack={goBack}
        />
      )}
      {step === 4 && (
        <StepSignatur
          data={data}
          onChange={(d) => setData({ ...data, ...d })}
          errors={errors}
          showErzBerech={isMinor}
          onNext={goNext}
          onBack={goBack}
        />
      )}
      {step === 5 && (
        <StepZusammenfassung
          data={data}
          sparteName={sparteName}
          submitting={submitting}
          onSubmit={handleSubmit}
          onBack={goBack}
        />
      )}
    </div>
  )
}

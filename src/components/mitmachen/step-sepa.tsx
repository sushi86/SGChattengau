'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { validateIban, formatIban } from '@/lib/iban'

interface SepaData {
  iban: string
  kontoinhaber: string
  kreditinstitut: string
}

interface StepSepaProps {
  data: SepaData
  onChange: (data: SepaData) => void
  errors: Record<string, string>
  onNext: () => void
  onBack: () => void
}

export function StepSepa({ data, onChange, errors, onNext, onBack }: StepSepaProps) {
  const [ibanError, setIbanError] = useState<string>()

  const handleIbanChange = useCallback((value: string) => {
    setIbanError(undefined)
    const formatted = formatIban(value)

    // Validate when long enough
    if (value.replace(/\s/g, '').length >= 15) {
      const result = validateIban(value)
      if (!result.valid) {
        setIbanError(result.error)
      } else if (result.bankName) {
        onChange({
          ...data,
          iban: formatted,
          kreditinstitut: result.bankName,
        })
        return
      }
    }

    onChange({ ...data, iban: formatted })
  }, [data, onChange])

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-h2 text-text-heading">Bankverbindung</h2>
      <p className="text-text-body">
        Für den Einzug des Mitgliedsbeitrags benötigen wir deine Bankverbindung.
        Die IBAN wird verschluesselt gespeichert.
      </p>

      <Input
        label="IBAN"
        value={data.iban}
        onChange={(e) => handleIbanChange(e.target.value)}
        error={ibanError || errors.iban}
        placeholder="DE00 0000 0000 0000 0000 00"
        inputMode="text"
        autoComplete="off"
        required
      />

      <Input
        label="Kontoinhaber"
        value={data.kontoinhaber}
        onChange={(e) => onChange({ ...data, kontoinhaber: e.target.value })}
        error={errors.kontoinhaber}
        required
      />

      <Input
        label="Kreditinstitut"
        value={data.kreditinstitut}
        onChange={(e) => onChange({ ...data, kreditinstitut: e.target.value })}
        error={errors.kreditinstitut}
        hint="Wird automatisch erkannt, wenn möglich"
        required
      />

      <div className="p-4 bg-primary-light rounded-md text-sm text-text-body">
        <strong className="text-text-heading">Hinweis zur Datensicherheit:</strong>{' '}
        Deine IBAN und der Kontoinhaber werden mit AES-256-GCM verschluesselt
        gespeichert und sind nur für berechtigte Administratoren einsehbar.
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Zurück</Button>
        <Button onClick={onNext}>Weiter</Button>
      </div>
    </div>
  )
}

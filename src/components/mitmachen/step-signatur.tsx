'use client'

import { useRef, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'

interface SignaturenData {
  signaturMitglied: string
  signaturSepa: string
  signaturErzBerech: string
}

interface StepSignaturProps {
  data: SignaturenData
  onChange: (data: SignaturenData) => void
  errors: Record<string, string>
  showErzBerech: boolean
  onNext: () => void
  onBack: () => void
}

function SignaturePad({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  value: string
  onChange: (data: string) => void
  error?: string
}) {
  const sigRef = useRef<SignatureCanvas>(null)

  const handleEnd = useCallback(() => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      onChange(sigRef.current.toDataURL('image/png'))
    }
  }, [onChange])

  const handleClear = useCallback(() => {
    sigRef.current?.clear()
    onChange('')
  }, [onChange])

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-heading">{label}</label>
      <div className={`border rounded-md overflow-hidden ${error ? 'border-error' : 'border-border'}`}>
        <SignatureCanvas
          ref={sigRef}
          penColor="#333333"
          canvasProps={{
            className: 'w-full h-40 bg-white touch-none',
          }}
          onEnd={handleEnd}
        />
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleClear}
          className="text-sm text-text-body hover:text-primary transition-colors min-h-[44px] px-2"
        >
          Unterschrift loeschen
        </button>
        {value && <span className="text-sm text-success">{'\u2713'} Unterschrieben</span>}
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
}

export function StepSignatur({ data, onChange, errors, showErzBerech, onNext, onBack }: StepSignaturProps) {
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-h2 text-text-heading">Unterschriften</h2>
      <p className="text-text-body">
        Bitte unterschreibe in den Feldern unten. Auf Mobilgeraeten kannst du
        mit dem Finger unterschreiben.
      </p>

      <SignaturePad
        label="Unterschrift Mitgliedsantrag *"
        value={data.signaturMitglied}
        onChange={(v) => onChange({ ...data, signaturMitglied: v })}
        error={errors.signaturMitglied}
      />

      <SignaturePad
        label="Unterschrift SEPA-Lastschriftmandat *"
        value={data.signaturSepa}
        onChange={(v) => onChange({ ...data, signaturSepa: v })}
        error={errors.signaturSepa}
      />

      {showErzBerech && (
        <SignaturePad
          label="Unterschrift Erziehungsberechtigte/r *"
          value={data.signaturErzBerech}
          onChange={(v) => onChange({ ...data, signaturErzBerech: v })}
          error={errors.signaturErzBerech}
        />
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Zurück</Button>
        <Button onClick={onNext}>Weiter</Button>
      </div>
    </div>
  )
}

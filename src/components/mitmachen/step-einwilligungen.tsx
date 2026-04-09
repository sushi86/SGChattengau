'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface EinwilligungenData {
  satzungAkzeptiert: boolean
  datenschutzAkzeptiert: boolean
  sepaAkzeptiert: boolean
}

interface StepEinwilligungenProps {
  data: EinwilligungenData
  onChange: (data: EinwilligungenData) => void
  errors: Record<string, string>
  onNext: () => void
  onBack: () => void
}

export function StepEinwilligungen({ data, onChange, errors, onNext, onBack }: StepEinwilligungenProps) {
  function toggle(field: keyof EinwilligungenData) {
    onChange({ ...data, [field]: !data[field] })
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-h2 text-text-heading">Einwilligungen</h2>

      <div className="space-y-4">
        {/* Satzung */}
        <label className="flex items-start gap-3 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={data.satzungAkzeptiert}
            onChange={() => toggle('satzungAkzeptiert')}
            className="accent-primary w-5 h-5 mt-0.5 shrink-0"
          />
          <span className="text-text-body">
            Ich habe die{' '}
            <Link href="/satzung" target="_blank" className="text-primary hover:text-primary-hover underline">
              Satzung des Vereins
            </Link>{' '}
            gelesen und erkenne sie an. <span className="text-error">*</span>
          </span>
        </label>
        {errors.satzungAkzeptiert && <p className="text-sm text-error ml-8">{errors.satzungAkzeptiert}</p>}

        {/* Datenschutz */}
        <label className="flex items-start gap-3 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={data.datenschutzAkzeptiert}
            onChange={() => toggle('datenschutzAkzeptiert')}
            className="accent-primary w-5 h-5 mt-0.5 shrink-0"
          />
          <span className="text-text-body">
            Ich habe die{' '}
            <Link href="/datenschutz" target="_blank" className="text-primary hover:text-primary-hover underline">
              Datenschutzerklaerung
            </Link>{' '}
            gelesen und stimme der Verarbeitung meiner Daten zu. <span className="text-error">*</span>
          </span>
        </label>
        {errors.datenschutzAkzeptiert && <p className="text-sm text-error ml-8">{errors.datenschutzAkzeptiert}</p>}

        {/* SEPA-Mandat */}
        <label className="flex items-start gap-3 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={data.sepaAkzeptiert}
            onChange={() => toggle('sepaAkzeptiert')}
            className="accent-primary w-5 h-5 mt-0.5 shrink-0"
          />
          <span className="text-text-body">
            Ich ermaechtige die SG 1898 Chattengau e.V., Zahlungen von meinem Konto
            mittels Lastschrift einzuziehen. Zugleich weise ich mein Kreditinstitut an,
            die von der SG 1898 Chattengau e.V. auf mein Konto gezogenen Lastschriften einzuloesen.{' '}
            <span className="text-error">*</span>
          </span>
        </label>
        {errors.sepaAkzeptiert && <p className="text-sm text-error ml-8">{errors.sepaAkzeptiert}</p>}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Zurück</Button>
        <Button onClick={onNext}>Weiter</Button>
      </div>
    </div>
  )
}

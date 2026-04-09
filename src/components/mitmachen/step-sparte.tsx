'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SparteOption {
  id: string
  name: string
  typ: string
}

interface SpartenwahlData {
  sparteId: string
  eintrittsdatum: string
}

interface StepSparteProps {
  data: SpartenwahlData
  onChange: (data: SpartenwahlData) => void
  errors: Record<string, string>
  sparten: SparteOption[]
  onNext: () => void
  onBack: () => void
}

export function StepSparte({ data, onChange, errors, sparten, onNext, onBack }: StepSparteProps) {
  const spartenList = sparten.filter((s) => s.typ === 'SPARTE')
  const kurseList = sparten.filter((s) => s.typ === 'KURS')

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-h2 text-text-heading">Spartenwahl</h2>
      <p className="text-text-body">Welcher Sparte oder welchem Kurs moechtest du beitreten?</p>

      {/* Sparten */}
      <div>
        <h3 className="font-heading text-h3 text-text-heading mb-3">Sparten</h3>
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-2">
          {spartenList.map((sparte) => (
            <label
              key={sparte.id}
              className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer
                min-h-[44px] transition-colors
                ${data.sparteId === sparte.id
                  ? 'border-primary bg-primary-light'
                  : 'border-border hover:border-primary-hover'}`}
            >
              <input
                type="radio"
                name="sparteId"
                value={sparte.id}
                checked={data.sparteId === sparte.id}
                onChange={(e) => onChange({ ...data, sparteId: e.target.value })}
                className="accent-primary w-4 h-4"
              />
              <span className="text-text-heading">{sparte.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Kurse */}
      {kurseList.length > 0 && (
        <div>
          <h3 className="font-heading text-h3 text-text-heading mb-3">Kurse</h3>
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-2">
            {kurseList.map((kurs) => (
              <label
                key={kurs.id}
                className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer
                  min-h-[44px] transition-colors
                  ${data.sparteId === kurs.id
                    ? 'border-primary bg-primary-light'
                    : 'border-border hover:border-primary-hover'}`}
              >
                <input
                  type="radio"
                  name="sparteId"
                  value={kurs.id}
                  checked={data.sparteId === kurs.id}
                  onChange={(e) => onChange({ ...data, sparteId: e.target.value })}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-text-heading">{kurs.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {errors.sparteId && <p className="text-sm text-error">{errors.sparteId}</p>}

      <Input
        label="Gewuenschtes Eintrittsdatum"
        type="date"
        value={data.eintrittsdatum}
        onChange={(e) => onChange({ ...data, eintrittsdatum: e.target.value })}
        error={errors.eintrittsdatum}
        required
      />

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Zurück</Button>
        <Button onClick={onNext}>Weiter</Button>
      </div>
    </div>
  )
}

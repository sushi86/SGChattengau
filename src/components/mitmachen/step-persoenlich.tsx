'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PersoenlichData {
  vorname: string
  nachname: string
  geburtsdatum: string
  geschlecht: string
  strasse: string
  plz: string
  ort: string
  telefon: string
  email: string
  erziehungsberechtigter: string
}

interface StepPersoenlichProps {
  data: PersoenlichData
  onChange: (data: PersoenlichData) => void
  errors: Record<string, string>
  onNext: () => void
}

export function StepPersoenlich({ data, onChange, errors, onNext }: StepPersoenlichProps) {
  function update(field: keyof PersoenlichData, value: string) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-h2 text-text-heading">Persönliche Daten</h2>

      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
        <Input
          label="Vorname"
          value={data.vorname}
          onChange={(e) => update('vorname', e.target.value)}
          error={errors.vorname}
          required
        />
        <Input
          label="Nachname"
          value={data.nachname}
          onChange={(e) => update('nachname', e.target.value)}
          error={errors.nachname}
          required
        />
      </div>

      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
        <Input
          label="Geburtsdatum"
          type="date"
          value={data.geburtsdatum}
          onChange={(e) => update('geburtsdatum', e.target.value)}
          error={errors.geburtsdatum}
          required
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-heading">
            Geschlecht <span className="text-error">*</span>
          </label>
          <select
            value={data.geschlecht}
            onChange={(e) => update('geschlecht', e.target.value)}
            className={`w-full rounded-md border px-4 py-3 text-text-heading bg-white h-[50px]
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              ${errors.geschlecht ? 'border-error' : 'border-border'}`}
          >
            <option value="">Bitte wählen</option>
            <option value="M">Männlich</option>
            <option value="W">Weiblich</option>
            <option value="D">Divers</option>
          </select>
          {errors.geschlecht && <p className="text-sm text-error">{errors.geschlecht}</p>}
        </div>
      </div>

      <Input
        label="Straße und Hausnummer"
        value={data.strasse}
        onChange={(e) => update('strasse', e.target.value)}
        error={errors.strasse}
        required
      />

      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
        <Input
          label="PLZ"
          value={data.plz}
          onChange={(e) => update('plz', e.target.value)}
          error={errors.plz}
          inputMode="numeric"
          maxLength={5}
          required
        />
        <Input
          label="Ort"
          value={data.ort}
          onChange={(e) => update('ort', e.target.value)}
          error={errors.ort}
          required
        />
      </div>

      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
        <Input
          label="Telefon"
          type="tel"
          value={data.telefon}
          onChange={(e) => update('telefon', e.target.value)}
          error={errors.telefon}
        />
        <Input
          label="E-Mail"
          type="email"
          value={data.email}
          onChange={(e) => update('email', e.target.value)}
          error={errors.email}
          required
        />
      </div>

      <Input
        label="Erziehungsberechtigter (bei Minderjährigen)"
        value={data.erziehungsberechtigter}
        onChange={(e) => update('erziehungsberechtigter', e.target.value)}
        error={errors.erziehungsberechtigter}
        hint="Name des/der Erziehungsberechtigten, wenn der Antragsteller unter 18 ist"
      />

      <div className="flex justify-end pt-4">
        <Button onClick={onNext}>Weiter</Button>
      </div>
    </div>
  )
}

# Phase 2: Digitaler Mitgliedsantrag — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vollständiger digitaler Mitgliedsantrag mit Multi-Step-Formular, IBAN-Verschlüsselung, Canvas-Signatur, E-Mail-Benachrichtigungen, Admin-Dashboard mit Status-Workflow und Vereinsmeister-CSV-Export.

**Architecture:** Mobile-First Multi-Step-Formular als Client-Component mit React State Management. API-Endpunkte verschlüsseln IBAN/Kontoinhaber/Signaturen serverseitig via AES-256-GCM. Admin-Bereich mit geschützten Routen (NextAuth Session + ADMIN-Rolle). E-Mail-Versand über konfigurierbaren Provider (SystemConfig). CSV-Export entschlüsselt IBANs on-the-fly.

**Tech Stack:** Next.js 15 App Router, Zod, ibantools, react-signature-canvas, Prisma 7, AES-256-GCM, Nodemailer (SMTP) / Resend (API)

---

## Prisma 7 Import Convention

```typescript
// Client & Singleton
import { prisma } from '@/lib/prisma'
// Enums
import { AntragStatus } from '@/generated/prisma/enums'
// Existing utilities
import { encrypt, decrypt, extractLast4 } from '@/lib/encryption'
import { apiSuccess, apiPaginated, apiError } from '@/lib/api-response'
import { ValidationError, UnauthorizedError } from '@/lib/api-error'
import { authenticateRequest, requireRole } from '@/lib/auth-middleware'
```

---

## File Structure

```
src/
├── app/
│   ├── mitmachen/
│   │   └── page.tsx                          # Multi-Step-Formular (REPLACE placeholder)
│   ├── admin/
│   │   ├── layout.tsx                        # Admin-Layout mit Sidebar + Auth-Guard
│   │   ├── page.tsx                          # Admin-Dashboard Startseite
│   │   └── antraege/
│   │       ├── page.tsx                      # Antragsliste
│   │       └── [id]/
│   │           └── page.tsx                  # Antrags-Detailansicht
│   └── api/v1/
│       └── mitgliedsantraege/
│           ├── route.ts                      # POST (public), GET (admin)
│           ├── sparten/
│           │   └── route.ts                  # GET verfügbare Sparten
│           ├── [id]/
│           │   ├── route.ts                  # GET Detail (admin)
│           │   └── status/
│           │       └── route.ts              # PATCH Status (admin)
│           └── export/
│               └── csv/
│                   └── route.ts              # GET CSV-Export (admin)
├── components/
│   ├── mitmachen/
│   │   ├── antrag-form.tsx                   # Multi-Step Orchestrator
│   │   ├── step-persoenlich.tsx              # Step 1: Persönliche Daten
│   │   ├── step-sparte.tsx                   # Step 2: Spartenwahl
│   │   ├── step-sepa.tsx                     # Step 3: SEPA/Bankdaten
│   │   ├── step-einwilligungen.tsx           # Step 4: Einwilligungen
│   │   ├── step-signatur.tsx                 # Step 5: Unterschriften
│   │   ├── step-zusammenfassung.tsx          # Step 6: Zusammenfassung
│   │   └── step-indicator.tsx                # Fortschrittsanzeige
│   ├── admin/
│   │   ├── sidebar.tsx                       # Admin-Navigation
│   │   ├── antrag-list.tsx                   # Antragsliste Komponente
│   │   ├── antrag-detail.tsx                 # Antrags-Detail Komponente
│   │   └── status-badge.tsx                  # Status-Badge (farbig)
│   └── ui/
│       └── input.tsx                         # Wiederverwendbares Input-Element
├── lib/
│   ├── validations/
│   │   └── mitgliedsantrag.ts                # Zod-Schemas für Antrag
│   ├── iban.ts                               # IBAN-Validierung + BIC-Lookup
│   ├── email.ts                              # E-Mail-Service (konfigurierbar)
│   └── email-templates.ts                    # E-Mail-Templates
└── tests/
    └── lib/
        ├── iban.test.ts                      # IBAN-Validierungs-Tests
        └── email.test.ts                     # E-Mail-Service-Tests
```

---

### Task 1: Dependencies installieren

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Neue Dependencies installieren**

Run:
```bash
npm install ibantools react-signature-canvas nodemailer
npm install -D @types/react-signature-canvas @types/nodemailer
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add ibantools, react-signature-canvas, nodemailer"
```

---

### Task 2: IBAN-Validierung + BIC-Lookup (TDD)

**Files:**
- Create: `src/lib/iban.ts`
- Test: `tests/lib/iban.test.ts`

- [ ] **Step 1: Tests schreiben**

```typescript
// tests/lib/iban.test.ts
import { describe, it, expect } from 'vitest'
import { validateIban, formatIban, getBankName } from '@/lib/iban'

describe('validateIban', () => {
  it('accepts a valid German IBAN', () => {
    const result = validateIban('DE89370400440532013000')
    expect(result.valid).toBe(true)
    expect(result.bic).toBeDefined()
  })

  it('accepts a valid IBAN with spaces', () => {
    const result = validateIban('DE89 3704 0044 0532 0130 00')
    expect(result.valid).toBe(true)
  })

  it('rejects an invalid IBAN', () => {
    const result = validateIban('DE00000000000000000000')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('rejects empty input', () => {
    const result = validateIban('')
    expect(result.valid).toBe(false)
  })

  it('rejects non-IBAN strings', () => {
    const result = validateIban('not-an-iban')
    expect(result.valid).toBe(false)
  })
})

describe('formatIban', () => {
  it('formats IBAN with spaces every 4 chars', () => {
    expect(formatIban('DE89370400440532013000')).toBe('DE89 3704 0044 0532 0130 00')
  })

  it('handles already formatted IBAN', () => {
    expect(formatIban('DE89 3704 0044 0532 0130 00')).toBe('DE89 3704 0044 0532 0130 00')
  })
})

describe('getBankName', () => {
  it('returns bank name for known BIC', () => {
    const name = getBankName('COBADEFFXXX')
    expect(name).toBe('Commerzbank')
  })

  it('returns BIC for unknown banks', () => {
    const name = getBankName('UNKNOWNBIC')
    expect(name).toBe('UNKNOWNBIC')
  })
})
```

- [ ] **Step 2: Tests ausführen — FAIL**

Run: `npx vitest run tests/lib/iban.test.ts`

- [ ] **Step 3: IBAN-Modul implementieren**

```typescript
// src/lib/iban.ts
import { validateIBAN, extractBIC, friendlyFormatIBAN, electronicFormatIBAN } from 'ibantools'

interface IbanValidationResult {
  valid: boolean
  bic?: string
  bankName?: string
  error?: string
}

// Bekannte deutsche BICs → Banknamen
const KNOWN_BANKS: Record<string, string> = {
  'COBADEFFXXX': 'Commerzbank',
  'COBADEFF': 'Commerzbank',
  'DEUTDEDBFRA': 'Deutsche Bank',
  'DEUTDEFF': 'Deutsche Bank',
  'DRESDEFF': 'Commerzbank (ehem. Dresdner)',
  'GENODED1GDB': 'GLS Bank',
  'GENODEF1EK1': 'Evangelische Bank',
  'HELADEF1KAS': 'Kasseler Sparkasse',
  'HELADEF1MEG': 'Kreissparkasse Schwalm-Eder',
  'PBNKDEFF': 'Postbank',
  'NOLADE21KAS': 'Kasseler Bank',
  'BYLADEM1001': 'DKB',
  'INGDDEFFXXX': 'ING',
  'INGDDEFF': 'ING',
  'RABONL2U': 'Rabobank',
  'SOLADEST': 'Landesbank Baden-Württemberg',
  'MAABORSMXXX': 'N26',
}

export function validateIban(input: string): IbanValidationResult {
  if (!input || input.trim().length === 0) {
    return { valid: false, error: 'IBAN ist erforderlich' }
  }

  const electronic = electronicFormatIBAN(input.trim())
  if (!electronic) {
    return { valid: false, error: 'Ungültiges IBAN-Format' }
  }

  const validation = validateIBAN(electronic)
  if (!validation.valid) {
    return { valid: false, error: 'Ungültige IBAN' }
  }

  const bic = extractBIC(electronic)
  const bicStr = bic?.bic || undefined
  const bankName = bicStr ? getBankName(bicStr) : undefined

  return { valid: true, bic: bicStr, bankName }
}

export function formatIban(iban: string): string {
  return friendlyFormatIBAN(iban.replace(/\s/g, '')) || iban
}

export function getBankName(bic: string): string {
  // Check exact match first, then prefix match (without XXX)
  if (KNOWN_BANKS[bic]) return KNOWN_BANKS[bic]
  const prefix = bic.replace(/XXX$/, '')
  if (KNOWN_BANKS[prefix]) return KNOWN_BANKS[prefix]
  return bic
}
```

- [ ] **Step 4: Tests ausführen — PASS**

Run: `npx vitest run tests/lib/iban.test.ts`

Expected: Alle Tests grün. Falls `extractBIC` nicht direkt den BIC aus einer IBAN berechnet (ibantools v4+ API-Änderung), anpassen: BIC-Lookup aus den ersten 8 Ziffern der IBAN ableiten oder einfach nur die IBAN-Validierung nutzen und den BIC weglassen.

- [ ] **Step 5: Commit**

```bash
git add src/lib/iban.ts tests/lib/iban.test.ts
git commit -m "feat: IBAN validation and BIC lookup with ibantools"
```

---

### Task 3: Zod-Validierungsschemas für Mitgliedsantrag

**Files:**
- Create: `src/lib/validations/mitgliedsantrag.ts`

- [ ] **Step 1: Schemas erstellen**

```typescript
// src/lib/validations/mitgliedsantrag.ts
import { z } from 'zod'

// Step 1: Persönliche Daten
export const persoenlichesDatenSchema = z.object({
  vorname: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein'),
  nachname: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein'),
  geburtsdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  geschlecht: z.enum(['M', 'W', 'D'], { message: 'Bitte Geschlecht wählen' }),
  strasse: z.string().min(3, 'Straße muss mindestens 3 Zeichen lang sein'),
  plz: z.string().regex(/^\d{5}$/, 'PLZ muss 5 Ziffern haben'),
  ort: z.string().min(2, 'Ort muss mindestens 2 Zeichen lang sein'),
  telefon: z.string().optional(),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  erziehungsberechtigter: z.string().optional(),
})

// Step 2: Spartenwahl
export const spartenwahlSchema = z.object({
  sparteId: z.string().min(1, 'Bitte eine Sparte wählen'),
  eintrittsdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
})

// Step 3: SEPA-Daten
export const sepaSchema = z.object({
  iban: z.string().min(15, 'IBAN ist zu kurz'),
  kontoinhaber: z.string().min(2, 'Kontoinhaber muss mindestens 2 Zeichen lang sein'),
  kreditinstitut: z.string().min(1, 'Kreditinstitut fehlt'),
})

// Step 4: Einwilligungen
export const einwilligungenSchema = z.object({
  satzungAkzeptiert: z.literal(true, { errorMap: () => ({ message: 'Satzung muss akzeptiert werden' }) }),
  datenschutzAkzeptiert: z.literal(true, { errorMap: () => ({ message: 'Datenschutz muss akzeptiert werden' }) }),
  sepaAkzeptiert: z.literal(true, { errorMap: () => ({ message: 'SEPA-Mandat muss erteilt werden' }) }),
})

// Step 5: Signaturen
export const signaturenSchema = z.object({
  signaturMitglied: z.string().min(100, 'Unterschrift fehlt'),
  signaturSepa: z.string().min(100, 'SEPA-Unterschrift fehlt'),
  signaturErzBerech: z.string().optional(),
})

// Vollständiger Antrag (API-Validierung)
export const mitgliedsantragSchema = persoenlichesDatenSchema
  .merge(spartenwahlSchema)
  .merge(sepaSchema)
  .merge(einwilligungenSchema)
  .merge(signaturenSchema)

export type MitgliedsantragInput = z.infer<typeof mitgliedsantragSchema>

// Honeypot-Feld: Wenn ausgefüllt → Bot
export const antragSubmitSchema = mitgliedsantragSchema.extend({
  website: z.string().max(0, 'Bot detected').optional(), // Honeypot
})
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validations/mitgliedsantrag.ts
git commit -m "feat: Zod validation schemas for membership application"
```

---

### Task 4: Wiederverwendbare UI-Komponente: Input

**Files:**
- Create: `src/components/ui/input.tsx`

- [ ] **Step 1: Input-Komponente erstellen**

```tsx
// src/components/ui/input.tsx
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, id, className = '', ...props }, ref) {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1">
        <label htmlFor={inputId} className="block text-sm font-medium text-text-heading">
          {label}
          {props.required && <span className="text-error ml-0.5">*</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-md border px-4 py-3 text-text-heading
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            ${error ? 'border-error' : 'border-border'}
            ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-text-body">{hint}</p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-error">{error}</p>
        )}
      </div>
    )
  }
)
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/input.tsx
git commit -m "feat: reusable Input component with label, error, hint"
```

---

### Task 5: Step-Indicator Komponente

**Files:**
- Create: `src/components/mitmachen/step-indicator.tsx`

- [ ] **Step 1: Step-Indicator erstellen**

```tsx
// src/components/mitmachen/step-indicator.tsx
const STEPS = [
  'Persönliche Daten',
  'Sparte',
  'Bankdaten',
  'Einwilligungen',
  'Unterschrift',
  'Zusammenfassung',
]

interface StepIndicatorProps {
  currentStep: number // 0-indexed
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      {/* Mobile: nur Text */}
      <p className="tablet:hidden text-sm text-text-body text-center mb-2">
        Schritt {currentStep + 1} von {STEPS.length}: <strong className="text-text-heading">{STEPS[currentStep]}</strong>
      </p>

      {/* Mobile: Fortschrittsbalken */}
      <div className="tablet:hidden h-2 bg-border-light rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Tablet+: Schritte als Punkte */}
      <div className="hidden tablet:flex items-center justify-between">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                  ${i < currentStep ? 'bg-primary text-white' : ''}
                  ${i === currentStep ? 'bg-primary text-white ring-4 ring-primary-light' : ''}
                  ${i > currentStep ? 'bg-border-light text-text-body' : ''}`}
              >
                {i < currentStep ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 ${i <= currentStep ? 'text-text-heading' : 'text-text-body'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-12 desktop:w-20 mx-2 ${i < currentStep ? 'bg-primary' : 'bg-border-light'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mitmachen/step-indicator.tsx
git commit -m "feat: multi-step form progress indicator"
```

---

### Task 6: Step 1 — Persönliche Daten

**Files:**
- Create: `src/components/mitmachen/step-persoenlich.tsx`

- [ ] **Step 1: Komponente erstellen**

```tsx
// src/components/mitmachen/step-persoenlich.tsx
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
            className={`w-full rounded-md border px-4 py-3 text-text-heading bg-white
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mitmachen/step-persoenlich.tsx
git commit -m "feat: Step 1 — personal data form"
```

---

### Task 7: Step 2 — Spartenwahl

**Files:**
- Create: `src/components/mitmachen/step-sparte.tsx`

- [ ] **Step 1: Komponente erstellen**

```tsx
// src/components/mitmachen/step-sparte.tsx
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
      <p className="text-text-body">Welcher Sparte oder welchem Kurs möchtest du beitreten?</p>

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
        label="Gewünschtes Eintrittsdatum"
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mitmachen/step-sparte.tsx
git commit -m "feat: Step 2 — division/course selection"
```

---

### Task 8: Step 3 — SEPA-Bankdaten mit IBAN-Validierung

**Files:**
- Create: `src/components/mitmachen/step-sepa.tsx`

- [ ] **Step 1: Komponente erstellen**

```tsx
// src/components/mitmachen/step-sepa.tsx
'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { validateIban, formatIban, getBankName } from '@/lib/iban'

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
        Die IBAN wird verschlüsselt gespeichert.
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
        Deine IBAN und der Kontoinhaber werden mit AES-256-GCM verschlüsselt
        gespeichert und sind nur für berechtigte Administratoren einsehbar.
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Zurück</Button>
        <Button onClick={onNext}>Weiter</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mitmachen/step-sepa.tsx
git commit -m "feat: Step 3 — SEPA bank data with IBAN validation"
```

---

### Task 9: Step 4 — Einwilligungen

**Files:**
- Create: `src/components/mitmachen/step-einwilligungen.tsx`

- [ ] **Step 1: Komponente erstellen**

```tsx
// src/components/mitmachen/step-einwilligungen.tsx
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
              Datenschutzerklärung
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
            Ich ermächtige die SG 1898 Chattengau e.V., Zahlungen von meinem Konto
            mittels Lastschrift einzuziehen. Zugleich weise ich mein Kreditinstitut an,
            die von der SG 1898 Chattengau e.V. auf mein Konto gezogenen Lastschriften einzulösen.{' '}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mitmachen/step-einwilligungen.tsx
git commit -m "feat: Step 4 — consent checkboxes (Satzung, DSGVO, SEPA)"
```

---

### Task 10: Step 5 — Canvas-Signaturen

**Files:**
- Create: `src/components/mitmachen/step-signatur.tsx`

- [ ] **Step 1: Komponente erstellen**

```tsx
// src/components/mitmachen/step-signatur.tsx
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
          Unterschrift löschen
        </button>
        {value && <span className="text-sm text-success">✓ Unterschrieben</span>}
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
        Bitte unterschreibe in den Feldern unten. Auf Mobilgeräten kannst du
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mitmachen/step-signatur.tsx
git commit -m "feat: Step 5 — touch-optimized signature canvas"
```

---

### Task 11: Step 6 — Zusammenfassung + Absenden

**Files:**
- Create: `src/components/mitmachen/step-zusammenfassung.tsx`

- [ ] **Step 1: Komponente erstellen**

```tsx
// src/components/mitmachen/step-zusammenfassung.tsx
'use client'

import { Button } from '@/components/ui/button'

interface ZusammenfassungProps {
  data: {
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
    sparteId: string
    eintrittsdatum: string
    iban: string
    kontoinhaber: string
    kreditinstitut: string
  }
  sparteName: string
  submitting: boolean
  onSubmit: () => void
  onBack: () => void
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex flex-col tablet:flex-row tablet:gap-4 py-2 border-b border-border-light">
      <dt className="text-sm text-text-body tablet:w-48 shrink-0">{label}</dt>
      <dd className="text-text-heading">{value}</dd>
    </div>
  )
}

const GESCHLECHT_LABELS: Record<string, string> = {
  M: 'Männlich',
  W: 'Weiblich',
  D: 'Divers',
}

export function StepZusammenfassung({ data, sparteName, submitting, onSubmit, onBack }: ZusammenfassungProps) {
  // IBAN maskieren: nur letzte 4 Zeichen zeigen
  const ibanMasked = data.iban
    ? '•••• •••• •••• •••• ' + data.iban.replace(/\s/g, '').slice(-4)
    : ''

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-h2 text-text-heading">Zusammenfassung</h2>
      <p className="text-text-body">Bitte prüfe deine Angaben. Mit &quot;Antrag absenden&quot; wird der Antrag verbindlich eingereicht.</p>

      <div>
        <h3 className="font-heading text-h3 text-text-heading mb-2">Persönliche Daten</h3>
        <dl>
          <Row label="Name" value={`${data.vorname} ${data.nachname}`} />
          <Row label="Geburtsdatum" value={data.geburtsdatum} />
          <Row label="Geschlecht" value={GESCHLECHT_LABELS[data.geschlecht] || data.geschlecht} />
          <Row label="Adresse" value={`${data.strasse}, ${data.plz} ${data.ort}`} />
          <Row label="Telefon" value={data.telefon} />
          <Row label="E-Mail" value={data.email} />
          <Row label="Erziehungsberechtigter" value={data.erziehungsberechtigter} />
        </dl>
      </div>

      <div>
        <h3 className="font-heading text-h3 text-text-heading mb-2">Sparte</h3>
        <dl>
          <Row label="Sparte/Kurs" value={sparteName} />
          <Row label="Eintrittsdatum" value={data.eintrittsdatum} />
        </dl>
      </div>

      <div>
        <h3 className="font-heading text-h3 text-text-heading mb-2">Bankverbindung</h3>
        <dl>
          <Row label="IBAN" value={ibanMasked} />
          <Row label="Kontoinhaber" value={data.kontoinhaber} />
          <Row label="Kreditinstitut" value={data.kreditinstitut} />
        </dl>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={submitting}>Zurück</Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Wird gesendet...' : 'Antrag absenden'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mitmachen/step-zusammenfassung.tsx
git commit -m "feat: Step 6 — summary with masked IBAN and submit"
```

---

### Task 12: Multi-Step Orchestrator + Mitmachen-Seite

**Files:**
- Create: `src/components/mitmachen/antrag-form.tsx`
- Modify: `src/app/mitmachen/page.tsx`

- [ ] **Step 1: Orchestrator-Komponente erstellen**

```tsx
// src/components/mitmachen/antrag-form.tsx
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

  // Ist der Antragsteller minderjährig?
  const isMinor = data.geburtsdatum
    ? new Date().getFullYear() - new Date(data.geburtsdatum).getFullYear() < 18
    : false

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="font-heading text-h2 text-text-heading mb-4">
          Antrag erfolgreich eingereicht!
        </h2>
        <p className="text-text-body max-w-md mx-auto">
          Vielen Dank für deinen Mitgliedsantrag. Du erhältst in Kürze eine
          Bestätigung per E-Mail an <strong>{data.email}</strong>.
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
```

- [ ] **Step 2: Mitmachen-Seite aktualisieren**

Datei `src/app/mitmachen/page.tsx` ersetzen:

```tsx
// src/app/mitmachen/page.tsx
import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'
import { AntragForm } from '@/components/mitmachen/antrag-form'

export const metadata: Metadata = {
  title: 'Mitglied werden',
  description: 'Werde Mitglied bei der SG 1898 Chattengau e.V. — Online-Mitgliedsantrag.',
}

export default function MitmachenPage() {
  return (
    <section className="py-8 tablet:py-12">
      <Container className="max-w-2xl">
        <h1 className="font-heading text-h1 text-text-heading mb-2">Mitglied werden</h1>
        <p className="text-text-body mb-8">
          Fülle den Antrag aus, um Mitglied bei der SG 1898 Chattengau e.V. zu werden.
          Alle mit <span className="text-error">*</span> markierten Felder sind Pflichtfelder.
        </p>
        <AntragForm />
      </Container>
    </section>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/mitmachen/antrag-form.tsx src/app/mitmachen/page.tsx
git commit -m "feat: multi-step membership application form orchestrator"
```

---

### Task 13: API — POST Mitgliedsantrag (öffentlich) + GET Sparten

**Files:**
- Create: `src/app/api/v1/mitgliedsantraege/route.ts`
- Create: `src/app/api/v1/mitgliedsantraege/sparten/route.ts`

- [ ] **Step 1: Sparten-Endpunkt für Formular erstellen**

```typescript
// src/app/api/v1/mitgliedsantraege/sparten/route.ts
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET() {
  try {
    const sparten = await prisma.sparte.findMany({
      where: { isActive: true },
      select: { id: true, name: true, typ: true },
      orderBy: { sortOrder: 'asc' },
    })

    return apiSuccess(sparten)
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 2: POST-Endpunkt mit Verschlüsselung erstellen**

```typescript
// src/app/api/v1/mitgliedsantraege/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt, extractLast4 } from '@/lib/encryption'
import { apiSuccess, apiPaginated, apiError } from '@/lib/api-response'
import { ValidationError } from '@/lib/api-error'
import { antragSubmitSchema } from '@/lib/validations/mitgliedsantrag'
import { authenticateRequest, requireRole } from '@/lib/auth-middleware'

// POST: Neuen Antrag einreichen (öffentlich)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = antragSubmitSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }))
      )
    }

    const d = parsed.data

    // Honeypot check
    if (d.website && d.website.length > 0) {
      // Silently accept but don't save (bot trap)
      return apiSuccess({ id: 'ok' }, 201)
    }

    // Encrypt sensitive fields
    const ibanClean = d.iban.replace(/\s/g, '')
    const ibanEncrypted = encrypt(ibanClean)
    const ibanLast4 = extractLast4(ibanClean)
    const kontoinhaberEncrypted = encrypt(d.kontoinhaber)
    const signaturMitgliedEncrypted = d.signaturMitglied ? encrypt(d.signaturMitglied) : null
    const signaturSepaEncrypted = d.signaturSepa ? encrypt(d.signaturSepa) : null
    const signaturErzBerechEncrypted = d.signaturErzBerech ? encrypt(d.signaturErzBerech) : null

    const antrag = await prisma.mitgliedsantrag.create({
      data: {
        vorname: d.vorname,
        nachname: d.nachname,
        geburtsdatum: new Date(d.geburtsdatum),
        geschlecht: d.geschlecht,
        strasse: d.strasse,
        plz: d.plz,
        ort: d.ort,
        telefon: d.telefon || null,
        email: d.email,
        erziehungsberechtigter: d.erziehungsberechtigter || null,
        sparteId: d.sparteId,
        eintrittsdatum: new Date(d.eintrittsdatum),
        ibanEncrypted,
        ibanLast4,
        kontoinhaberEncrypted,
        kreditinstitut: d.kreditinstitut,
        signaturMitgliedEncrypted,
        signaturSepaEncrypted,
        signaturErzBerechEncrypted,
        satzungAkzeptiert: d.satzungAkzeptiert,
        datenschutzAkzeptiert: d.datenschutzAkzeptiert,
        sepaAkzeptiert: d.sepaAkzeptiert,
        ipAdresse: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        userAgent: req.headers.get('user-agent') || null,
      },
    })

    // TODO Phase 2 Task 14: E-Mail-Benachrichtigungen hier auslösen

    return apiSuccess({ id: antrag.id }, 201)
  } catch (err) {
    return apiError(err)
  }
}

// GET: Antragsliste (nur Admin)
export async function GET(req: NextRequest) {
  try {
    const checkAdmin = requireRole('ADMIN')
    await checkAdmin(req)

    const url = new URL(req.url)
    const seite = parseInt(url.searchParams.get('seite') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const status = url.searchParams.get('status')
    const sparteId = url.searchParams.get('sparte')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (sparteId) where.sparteId = sparteId

    const [antraege, gesamt] = await Promise.all([
      prisma.mitgliedsantrag.findMany({
        where,
        include: { sparte: { select: { name: true, typ: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (seite - 1) * limit,
        take: limit,
      }),
      prisma.mitgliedsantrag.count({ where }),
    ])

    // Strip encrypted fields from list view
    const safe = antraege.map((a) => ({
      id: a.id,
      status: a.status,
      vorname: a.vorname,
      nachname: a.nachname,
      email: a.email,
      geburtsdatum: a.geburtsdatum,
      geschlecht: a.geschlecht,
      sparte: a.sparte,
      ibanLast4: a.ibanLast4,
      createdAt: a.createdAt,
      bearbeitetAm: a.bearbeitetAm,
      exportiertAm: a.exportiertAm,
    }))

    return apiPaginated(safe, { seite, limit, gesamt })
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/v1/mitgliedsantraege/
git commit -m "feat: membership application API (POST public, GET admin list)"
```

---

### Task 14: API — GET Detail + PATCH Status (Admin)

**Files:**
- Create: `src/app/api/v1/mitgliedsantraege/[id]/route.ts`
- Create: `src/app/api/v1/mitgliedsantraege/[id]/status/route.ts`

- [ ] **Step 1: Detail-Endpunkt mit IBAN-Entschlüsselung**

```typescript
// src/app/api/v1/mitgliedsantraege/[id]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError } from '@/lib/api-error'
import { requireRole } from '@/lib/auth-middleware'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const checkAdmin = requireRole('ADMIN')
    await checkAdmin(req)

    const { id } = await params

    const antrag = await prisma.mitgliedsantrag.findUnique({
      where: { id },
      include: { sparte: { select: { name: true, typ: true } } },
    })

    if (!antrag) throw new NotFoundError('Mitgliedsantrag')

    // Decrypt sensitive fields for admin detail view
    return apiSuccess({
      ...antrag,
      ibanEncrypted: undefined,
      kontoinhaberEncrypted: undefined,
      signaturMitgliedEncrypted: undefined,
      signaturSepaEncrypted: undefined,
      signaturErzBerechEncrypted: undefined,
      iban: decrypt(antrag.ibanEncrypted),
      kontoinhaber: decrypt(antrag.kontoinhaberEncrypted),
      signaturMitglied: antrag.signaturMitgliedEncrypted
        ? decrypt(antrag.signaturMitgliedEncrypted)
        : null,
      signaturSepa: antrag.signaturSepaEncrypted
        ? decrypt(antrag.signaturSepaEncrypted)
        : null,
      signaturErzBerech: antrag.signaturErzBerechEncrypted
        ? decrypt(antrag.signaturErzBerechEncrypted)
        : null,
    })
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 2: Status-Endpunkt**

```typescript
// src/app/api/v1/mitgliedsantraege/[id]/status/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { ValidationError, NotFoundError } from '@/lib/api-error'
import { requireRole } from '@/lib/auth-middleware'

const statusSchema = z.object({
  status: z.enum(['EINGEGANGEN', 'IN_BEARBEITUNG', 'ABGESCHLOSSEN', 'EXPORTIERT', 'ABGELEHNT']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const checkAdmin = requireRole('ADMIN')
    const user = await checkAdmin(req)

    const { id } = await params
    const body = await req.json()
    const parsed = statusSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültiger Status',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const existing = await prisma.mitgliedsantrag.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Mitgliedsantrag')

    const updated = await prisma.mitgliedsantrag.update({
      where: { id },
      data: {
        status: parsed.data.status,
        bearbeitetAm: new Date(),
        bearbeitetVon: user.id,
      },
    })

    return apiSuccess({ id: updated.id, status: updated.status })
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/v1/mitgliedsantraege/\[id\]/
git commit -m "feat: admin API for application detail (decrypted) and status update"
```

---

### Task 15: API — CSV-Export für Vereinsmeister

**Files:**
- Create: `src/app/api/v1/mitgliedsantraege/export/csv/route.ts`

- [ ] **Step 1: CSV-Export-Endpunkt erstellen**

```typescript
// src/app/api/v1/mitgliedsantraege/export/csv/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { apiError } from '@/lib/api-response'
import { requireRole } from '@/lib/auth-middleware'

function formatDate(date: Date): string {
  const d = new Date(date)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

function escapeCSV(value: string | null | undefined): string {
  if (!value) return ''
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET(req: NextRequest) {
  try {
    const checkAdmin = requireRole('ADMIN')
    await checkAdmin(req)

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const sparteId = url.searchParams.get('sparte')
    const nurNeue = url.searchParams.get('nur_neue') === 'true'

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (sparteId) where.sparteId = sparteId
    if (nurNeue) where.exportiertAm = null

    const antraege = await prisma.mitgliedsantrag.findMany({
      where,
      include: { sparte: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    })

    // CSV header (Vereinsmeister-kompatibel, Semikolon-getrennt)
    const header = 'Nachname;Vorname;Strasse;PLZ;Ort;Geburtsdatum;Geschlecht;Telefon;Email;Eintrittsdatum;Sparte;IBAN;Kontoinhaber;Kreditinstitut;Mandatsreferenz;Erziehungsberechtigter'

    const rows = antraege.map((a) => {
      const iban = decrypt(a.ibanEncrypted)
      const kontoinhaber = decrypt(a.kontoinhaberEncrypted)

      return [
        escapeCSV(a.nachname),
        escapeCSV(a.vorname),
        escapeCSV(a.strasse),
        escapeCSV(a.plz),
        escapeCSV(a.ort),
        formatDate(a.geburtsdatum),
        a.geschlecht,
        escapeCSV(a.telefon),
        escapeCSV(a.email),
        formatDate(a.eintrittsdatum),
        escapeCSV(a.sparte.name),
        iban,
        escapeCSV(kontoinhaber),
        escapeCSV(a.kreditinstitut),
        '', // Mandatsreferenz — wird vom Vereinsmeister generiert
        escapeCSV(a.erziehungsberechtigter),
      ].join(';')
    })

    // Mark as exported
    if (antraege.length > 0) {
      await prisma.mitgliedsantrag.updateMany({
        where: { id: { in: antraege.map((a) => a.id) } },
        data: { exportiertAm: new Date() },
      })
    }

    // UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF'
    const csv = bom + header + '\n' + rows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="mitglieder-export-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-cache, no-store',
      },
    })
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/v1/mitgliedsantraege/export/
git commit -m "feat: Vereinsmeister-compatible CSV export with on-the-fly IBAN decryption"
```

---

### Task 16: E-Mail-Service (konfigurierbar)

**Files:**
- Create: `src/lib/email.ts`
- Create: `src/lib/email-templates.ts`
- Test: `tests/lib/email.test.ts`

- [ ] **Step 1: E-Mail-Tests schreiben**

```typescript
// tests/lib/email.test.ts
import { describe, it, expect } from 'vitest'
import { renderAntragBestaetigung, renderAntragBenachrichtigung } from '@/lib/email-templates'

describe('email templates', () => {
  const antragData = {
    vorname: 'Max',
    nachname: 'Mustermann',
    email: 'max@example.de',
    sparteName: 'Fußball',
    eintrittsdatum: '2026-05-01',
  }

  it('renders confirmation email for applicant', () => {
    const result = renderAntragBestaetigung(antragData)
    expect(result.subject).toContain('Mitgliedsantrag')
    expect(result.html).toContain('Max Mustermann')
    expect(result.html).toContain('Fußball')
    expect(result.html).toContain('max@example.de')
  })

  it('renders notification email for office', () => {
    const result = renderAntragBenachrichtigung(antragData)
    expect(result.subject).toContain('Neuer Mitgliedsantrag')
    expect(result.html).toContain('Max Mustermann')
    expect(result.html).toContain('Fußball')
  })
})
```

- [ ] **Step 2: Tests ausführen — FAIL**

Run: `npx vitest run tests/lib/email.test.ts`

- [ ] **Step 3: E-Mail-Templates implementieren**

```typescript
// src/lib/email-templates.ts
interface AntragEmailData {
  vorname: string
  nachname: string
  email: string
  sparteName: string
  eintrittsdatum: string
}

interface EmailContent {
  subject: string
  html: string
  text: string
}

export function renderAntragBestaetigung(data: AntragEmailData): EmailContent {
  const name = `${data.vorname} ${data.nachname}`

  return {
    subject: 'Dein Mitgliedsantrag bei der SG 1898 Chattengau e.V.',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Mitgliedsantrag eingegangen</h2>
        <p>Hallo ${data.vorname},</p>
        <p>vielen Dank für deinen Mitgliedsantrag bei der SG 1898 Chattengau e.V.!</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">E-Mail</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.email}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Sparte</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.sparteName}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Eintrittsdatum</td><td style="padding: 8px;">${data.eintrittsdatum}</td></tr>
        </table>
        <p>Dein Antrag wird nun bearbeitet. Du erhältst eine weitere Benachrichtigung, sobald er bestätigt wurde.</p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          SG 1898 Chattengau e.V. — Wir bewegen Niedenstein!
        </p>
      </div>
    `,
    text: `Mitgliedsantrag eingegangen\n\nHallo ${data.vorname},\n\nvielen Dank für deinen Mitgliedsantrag bei der SG 1898 Chattengau e.V.!\n\nName: ${name}\nE-Mail: ${data.email}\nSparte: ${data.sparteName}\nEintrittsdatum: ${data.eintrittsdatum}\n\nDein Antrag wird nun bearbeitet.\n\nSG 1898 Chattengau e.V.`,
  }
}

export function renderAntragBenachrichtigung(data: AntragEmailData): EmailContent {
  const name = `${data.vorname} ${data.nachname}`

  return {
    subject: `Neuer Mitgliedsantrag: ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Neuer Mitgliedsantrag</h2>
        <p>Ein neuer Mitgliedsantrag wurde eingereicht:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">E-Mail</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.email}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Sparte</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.sparteName}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Eintrittsdatum</td><td style="padding: 8px;">${data.eintrittsdatum}</td></tr>
        </table>
        <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/antraege" style="color: #2ea3f2;">Im Admin-Dashboard ansehen →</a></p>
      </div>
    `,
    text: `Neuer Mitgliedsantrag: ${name}\n\nE-Mail: ${data.email}\nSparte: ${data.sparteName}\nEintrittsdatum: ${data.eintrittsdatum}`,
  }
}
```

- [ ] **Step 4: E-Mail-Service implementieren**

```typescript
// src/lib/email.ts
import nodemailer from 'nodemailer'
import { prisma } from './prisma'
import { decrypt } from './encryption'

interface SendMailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

async function getEmailConfig(): Promise<{
  provider: string
  from: string
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPass?: string
  resendApiKey?: string
}> {
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: [
          'email_provider',
          'email_from',
          'smtp_host',
          'smtp_port',
          'smtp_user',
          'smtp_pass',
          'resend_api_key',
        ],
      },
    },
  })

  const get = (key: string) => {
    const c = configs.find((c) => c.key === key)
    if (!c) return undefined
    return c.encrypted ? decrypt(c.value) : c.value
  }

  return {
    provider: get('email_provider') || 'smtp',
    from: get('email_from') || 'noreply@sg1898chattengau.de',
    smtpHost: get('smtp_host'),
    smtpPort: get('smtp_port') ? parseInt(get('smtp_port')!) : undefined,
    smtpUser: get('smtp_user'),
    smtpPass: get('smtp_pass'),
    resendApiKey: get('resend_api_key'),
  }
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  const config = await getEmailConfig()

  if (config.provider === 'resend' && config.resendApiKey) {
    // Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.resendApiKey}`,
      },
      body: JSON.stringify({
        from: config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Resend API error: ${res.status} ${body}`)
    }
    return
  }

  // SMTP via Nodemailer
  if (!config.smtpHost) {
    console.warn('E-Mail nicht konfiguriert. Mail an', options.to, 'nicht gesendet.')
    console.log('Subject:', options.subject)
    return
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort || 587,
    secure: config.smtpPort === 465,
    auth: config.smtpUser
      ? { user: config.smtpUser, pass: config.smtpPass }
      : undefined,
  })

  await transporter.sendMail({
    from: config.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })
}
```

- [ ] **Step 5: Tests ausführen — PASS**

Run: `npx vitest run tests/lib/email.test.ts`

Expected: 2 tests passing (templates only — SMTP/Resend not tested in unit tests).

- [ ] **Step 6: E-Mail-Versand in POST-Antrag einbauen**

In `src/app/api/v1/mitgliedsantraege/route.ts` den TODO-Kommentar ersetzen:

Finde die Zeile `// TODO Phase 2 Task 14: E-Mail-Benachrichtigungen hier auslösen` und ersetze sie mit:

```typescript
    // E-Mail-Benachrichtigungen (fire-and-forget, Fehler dürfen den Antrag nicht blockieren)
    const sparteName = (await prisma.sparte.findUnique({ where: { id: d.sparteId }, select: { name: true } }))?.name || ''
    const emailData = { vorname: d.vorname, nachname: d.nachname, email: d.email, sparteName, eintrittsdatum: d.eintrittsdatum }

    Promise.all([
      import('./../../lib/email').then(({ sendMail }) =>
        import('./../../lib/email-templates').then(({ renderAntragBestaetigung }) => {
          const mail = renderAntragBestaetigung(emailData)
          return sendMail({ to: d.email, ...mail })
        })
      ),
      import('./../../lib/email').then(({ sendMail }) =>
        import('./../../lib/email-templates').then(({ renderAntragBenachrichtigung }) => {
          const mail = renderAntragBenachrichtigung(emailData)
          const adminEmail = process.env.ADMIN_EMAIL || 'admin@sg1898chattengau.de'
          return sendMail({ to: adminEmail, ...mail })
        })
      ),
    ]).catch((err) => console.error('E-Mail-Versand fehlgeschlagen:', err))
```

Hinweis: Die Import-Pfade (`./../../lib/email`) müssen an die tatsächliche Verzeichnisstruktur angepasst werden. Da die Route unter `src/app/api/v1/mitgliedsantraege/route.ts` liegt, ist der relative Pfad zu `src/lib/email.ts`: `@/lib/email` (mit dem @-Alias). Also besser:

```typescript
    import { sendMail } from '@/lib/email'
    import { renderAntragBestaetigung, renderAntragBenachrichtigung } from '@/lib/email-templates'

    // Am Anfang der Datei importieren, dann hier verwenden:
    const sparteName = (await prisma.sparte.findUnique({ where: { id: d.sparteId }, select: { name: true } }))?.name || ''
    const emailData = { vorname: d.vorname, nachname: d.nachname, email: d.email, sparteName, eintrittsdatum: d.eintrittsdatum }

    const bestaetigung = renderAntragBestaetigung(emailData)
    const benachrichtigung = renderAntragBenachrichtigung(emailData)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sg1898chattengau.de'

    // Fire-and-forget
    Promise.all([
      sendMail({ to: d.email, ...bestaetigung }),
      sendMail({ to: adminEmail, ...benachrichtigung }),
    ]).catch((err) => console.error('E-Mail-Versand fehlgeschlagen:', err))
```

Die Imports `sendMail`, `renderAntragBestaetigung`, `renderAntragBenachrichtigung` müssen an den Anfang der Datei hinzugefügt werden.

- [ ] **Step 7: Commit**

```bash
git add src/lib/email.ts src/lib/email-templates.ts tests/lib/email.test.ts src/app/api/v1/mitgliedsantraege/route.ts
git commit -m "feat: configurable email service with application notification templates"
```

---

### Task 17: Admin-Layout + Sidebar

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin/sidebar.tsx`

- [ ] **Step 1: Admin-Sidebar erstellen**

```tsx
// src/components/admin/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '◻' },
  { href: '/admin/antraege', label: 'Mitgliedsanträge', icon: '📋' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full tablet:w-64 bg-white border-b tablet:border-b-0 tablet:border-r border-border shrink-0">
      <nav className="flex tablet:flex-col p-2 tablet:p-4 gap-1 overflow-x-auto">
        {navItems.map((item) => {
          const active = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap
                min-h-[44px] transition-colors
                ${active
                  ? 'bg-primary-light text-primary font-medium'
                  : 'text-text-body hover:bg-section-alt hover:text-text-heading'}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Admin-Layout mit Auth-Guard**

```tsx
// src/app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="flex flex-col tablet:flex-row min-h-[calc(100vh-64px)]">
      <AdminSidebar />
      <div className="flex-1 p-4 tablet:p-8 bg-section-alt">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Admin-Dashboard-Startseite**

```tsx
// src/app/admin/page.tsx
import { prisma } from '@/lib/prisma'
import { Container } from '@/components/layout/container'

export default async function AdminDashboardPage() {
  const [antragCount, neueAntraege] = await Promise.all([
    prisma.mitgliedsantrag.count(),
    prisma.mitgliedsantrag.count({ where: { status: 'EINGEGANGEN' } }),
  ])

  return (
    <div>
      <h1 className="font-heading text-h1 text-text-heading mb-6">Admin-Dashboard</h1>
      <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-border">
          <p className="text-sm text-text-body">Mitgliedsanträge gesamt</p>
          <p className="text-3xl font-bold text-text-heading mt-1">{antragCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <p className="text-sm text-text-body">Neue Anträge</p>
          <p className="text-3xl font-bold text-primary mt-1">{neueAntraege}</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/ src/components/admin/sidebar.tsx
git commit -m "feat: admin layout with auth guard, sidebar, dashboard"
```

---

### Task 18: Admin — Antragsliste

**Files:**
- Create: `src/app/admin/antraege/page.tsx`
- Create: `src/components/admin/status-badge.tsx`
- Create: `src/components/admin/antrag-list.tsx`

- [ ] **Step 1: Status-Badge erstellen**

```tsx
// src/components/admin/status-badge.tsx
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  EINGEGANGEN: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Eingegangen' },
  IN_BEARBEITUNG: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Bearbeitung' },
  ABGESCHLOSSEN: { bg: 'bg-green-100', text: 'text-green-800', label: 'Abgeschlossen' },
  EXPORTIERT: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Exportiert' },
  ABGELEHNT: { bg: 'bg-red-100', text: 'text-red-800', label: 'Abgelehnt' },
}

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}
```

- [ ] **Step 2: Antragsliste-Komponente erstellen**

```tsx
// src/components/admin/antrag-list.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { StatusBadge } from './status-badge'
import { Button } from '@/components/ui/button'

interface Antrag {
  id: string
  status: string
  vorname: string
  nachname: string
  email: string
  geburtsdatum: string
  ibanLast4: string
  sparte: { name: string; typ: string }
  createdAt: string
}

interface PaginationMeta {
  seite: number
  limit: number
  gesamt: number
}

export function AntragList() {
  const [antraege, setAntraege] = useState<Antrag[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({ seite: 1, limit: 20, gesamt: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchAntraege = useCallback(async (seite = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ seite: String(seite), limit: '20' })
    if (statusFilter) params.set('status', statusFilter)

    const res = await fetch(`/api/v1/mitgliedsantraege?${params}`)
    const body = await res.json()
    setAntraege(body.data || [])
    setMeta(body.meta || { seite: 1, limit: 20, gesamt: 0 })
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchAntraege() }, [fetchAntraege])

  const totalPages = Math.ceil(meta.gesamt / meta.limit)

  return (
    <div>
      {/* Filter + Export */}
      <div className="flex flex-col tablet:flex-row gap-4 mb-4 items-start tablet:items-center justify-between">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm bg-white"
        >
          <option value="">Alle Status</option>
          <option value="EINGEGANGEN">Eingegangen</option>
          <option value="IN_BEARBEITUNG">In Bearbeitung</option>
          <option value="ABGESCHLOSSEN">Abgeschlossen</option>
          <option value="EXPORTIERT">Exportiert</option>
          <option value="ABGELEHNT">Abgelehnt</option>
        </select>

        <a href="/api/v1/mitgliedsantraege/export/csv?nur_neue=true" download>
          <Button variant="secondary" className="text-sm">CSV-Export (neue)</Button>
        </a>
      </div>

      {/* Tabelle */}
      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-section-alt">
              <th className="text-left p-3 font-medium text-text-heading">Name</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Sparte</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">IBAN</th>
              <th className="text-left p-3 font-medium text-text-heading">Status</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Datum</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-text-body">Laden...</td></tr>
            ) : antraege.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-text-body">Keine Anträge gefunden.</td></tr>
            ) : (
              antraege.map((a) => (
                <tr key={a.id} className="border-b border-border-light hover:bg-section-alt">
                  <td className="p-3">
                    <div className="font-medium text-text-heading">{a.vorname} {a.nachname}</div>
                    <div className="text-xs text-text-body tablet:hidden">{a.sparte.name}</div>
                  </td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">{a.sparte.name}</td>
                  <td className="p-3 hidden tablet:table-cell text-text-body font-mono">****{a.ibanLast4}</td>
                  <td className="p-3"><StatusBadge status={a.status} /></td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">
                    {new Date(a.createdAt).toLocaleDateString('de-DE')}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/antraege/${a.id}`}
                      className="text-primary hover:text-primary-hover text-sm"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            className="text-sm"
            disabled={meta.seite <= 1}
            onClick={() => fetchAntraege(meta.seite - 1)}
          >
            Zurück
          </Button>
          <span className="flex items-center text-sm text-text-body">
            Seite {meta.seite} von {totalPages}
          </span>
          <Button
            variant="outline"
            className="text-sm"
            disabled={meta.seite >= totalPages}
            onClick={() => fetchAntraege(meta.seite + 1)}
          >
            Weiter
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Antraege-Seite erstellen**

```tsx
// src/app/admin/antraege/page.tsx
import { AntragList } from '@/components/admin/antrag-list'

export default function AntraegePage() {
  return (
    <div>
      <h1 className="font-heading text-h1 text-text-heading mb-6">Mitgliedsanträge</h1>
      <AntragList />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/antraege/page.tsx src/components/admin/status-badge.tsx src/components/admin/antrag-list.tsx
git commit -m "feat: admin application list with status filter, pagination, CSV export"
```

---

### Task 19: Admin — Antrags-Detailansicht + Status-Workflow

**Files:**
- Create: `src/app/admin/antraege/[id]/page.tsx`
- Create: `src/components/admin/antrag-detail.tsx`

- [ ] **Step 1: Detail-Komponente erstellen**

```tsx
// src/components/admin/antrag-detail.tsx
'use client'

import { useState } from 'react'
import { StatusBadge } from './status-badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface AntragDetail {
  id: string
  status: string
  vorname: string
  nachname: string
  geburtsdatum: string
  geschlecht: string
  strasse: string
  plz: string
  ort: string
  telefon: string | null
  email: string
  erziehungsberechtigter: string | null
  sparte: { name: string; typ: string }
  eintrittsdatum: string
  iban: string
  ibanLast4: string
  kontoinhaber: string
  kreditinstitut: string
  signaturMitglied: string | null
  signaturSepa: string | null
  signaturErzBerech: string | null
  satzungAkzeptiert: boolean
  datenschutzAkzeptiert: boolean
  sepaAkzeptiert: boolean
  ipAdresse: string | null
  userAgent: string | null
  createdAt: string
  bearbeitetAm: string | null
}

interface AntragDetailProps {
  antrag: AntragDetail
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  EINGEGANGEN: ['IN_BEARBEITUNG', 'ABGELEHNT'],
  IN_BEARBEITUNG: ['ABGESCHLOSSEN', 'ABGELEHNT'],
  ABGESCHLOSSEN: ['EXPORTIERT'],
  EXPORTIERT: [],
  ABGELEHNT: ['EINGEGANGEN'],
}

const STATUS_LABELS: Record<string, string> = {
  EINGEGANGEN: 'Eingegangen',
  IN_BEARBEITUNG: 'In Bearbeitung',
  ABGESCHLOSSEN: 'Abgeschlossen',
  EXPORTIERT: 'Exportiert',
  ABGELEHNT: 'Abgelehnt',
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex flex-col tablet:flex-row gap-1 tablet:gap-4 py-2 border-b border-border-light">
      <dt className="text-sm text-text-body tablet:w-48 shrink-0">{label}</dt>
      <dd className="text-text-heading break-all">{value}</dd>
    </div>
  )
}

export function AntragDetailView({ antrag: initial }: AntragDetailProps) {
  const [antrag, setAntrag] = useState(initial)
  const [updating, setUpdating] = useState(false)

  async function updateStatus(newStatus: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/v1/mitgliedsantraege/${antrag.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setAntrag({ ...antrag, status: newStatus, bearbeitetAm: new Date().toISOString() })
      }
    } finally {
      setUpdating(false)
    }
  }

  const transitions = STATUS_TRANSITIONS[antrag.status] || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-h1 text-text-heading">
            {antrag.vorname} {antrag.nachname}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={antrag.status} />
            <span className="text-sm text-text-body">
              Eingegangen am {new Date(antrag.createdAt).toLocaleDateString('de-DE')}
            </span>
          </div>
        </div>

        {transitions.length > 0 && (
          <div className="flex gap-2">
            {transitions.map((s) => (
              <Button
                key={s}
                variant={s === 'ABGELEHNT' ? 'outline' : 'primary'}
                className="text-sm"
                onClick={() => updateStatus(s)}
                disabled={updating}
              >
                → {STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Persönliche Daten */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h2 className="font-heading text-h3 text-text-heading mb-4">Persönliche Daten</h2>
        <dl>
          <Row label="Vorname" value={antrag.vorname} />
          <Row label="Nachname" value={antrag.nachname} />
          <Row label="Geburtsdatum" value={new Date(antrag.geburtsdatum).toLocaleDateString('de-DE')} />
          <Row label="Geschlecht" value={antrag.geschlecht} />
          <Row label="Adresse" value={`${antrag.strasse}, ${antrag.plz} ${antrag.ort}`} />
          <Row label="Telefon" value={antrag.telefon} />
          <Row label="E-Mail" value={antrag.email} />
          <Row label="Erziehungsberechtigter" value={antrag.erziehungsberechtigter} />
        </dl>
      </div>

      {/* Sparte */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h2 className="font-heading text-h3 text-text-heading mb-4">Sparte</h2>
        <dl>
          <Row label="Sparte" value={antrag.sparte.name} />
          <Row label="Eintrittsdatum" value={new Date(antrag.eintrittsdatum).toLocaleDateString('de-DE')} />
        </dl>
      </div>

      {/* Bankdaten (entschlüsselt) */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h2 className="font-heading text-h3 text-text-heading mb-4">Bankverbindung (entschlüsselt)</h2>
        <dl>
          <Row label="IBAN" value={antrag.iban} />
          <Row label="Kontoinhaber" value={antrag.kontoinhaber} />
          <Row label="Kreditinstitut" value={antrag.kreditinstitut} />
        </dl>
      </div>

      {/* Signaturen */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h2 className="font-heading text-h3 text-text-heading mb-4">Unterschriften</h2>
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
          {antrag.signaturMitglied && (
            <div>
              <p className="text-sm text-text-body mb-1">Mitgliedsantrag</p>
              <Image src={antrag.signaturMitglied} alt="Unterschrift Mitglied" width={300} height={120} className="border border-border rounded w-auto h-auto" />
            </div>
          )}
          {antrag.signaturSepa && (
            <div>
              <p className="text-sm text-text-body mb-1">SEPA-Mandat</p>
              <Image src={antrag.signaturSepa} alt="Unterschrift SEPA" width={300} height={120} className="border border-border rounded w-auto h-auto" />
            </div>
          )}
          {antrag.signaturErzBerech && (
            <div>
              <p className="text-sm text-text-body mb-1">Erziehungsberechtigte/r</p>
              <Image src={antrag.signaturErzBerech} alt="Unterschrift Erz.Berech." width={300} height={120} className="border border-border rounded w-auto h-auto" />
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h2 className="font-heading text-h3 text-text-heading mb-4">Meta-Daten</h2>
        <dl>
          <Row label="IP-Adresse" value={antrag.ipAdresse} />
          <Row label="User-Agent" value={antrag.userAgent} />
          <Row label="Bearbeitet am" value={antrag.bearbeitetAm ? new Date(antrag.bearbeitetAm).toLocaleDateString('de-DE') : null} />
        </dl>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Detail-Seite erstellen**

```tsx
// src/app/admin/antraege/[id]/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { AntragDetailView } from '@/components/admin/antrag-detail'

export default async function AntragDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login')

  const { id } = await params

  const antrag = await prisma.mitgliedsantrag.findUnique({
    where: { id },
    include: { sparte: { select: { name: true, typ: true } } },
  })

  if (!antrag) redirect('/admin/antraege')

  // Decrypt sensitive fields server-side
  const decrypted = {
    ...antrag,
    geburtsdatum: antrag.geburtsdatum.toISOString(),
    eintrittsdatum: antrag.eintrittsdatum.toISOString(),
    createdAt: antrag.createdAt.toISOString(),
    bearbeitetAm: antrag.bearbeitetAm?.toISOString() || null,
    iban: decrypt(antrag.ibanEncrypted),
    kontoinhaber: decrypt(antrag.kontoinhaberEncrypted),
    signaturMitglied: antrag.signaturMitgliedEncrypted ? decrypt(antrag.signaturMitgliedEncrypted) : null,
    signaturSepa: antrag.signaturSepaEncrypted ? decrypt(antrag.signaturSepaEncrypted) : null,
    signaturErzBerech: antrag.signaturErzBerechEncrypted ? decrypt(antrag.signaturErzBerechEncrypted) : null,
    // Remove encrypted fields from client payload
    ibanEncrypted: undefined,
    kontoinhaberEncrypted: undefined,
    signaturMitgliedEncrypted: undefined,
    signaturSepaEncrypted: undefined,
    signaturErzBerechEncrypted: undefined,
  }

  return (
    <div>
      <Link
        href="/admin/antraege"
        className="text-sm text-primary hover:text-primary-hover mb-4 inline-block"
      >
        ← Zurück zur Liste
      </Link>
      <AntragDetailView antrag={decrypted as never} />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/antraege/\[id\]/ src/components/admin/antrag-detail.tsx
git commit -m "feat: admin application detail view with decrypted IBAN and status workflow"
```

---

### Task 20: Smoke-Test Phase 2

- [ ] **Step 1: Alle Unit-Tests ausführen**

Run:
```bash
npx vitest run
```

Expected: Alle Tests grün (bisherige 20 + IBAN 5 + E-Mail 2 = ~27 Tests).

- [ ] **Step 2: Dev-Server starten und manuell testen**

Run: `npm run dev`

Teste:
1. `http://localhost:3000/mitmachen` — Multi-Step-Formular öffnet sich
2. Fülle alle Steps durch (Persönliche Daten → Sparte → SEPA → Einwilligungen → Signatur → Zusammenfassung)
3. Sende einen Antrag ab
4. `http://localhost:3000/admin` — Login mit `admin@sg1898chattengau.de` / `admin1234`
5. Admin-Dashboard zeigt Antragszähler
6. Admin → Mitgliedsanträge → Der gerade eingereichte Antrag erscheint
7. Detail-Ansicht: IBAN vollständig sichtbar, Signaturen angezeigt
8. Status-Workflow: Eingegangen → In Bearbeitung → Abgeschlossen
9. CSV-Export: `http://localhost:3000/api/v1/mitgliedsantraege/export/csv`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: Phase 2 complete — digital membership application"
```

---

## Summary

| Task | Was | Tests |
|---|---|---|
| 1 | Dependencies (ibantools, react-signature-canvas, nodemailer) | — |
| 2 | IBAN-Validierung + BIC-Lookup | 5 Tests |
| 3 | Zod-Schemas für Mitgliedsantrag | — |
| 4 | Input UI-Komponente | — |
| 5 | Step-Indicator | — |
| 6 | Step 1: Persönliche Daten | — |
| 7 | Step 2: Spartenwahl | — |
| 8 | Step 3: SEPA-Bankdaten | — |
| 9 | Step 4: Einwilligungen | — |
| 10 | Step 5: Canvas-Signaturen | — |
| 11 | Step 6: Zusammenfassung | — |
| 12 | Multi-Step-Orchestrator + Mitmachen-Seite | — |
| 13 | API: POST Antrag (public) + GET Sparten | — |
| 14 | API: GET Detail + PATCH Status (admin) | — |
| 15 | API: CSV-Export Vereinsmeister | — |
| 16 | E-Mail-Service + Templates | 2 Tests |
| 17 | Admin-Layout + Sidebar + Dashboard | — |
| 18 | Admin: Antragsliste | — |
| 19 | Admin: Detailansicht + Status-Workflow | — |
| 20 | Smoke-Test | ~27 Tests total |

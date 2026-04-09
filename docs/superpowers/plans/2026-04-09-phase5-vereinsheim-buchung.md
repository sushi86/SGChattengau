# Phase 5: Vereinsheim-Buchung — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Öffentlicher Belegungskalender für das Vereinsheim, Buchungsanfrage-Formular, Admin-Genehmigungs-Workflow mit E-Mail-Benachrichtigungen und Zahlungsinfos.

**Architecture:** Öffentliche Seite zeigt belegte Zeiträume ohne persönliche Daten. Anfrage-Formular erstellt Buchung mit Status ANGEFRAGT. Admin genehmigt/lehnt ab, was automatisch E-Mails mit Zahlungsinfos (50€/Tag, Bankverbindung) auslöst. Buchungs-API nutzt bestehendes Prisma-Model `Buchung`.

**Tech Stack:** Next.js App Router, Prisma 7, Zod, bestehender E-Mail-Service

---

## Prisma 7 Import Convention

```typescript
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiPaginated, apiError } from '@/lib/api-response'
import { ValidationError, NotFoundError, UnauthorizedError } from '@/lib/api-error'
import { requireRole } from '@/lib/auth-middleware'
import { sendMail } from '@/lib/email'
```

---

## File Structure

```
src/
├── app/
│   ├── belegung-vereinsheim/
│   │   └── page.tsx                          # Öffentliche Seite (REPLACE)
│   ├── admin/
│   │   └── buchungen/
│   │       ├── page.tsx                      # Buchungsliste
│   │       └── [id]/
│   │           └── page.tsx                  # Buchungs-Detail
│   └── api/v1/
│       └── buchungen/
│           ├── route.ts                      # POST (public), GET (admin)
│           ├── kalender/
│           │   └── route.ts                  # GET belegte Zeiträume (public)
│           └── [id]/
│               ├── route.ts                  # GET Detail (admin)
│               └── status/
│                   └── route.ts              # PATCH genehmigen/ablehnen (admin)
├── components/
│   ├── buchung/
│   │   ├── belegungskalender.tsx             # Monatsansicht belegter Tage
│   │   └── buchung-formular.tsx              # Anfrage-Formular
│   ├── admin/
│   │   ├── sidebar.tsx                       # Erweitert (MODIFY)
│   │   ├── buchung-list.tsx                  # Admin Buchungsliste
│   │   └── buchung-detail.tsx                # Admin Detail + Genehmigung
│   └── ui/
│       └── textarea.tsx                      # Wiederverwendbare Textarea
├── lib/
│   ├── email-templates.ts                    # Erweitert (MODIFY)
│   └── validations/
│       └── buchung.ts                        # Zod-Schemas
└── tests/
    └── lib/
        └── email.test.ts                     # Erweitert (MODIFY)
```

---

### Task 1: Zod-Schemas + Textarea-Komponente

**Files:**
- Create: `src/lib/validations/buchung.ts`
- Create: `src/components/ui/textarea.tsx`

- [ ] **Step 1: Buchungs-Schemas erstellen**

```typescript
// src/lib/validations/buchung.ts
import { z } from 'zod'

export const buchungAnfrageSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  telefon: z.string().optional(),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  startzeit: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  endzeit: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  anlass: z.string().min(3, 'Anlass muss mindestens 3 Zeichen lang sein'),
  nachricht: z.string().optional(),
  website: z.string().max(0, 'Bot detected').optional(), // Honeypot
})

export const buchungStatusSchema = z.object({
  status: z.enum(['ANGEFRAGT', 'GENEHMIGT', 'ABGELEHNT', 'STORNIERT']),
  ablehnungsgrund: z.string().optional(),
})

export type BuchungAnfrageInput = z.infer<typeof buchungAnfrageSchema>
```

- [ ] **Step 2: Textarea-Komponente erstellen**

```tsx
// src/components/ui/textarea.tsx
import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, id, className = '', ...props }, ref) {
    const textareaId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1">
        <label htmlFor={textareaId} className="block text-sm font-medium text-text-heading">
          {label}
          {props.required && <span className="text-error ml-0.5">*</span>}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full rounded-md border px-4 py-3 text-text-heading
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            ${error ? 'border-error' : 'border-border'}
            ${className}`}
          aria-invalid={!!error}
          rows={4}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-text-body">{hint}</p>
        )}
        {error && (
          <p className="text-sm text-error">{error}</p>
        )}
      </div>
    )
  }
)
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/validations/buchung.ts src/components/ui/textarea.tsx
git commit -m "feat: Zod schemas for Buchung and Textarea component"
```

---

### Task 2: E-Mail-Templates für Buchung

**Files:**
- Modify: `src/lib/email-templates.ts`
- Modify: `tests/lib/email.test.ts`

- [ ] **Step 1: Tests erweitern**

In `tests/lib/email.test.ts` ergänzen:

```typescript
import { renderBuchungBestaetigung, renderBuchungGenehmigt, renderBuchungAbgelehnt } from '@/lib/email-templates'

describe('buchung email templates', () => {
  const buchungData = {
    name: 'Max Mustermann',
    email: 'max@example.de',
    datum: '15.06.2026',
    startzeit: '14:00',
    endzeit: '22:00',
    anlass: 'Geburtstagsfeier',
  }

  it('renders booking confirmation for applicant', () => {
    const result = renderBuchungBestaetigung(buchungData)
    expect(result.subject).toContain('Buchungsanfrage')
    expect(result.html).toContain('Max Mustermann')
    expect(result.html).toContain('Geburtstagsfeier')
  })

  it('renders approval email with payment info', () => {
    const result = renderBuchungGenehmigt(buchungData)
    expect(result.subject).toContain('genehmigt')
    expect(result.html).toContain('50')
    expect(result.html).toContain('Max Mustermann')
  })

  it('renders rejection email', () => {
    const result = renderBuchungAbgelehnt({ ...buchungData, grund: 'Vereinsheim bereits belegt' })
    expect(result.subject).toContain('abgelehnt')
    expect(result.html).toContain('bereits belegt')
  })
})
```

- [ ] **Step 2: Tests ausführen — FAIL**

Run: `npx vitest run tests/lib/email.test.ts`

- [ ] **Step 3: E-Mail-Templates implementieren**

In `src/lib/email-templates.ts` am Ende der Datei ergänzen:

```typescript
// === Buchung Templates ===

interface BuchungEmailData {
  name: string
  email: string
  datum: string
  startzeit: string
  endzeit: string
  anlass: string
}

export function renderBuchungBestaetigung(data: BuchungEmailData): EmailContent {
  return {
    subject: 'Buchungsanfrage eingegangen — Vereinsheim SG 1898 Chattengau',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Buchungsanfrage eingegangen</h2>
        <p>Hallo ${data.name},</p>
        <p>vielen Dank für deine Buchungsanfrage für das Vereinsheim der SG 1898 Chattengau e.V.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Datum</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.datum}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Uhrzeit</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.startzeit} – ${data.endzeit} Uhr</td></tr>
          <tr><td style="padding: 8px; color: #666;">Anlass</td><td style="padding: 8px;">${data.anlass}</td></tr>
        </table>
        <p>Deine Anfrage wird nun geprüft. Du erhältst eine Benachrichtigung, sobald sie genehmigt oder abgelehnt wurde.</p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">SG 1898 Chattengau e.V. — Wir bewegen Niedenstein!</p>
      </div>
    `,
    text: `Buchungsanfrage eingegangen\n\nHallo ${data.name},\n\nvielen Dank für deine Buchungsanfrage.\n\nDatum: ${data.datum}\nUhrzeit: ${data.startzeit} – ${data.endzeit} Uhr\nAnlass: ${data.anlass}\n\nDeine Anfrage wird nun geprüft.\n\nSG 1898 Chattengau e.V.`,
  }
}

export function renderBuchungGenehmigt(data: BuchungEmailData): EmailContent {
  return {
    subject: 'Buchung genehmigt — Vereinsheim SG 1898 Chattengau',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Buchung genehmigt!</h2>
        <p>Hallo ${data.name},</p>
        <p>deine Buchungsanfrage für das Vereinsheim wurde genehmigt.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Datum</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.datum}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Uhrzeit</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.startzeit} – ${data.endzeit} Uhr</td></tr>
          <tr><td style="padding: 8px; color: #666;">Anlass</td><td style="padding: 8px;">${data.anlass}</td></tr>
        </table>
        <h3 style="color: #333;">Zahlungsinformationen</h3>
        <p>Die Nutzungsgebühr beträgt <strong>50,00 € pro Tag</strong>. Bitte überweise den Betrag bis spätestens 7 Tage vor dem Termin auf folgendes Konto:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f7f7f7; border-radius: 8px;">
          <tr><td style="padding: 8px; color: #666;">Empfänger</td><td style="padding: 8px;">SG 1898 Chattengau e.V.</td></tr>
          <tr><td style="padding: 8px; color: #666;">Verwendungszweck</td><td style="padding: 8px;">Vereinsheim ${data.datum} ${data.name}</td></tr>
        </table>
        <p style="color: #666; font-size: 14px;">Die genauen Kontodaten erhältst du vom Vorstand.</p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">SG 1898 Chattengau e.V. — Wir bewegen Niedenstein!</p>
      </div>
    `,
    text: `Buchung genehmigt!\n\nHallo ${data.name},\n\ndeine Buchung wurde genehmigt.\n\nDatum: ${data.datum}\nUhrzeit: ${data.startzeit} – ${data.endzeit} Uhr\nAnlass: ${data.anlass}\n\nNutzungsgebühr: 50,00 € pro Tag\nBitte überweise bis 7 Tage vor dem Termin.\nVerwendungszweck: Vereinsheim ${data.datum} ${data.name}\n\nSG 1898 Chattengau e.V.`,
  }
}

export function renderBuchungAbgelehnt(data: BuchungEmailData & { grund?: string }): EmailContent {
  return {
    subject: 'Buchungsanfrage abgelehnt — Vereinsheim SG 1898 Chattengau',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Buchungsanfrage abgelehnt</h2>
        <p>Hallo ${data.name},</p>
        <p>leider müssen wir deine Buchungsanfrage für das Vereinsheim ablehnen.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Datum</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.datum}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Anlass</td><td style="padding: 8px;">${data.anlass}</td></tr>
        </table>
        ${data.grund ? `<p><strong>Grund:</strong> ${data.grund}</p>` : ''}
        <p>Bei Fragen wende dich bitte an den Vorstand.</p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">SG 1898 Chattengau e.V. — Wir bewegen Niedenstein!</p>
      </div>
    `,
    text: `Buchungsanfrage abgelehnt\n\nHallo ${data.name},\n\nleider müssen wir deine Buchungsanfrage ablehnen.\n\nDatum: ${data.datum}\nAnlass: ${data.anlass}\n${data.grund ? `Grund: ${data.grund}\n` : ''}\nBei Fragen wende dich an den Vorstand.\n\nSG 1898 Chattengau e.V.`,
  }
}
```

Note: `EmailContent` interface is already defined at the top of the file from Phase 2.

- [ ] **Step 4: Tests ausführen — PASS**

Run: `npx vitest run tests/lib/email.test.ts`

Expected: Alle bisherigen + 3 neue Tests grün.

- [ ] **Step 5: Commit**

```bash
git add src/lib/email-templates.ts tests/lib/email.test.ts
git commit -m "feat: email templates for Vereinsheim booking workflow"
```

---

### Task 3: Buchungs-API

**Files:**
- Create: `src/app/api/v1/buchungen/route.ts`
- Create: `src/app/api/v1/buchungen/kalender/route.ts`
- Create: `src/app/api/v1/buchungen/[id]/route.ts`
- Create: `src/app/api/v1/buchungen/[id]/status/route.ts`

- [ ] **Step 1: POST (public) + GET (admin)**

```typescript
// src/app/api/v1/buchungen/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiPaginated, apiError } from '@/lib/api-response'
import { ValidationError } from '@/lib/api-error'
import { requireRole } from '@/lib/auth-middleware'
import { buchungAnfrageSchema } from '@/lib/validations/buchung'
import { sendMail } from '@/lib/email'
import { renderBuchungBestaetigung } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = buchungAnfrageSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const d = parsed.data

    // Honeypot
    if (d.website && d.website.length > 0) {
      return apiSuccess({ id: 'ok' }, 201)
    }

    const buchung = await prisma.buchung.create({
      data: {
        name: d.name,
        email: d.email,
        telefon: d.telefon || null,
        datum: new Date(d.datum),
        startzeit: d.startzeit,
        endzeit: d.endzeit,
        anlass: d.anlass,
        nachricht: d.nachricht || null,
      },
    })

    // Bestätigung an Anfragenden
    const formatDatum = new Date(d.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const emailData = { name: d.name, email: d.email, datum: formatDatum, startzeit: d.startzeit, endzeit: d.endzeit, anlass: d.anlass }
    const mail = renderBuchungBestaetigung(emailData)
    sendMail({ to: d.email, ...mail }).catch((err) => console.error('E-Mail-Fehler:', err))

    return apiSuccess({ id: buchung.id }, 201)
  } catch (err) {
    return apiError(err)
  }
}

export async function GET(req: NextRequest) {
  try {
    const checkAdmin = requireRole('ADMIN')
    await checkAdmin(req)

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const seite = parseInt(url.searchParams.get('seite') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [buchungen, gesamt] = await Promise.all([
      prisma.buchung.findMany({
        where,
        orderBy: { datum: 'desc' },
        skip: (seite - 1) * limit,
        take: limit,
      }),
      prisma.buchung.count({ where }),
    ])

    return apiPaginated(buchungen, { seite, limit, gesamt })
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 2: GET belegte Zeiträume (public, ohne persönliche Daten)**

```typescript
// src/app/api/v1/buchungen/kalender/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const von = url.searchParams.get('von')
    const bis = url.searchParams.get('bis')

    const where: Record<string, unknown> = {
      status: { in: ['ANGEFRAGT', 'GENEHMIGT'] },
    }

    if (von || bis) {
      where.datum = {}
      if (von) (where.datum as Record<string, unknown>).gte = new Date(von)
      if (bis) (where.datum as Record<string, unknown>).lte = new Date(bis)
    }

    const buchungen = await prisma.buchung.findMany({
      where,
      select: {
        datum: true,
        startzeit: true,
        endzeit: true,
        status: true,
        // Keine persönlichen Daten!
      },
      orderBy: { datum: 'asc' },
    })

    return apiSuccess(buchungen)
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 3: GET Detail (admin)**

```typescript
// src/app/api/v1/buchungen/[id]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    const buchung = await prisma.buchung.findUnique({ where: { id } })
    if (!buchung) throw new NotFoundError('Buchung')

    return apiSuccess(buchung)
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 4: PATCH Status (admin) mit E-Mail**

```typescript
// src/app/api/v1/buchungen/[id]/status/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, ValidationError } from '@/lib/api-error'
import { requireRole } from '@/lib/auth-middleware'
import { buchungStatusSchema } from '@/lib/validations/buchung'
import { sendMail } from '@/lib/email'
import { renderBuchungGenehmigt, renderBuchungAbgelehnt } from '@/lib/email-templates'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const checkAdmin = requireRole('ADMIN')
    const user = await checkAdmin(req)

    const { id } = await params
    const buchung = await prisma.buchung.findUnique({ where: { id } })
    if (!buchung) throw new NotFoundError('Buchung')

    const body = await req.json()
    const parsed = buchungStatusSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültiger Status',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const updated = await prisma.buchung.update({
      where: { id },
      data: {
        status: parsed.data.status,
        bearbeitetAm: new Date(),
        bearbeitetVon: user.id,
      },
    })

    // E-Mail senden
    const formatDatum = buchung.datum.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const emailData = {
      name: buchung.name,
      email: buchung.email,
      datum: formatDatum,
      startzeit: buchung.startzeit,
      endzeit: buchung.endzeit,
      anlass: buchung.anlass,
    }

    if (parsed.data.status === 'GENEHMIGT') {
      const mail = renderBuchungGenehmigt(emailData)
      sendMail({ to: buchung.email, ...mail }).catch((err) => console.error('E-Mail-Fehler:', err))
    } else if (parsed.data.status === 'ABGELEHNT') {
      const mail = renderBuchungAbgelehnt({ ...emailData, grund: parsed.data.ablehnungsgrund })
      sendMail({ to: buchung.email, ...mail }).catch((err) => console.error('E-Mail-Fehler:', err))
    }

    return apiSuccess({ id: updated.id, status: updated.status })
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/v1/buchungen/
git commit -m "feat: Buchung API with public calendar, admin CRUD, email notifications"
```

---

### Task 4: Öffentliche Vereinsheim-Seite

**Files:**
- Create: `src/components/buchung/belegungskalender.tsx`
- Create: `src/components/buchung/buchung-formular.tsx`
- Modify: `src/app/belegung-vereinsheim/page.tsx`

- [ ] **Step 1: Belegungskalender (Monatsansicht belegter Tage)**

```tsx
// src/components/buchung/belegungskalender.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'

interface BelegterTag {
  datum: string
  startzeit: string
  endzeit: string
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
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  // Map belegte Tage
  const belegtByDay = new Map<number, BelegterTag[]>()
  for (const b of belegteTage) {
    const d = new Date(b.datum)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!belegtByDay.has(day)) belegtByDay.set(day, [])
      belegtByDay.get(day)!.push(b)
    }
  }

  const today = new Date()
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  const isPast = (day: number) => new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }} className="mb-1">
        {WOCHENTAGE.map((tag) => (
          <div key={tag} className="text-center text-xs font-medium text-text-body py-1">{tag}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }} className="bg-border rounded-md overflow-hidden">
        {cells.map((day, i) => {
          const belegungen = day ? (belegtByDay.get(day) || []) : []
          const genehmigt = belegungen.some((b) => b.status === 'GENEHMIGT')
          const angefragt = belegungen.some((b) => b.status === 'ANGEFRAGT')
          const past = day ? isPast(day) : false

          return (
            <div
              key={i}
              className={`bg-white min-h-[60px] p-1.5
                ${day === null ? 'bg-section-alt' : ''}
                ${past ? 'opacity-40' : ''}`}
            >
              {day !== null && (
                <>
                  <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full
                    ${isToday(day) ? 'bg-primary text-white' : 'text-text-heading'}`}>
                    {day}
                  </span>
                  {genehmigt && (
                    <div className="text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded mt-0.5 text-center">Belegt</div>
                  )}
                  {angefragt && !genehmigt && (
                    <div className="text-[10px] bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded mt-0.5 text-center">Angefragt</div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-4 mt-3 text-xs text-text-body">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Belegt</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200" /> Angefragt</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border border-border" /> Frei</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Buchungsformular**

```tsx
// src/components/buchung/buchung-formular.tsx
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
        <div className="text-4xl mb-3">✓</div>
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
```

- [ ] **Step 3: Vereinsheim-Seite ersetzen**

```tsx
// src/app/belegung-vereinsheim/page.tsx
import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'
import { Belegungskalender } from '@/components/buchung/belegungskalender'
import { BuchungFormular } from '@/components/buchung/buchung-formular'

export const metadata: Metadata = {
  title: 'Vereinsheim-Belegung',
  description: 'Belegungskalender und Buchungsanfrage für das Vereinsheim der SG 1898 Chattengau e.V.',
}

export default function VereinsheimPage() {
  return (
    <section className="py-8 tablet:py-12">
      <Container>
        <h1 className="font-heading text-h1 text-text-heading mb-6">Vereinsheim</h1>
        <p className="text-text-body mb-8">
          Unser Vereinsheim kann für private Feiern und Veranstaltungen gemietet werden.
          Im Kalender siehst du, welche Tage bereits belegt sind.
        </p>

        <div className="grid grid-cols-1 desktop:grid-cols-2 gap-8">
          {/* Belegungskalender */}
          <div>
            <h2 className="font-heading text-h2 text-text-heading mb-4">Belegungskalender</h2>
            <Belegungskalender />
          </div>

          {/* Buchungsformular */}
          <div>
            <h2 className="font-heading text-h2 text-text-heading mb-4">Buchungsanfrage</h2>
            <BuchungFormular />
          </div>
        </div>
      </Container>
    </section>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/buchung/ src/app/belegung-vereinsheim/page.tsx
git commit -m "feat: public Vereinsheim page with calendar and booking form"
```

---

### Task 5: Admin — Buchungsverwaltung

**Files:**
- Modify: `src/components/admin/sidebar.tsx`
- Create: `src/components/admin/buchung-list.tsx`
- Create: `src/components/admin/buchung-detail.tsx`
- Create: `src/app/admin/buchungen/page.tsx`
- Create: `src/app/admin/buchungen/[id]/page.tsx`

- [ ] **Step 1: Sidebar erweitern**

In `src/components/admin/sidebar.tsx`, füge in `ADMIN_ITEMS` nach dem Termine-Eintrag ein:

```typescript
{ href: '/admin/buchungen', label: 'Vereinsheim' },
```

- [ ] **Step 2: Buchungsliste**

```tsx
// src/components/admin/buchung-list.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Buchung {
  id: string
  status: string
  name: string
  email: string
  datum: string
  startzeit: string
  endzeit: string
  anlass: string
  createdAt: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ANGEFRAGT: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Angefragt' },
  GENEHMIGT: { bg: 'bg-green-100', text: 'text-green-800', label: 'Genehmigt' },
  ABGELEHNT: { bg: 'bg-red-100', text: 'text-red-800', label: 'Abgelehnt' },
  STORNIERT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Storniert' },
}

export function BuchungList() {
  const [buchungen, setBuchungen] = useState<Buchung[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/v1/buchungen?${params}`)
    if (res.ok) {
      const body = await res.json()
      setBuchungen(body.data || [])
    }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetch_() }, [fetch_])

  return (
    <div>
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm bg-white"
        >
          <option value="">Alle Status</option>
          <option value="ANGEFRAGT">Angefragt</option>
          <option value="GENEHMIGT">Genehmigt</option>
          <option value="ABGELEHNT">Abgelehnt</option>
          <option value="STORNIERT">Storniert</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-section-alt">
              <th className="text-left p-3 font-medium text-text-heading">Name</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Datum</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Anlass</th>
              <th className="text-left p-3 font-medium text-text-heading">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-body">Laden...</td></tr>
            ) : buchungen.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-body">Keine Buchungen gefunden.</td></tr>
            ) : (
              buchungen.map((b) => {
                const style = STATUS_STYLES[b.status] || STATUS_STYLES.ANGEFRAGT
                return (
                  <tr key={b.id} className="border-b border-border-light hover:bg-section-alt">
                    <td className="p-3">
                      <div className="font-medium text-text-heading">{b.name}</div>
                      <div className="text-xs text-text-body tablet:hidden">
                        {new Date(b.datum).toLocaleDateString('de-DE')} · {b.anlass}
                      </div>
                    </td>
                    <td className="p-3 hidden tablet:table-cell text-text-body">
                      {new Date(b.datum).toLocaleDateString('de-DE')} {b.startzeit}–{b.endzeit}
                    </td>
                    <td className="p-3 hidden tablet:table-cell text-text-body">{b.anlass}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{style.label}</span>
                    </td>
                    <td className="p-3">
                      <Link href={`/admin/buchungen/${b.id}`} className="text-primary hover:text-primary-hover text-sm">Details</Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Buchungs-Detail mit Genehmigungs-Workflow**

```tsx
// src/components/admin/buchung-detail.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface BuchungData {
  id: string
  status: string
  name: string
  email: string
  telefon: string | null
  datum: string
  startzeit: string
  endzeit: string
  anlass: string
  nachricht: string | null
  createdAt: string
  bearbeitetAm: string | null
}

const STATUS_LABELS: Record<string, string> = {
  ANGEFRAGT: 'Angefragt',
  GENEHMIGT: 'Genehmigt',
  ABGELEHNT: 'Abgelehnt',
  STORNIERT: 'Storniert',
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex flex-col tablet:flex-row gap-1 tablet:gap-4 py-2 border-b border-border-light">
      <dt className="text-sm text-text-body tablet:w-40 shrink-0">{label}</dt>
      <dd className="text-text-heading">{value}</dd>
    </div>
  )
}

export function BuchungDetailView({ buchung: initial }: { buchung: BuchungData }) {
  const [buchung, setBuchung] = useState(initial)
  const [updating, setUpdating] = useState(false)
  const [ablehnungsgrund, setAblehnungsgrund] = useState('')
  const [showAblehnung, setShowAblehnung] = useState(false)

  async function updateStatus(status: string, grund?: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/v1/buchungen/${buchung.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ablehnungsgrund: grund }),
      })
      if (res.ok) {
        setBuchung({ ...buchung, status, bearbeitetAm: new Date().toISOString() })
        setShowAblehnung(false)
      }
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-h1 text-text-heading">{buchung.name}</h1>
          <span className={`text-sm px-2 py-0.5 rounded-full
            ${buchung.status === 'GENEHMIGT' ? 'bg-green-100 text-green-800' : ''}
            ${buchung.status === 'ANGEFRAGT' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${buchung.status === 'ABGELEHNT' ? 'bg-red-100 text-red-800' : ''}
            ${buchung.status === 'STORNIERT' ? 'bg-gray-100 text-gray-800' : ''}`}
          >
            {STATUS_LABELS[buchung.status]}
          </span>
        </div>

        {buchung.status === 'ANGEFRAGT' && (
          <div className="flex gap-2">
            <Button onClick={() => updateStatus('GENEHMIGT')} disabled={updating}>Genehmigen</Button>
            <Button variant="outline" onClick={() => setShowAblehnung(true)} disabled={updating}>Ablehnen</Button>
          </div>
        )}

        {buchung.status === 'GENEHMIGT' && (
          <Button variant="outline" onClick={() => updateStatus('STORNIERT')} disabled={updating}>Stornieren</Button>
        )}
      </div>

      {showAblehnung && (
        <div className="bg-white p-4 rounded-lg border border-border space-y-3">
          <Textarea
            label="Ablehnungsgrund (optional)"
            value={ablehnungsgrund}
            onChange={(e) => setAblehnungsgrund(e.target.value)}
            placeholder="z.B. Vereinsheim bereits belegt"
          />
          <div className="flex gap-2">
            <Button onClick={() => updateStatus('ABGELEHNT', ablehnungsgrund)} disabled={updating}>
              Ablehnung bestätigen
            </Button>
            <Button variant="outline" onClick={() => setShowAblehnung(false)}>Abbrechen</Button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border border-border">
        <h2 className="font-heading text-h3 text-text-heading mb-4">Buchungsdetails</h2>
        <dl>
          <Row label="Datum" value={new Date(buchung.datum).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} />
          <Row label="Uhrzeit" value={`${buchung.startzeit} – ${buchung.endzeit} Uhr`} />
          <Row label="Anlass" value={buchung.anlass} />
        </dl>
      </div>

      <div className="bg-white p-6 rounded-lg border border-border">
        <h2 className="font-heading text-h3 text-text-heading mb-4">Kontaktdaten</h2>
        <dl>
          <Row label="Name" value={buchung.name} />
          <Row label="E-Mail" value={buchung.email} />
          <Row label="Telefon" value={buchung.telefon} />
        </dl>
      </div>

      {buchung.nachricht && (
        <div className="bg-white p-6 rounded-lg border border-border">
          <h2 className="font-heading text-h3 text-text-heading mb-2">Nachricht</h2>
          <p className="text-text-body whitespace-pre-wrap">{buchung.nachricht}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border border-border">
        <h2 className="font-heading text-h3 text-text-heading mb-4">Meta</h2>
        <dl>
          <Row label="Eingegangen" value={new Date(buchung.createdAt).toLocaleDateString('de-DE')} />
          <Row label="Bearbeitet" value={buchung.bearbeitetAm ? new Date(buchung.bearbeitetAm).toLocaleDateString('de-DE') : null} />
        </dl>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Admin-Seiten**

```tsx
// src/app/admin/buchungen/page.tsx
import { BuchungList } from '@/components/admin/buchung-list'

export default function AdminBuchungenPage() {
  return (
    <div>
      <h1 className="font-heading text-h1 text-text-heading mb-6">Vereinsheim-Buchungen</h1>
      <BuchungList />
    </div>
  )
}
```

```tsx
// src/app/admin/buchungen/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BuchungDetailView } from '@/components/admin/buchung-detail'

export default async function BuchungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/admin')

  const { id } = await params
  const buchung = await prisma.buchung.findUnique({ where: { id } })
  if (!buchung) notFound()

  return (
    <div>
      <Link href="/admin/buchungen" className="text-sm text-primary hover:text-primary-hover mb-4 inline-block">
        ← Zurück zur Liste
      </Link>
      <BuchungDetailView
        buchung={{
          ...buchung,
          datum: buchung.datum.toISOString(),
          createdAt: buchung.createdAt.toISOString(),
          bearbeitetAm: buchung.bearbeitetAm?.toISOString() || null,
        }}
      />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/sidebar.tsx src/components/admin/buchung-list.tsx src/components/admin/buchung-detail.tsx src/app/admin/buchungen/
git commit -m "feat: admin Vereinsheim booking management with approval workflow"
```

---

### Task 6: Smoke-Test Phase 5

- [ ] **Step 1: Alle Tests ausführen**

Run:
```bash
npx vitest run
```

Expected: Alle Tests grün (bisherige 42 + 3 Buchung-E-Mail-Tests = ~45 Tests).

- [ ] **Step 2: Dev-Server manuell testen**

Run: `npm run dev`

Teste:
1. `/belegung-vereinsheim` — Belegungskalender + Buchungsformular
2. Buchungsanfrage absenden → Bestätigungs-E-Mail (Console-Log)
3. `/admin/buchungen` — Anfrage erscheint
4. Detail → Genehmigen → E-Mail mit Zahlungsinfos
5. Neue Anfrage → Ablehnen mit Grund → Ablehnungs-E-Mail
6. Belegungskalender zeigt genehmigte/angefragte Tage

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: Phase 5 complete — Vereinsheim booking system"
```

---

## Summary

| Task | Was | Tests |
|---|---|---|
| 1 | Zod-Schemas + Textarea | — |
| 2 | E-Mail-Templates (Bestätigung, Genehmigung, Ablehnung) | 3 Tests |
| 3 | Buchungs-API (POST public, GET admin, Status-Workflow) | — |
| 4 | Öffentliche Seite (Belegungskalender + Formular) | — |
| 5 | Admin: Buchungsliste + Detail + Genehmigung + Sidebar | — |
| 6 | Smoke-Test | ~45 Tests total |

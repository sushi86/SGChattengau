# Phase 4: Terminkalender — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Terminkalender mit Listenansicht (Mobile Default), Monatsansicht (Desktop Default), farbcodierten Spartenfiltern, iCal-Feed und CRUD für Spartenleiter/Admin.

**Architecture:** Server Components für die öffentliche Kalenderseite mit Client-Components für interaktive Filter und Ansichtswechsel. iCal-Feed als API-Endpunkt mit `ical.js`. Termine-CRUD über API mit Spartenleiter-Berechtigung. Admin-Sidebar wird um "Termine" erweitert.

**Tech Stack:** ical.js, Next.js App Router, Prisma 7, Zod

---

## Prisma 7 Import Convention

```typescript
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiPaginated, apiError } from '@/lib/api-response'
import { ValidationError, NotFoundError, ForbiddenError, UnauthorizedError } from '@/lib/api-error'
import { authenticateRequest, requireRole } from '@/lib/auth-middleware'
```

---

## File Structure

```
src/
├── app/
│   ├── termine/
│   │   └── page.tsx                          # Öffentliche Kalenderseite (REPLACE)
│   ├── admin/
│   │   └── termine/
│   │       ├── page.tsx                      # Termine-Verwaltung
│   │       └── [id]/
│   │           └── page.tsx                  # Termin bearbeiten
│   └── api/v1/
│       └── termine/
│           ├── route.ts                      # GET (public, filtered), POST (auth)
│           ├── [id]/
│           │   └── route.ts                  # GET, PUT, DELETE (auth)
│           └── ical/
│               └── route.ts                  # GET iCal-Feed
├── components/
│   ├── termine/
│   │   ├── termin-list.tsx                   # Listenansicht
│   │   ├── termin-month.tsx                  # Monatsansicht
│   │   ├── termin-filter.tsx                 # Spartenfilter
│   │   └── kalender.tsx                      # Orchestrator (Ansichtswechsel + Filter)
│   └── admin/
│       ├── sidebar.tsx                       # Erweitert (MODIFY)
│       └── termin-form.tsx                   # Termin erstellen/bearbeiten
├── lib/
│   ├── ical.ts                               # iCal-Generierung
│   └── validations/
│       └── termin.ts                         # Zod-Schemas
└── tests/
    └── lib/
        └── ical.test.ts                      # iCal-Tests
```

---

### Task 1: Dependencies installieren

**Files:**
- Modify: `package.json`

- [ ] **Step 1: ical.js installieren**

Run:
```bash
npm install ical.js
```

Falls Peer-Dependency-Konflikte: `npm install ical.js --legacy-peer-deps`

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add ical.js for calendar feed generation"
```

---

### Task 2: Zod-Schemas für Termine

**Files:**
- Create: `src/lib/validations/termin.ts`

- [ ] **Step 1: Schemas erstellen**

```typescript
// src/lib/validations/termin.ts
import { z } from 'zod'

export const terminCreateSchema = z.object({
  titel: z.string().min(3, 'Titel muss mindestens 3 Zeichen lang sein'),
  beschreibung: z.string().optional(),
  startzeit: z.string().datetime({ message: 'Ungültiges Datum' }),
  endzeit: z.string().datetime({ message: 'Ungültiges Datum' }).optional(),
  ort: z.string().optional(),
  ganztaegig: z.boolean().optional(),
  sparteId: z.string().optional(),
})

export const terminUpdateSchema = terminCreateSchema.partial()

export type TerminCreateInput = z.infer<typeof terminCreateSchema>
export type TerminUpdateInput = z.infer<typeof terminUpdateSchema>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validations/termin.ts
git commit -m "feat: Zod schemas for Termine"
```

---

### Task 3: iCal-Generierung (TDD)

**Files:**
- Create: `src/lib/ical.ts`
- Test: `tests/lib/ical.test.ts`

- [ ] **Step 1: Tests schreiben**

```typescript
// tests/lib/ical.test.ts
import { describe, it, expect } from 'vitest'
import { generateIcal } from '@/lib/ical'

describe('generateIcal', () => {
  it('generates valid iCal output with VCALENDAR', () => {
    const ical = generateIcal([])
    expect(ical).toContain('BEGIN:VCALENDAR')
    expect(ical).toContain('END:VCALENDAR')
    expect(ical).toContain('PRODID:-//SG 1898 Chattengau')
  })

  it('includes a VEVENT for each termin', () => {
    const termine = [
      {
        id: 'test1',
        titel: 'Training',
        beschreibung: 'Fußballtraining',
        startzeit: new Date('2026-05-01T18:00:00Z'),
        endzeit: new Date('2026-05-01T20:00:00Z'),
        ort: 'Sportplatz',
        ganztaegig: false,
      },
    ]
    const ical = generateIcal(termine)
    expect(ical).toContain('BEGIN:VEVENT')
    expect(ical).toContain('SUMMARY:Training')
    expect(ical).toContain('DESCRIPTION:Fußballtraining')
    expect(ical).toContain('LOCATION:Sportplatz')
    expect(ical).toContain('END:VEVENT')
  })

  it('handles all-day events', () => {
    const termine = [
      {
        id: 'test2',
        titel: 'Vereinsfest',
        beschreibung: null,
        startzeit: new Date('2026-06-15T00:00:00Z'),
        endzeit: null,
        ort: null,
        ganztaegig: true,
      },
    ]
    const ical = generateIcal(termine)
    expect(ical).toContain('DTSTART;VALUE=DATE:20260615')
    expect(ical).not.toContain('DTSTART:2026')
  })

  it('handles multiple events', () => {
    const termine = [
      { id: '1', titel: 'A', beschreibung: null, startzeit: new Date('2026-05-01T10:00:00Z'), endzeit: null, ort: null, ganztaegig: false },
      { id: '2', titel: 'B', beschreibung: null, startzeit: new Date('2026-05-02T10:00:00Z'), endzeit: null, ort: null, ganztaegig: false },
    ]
    const ical = generateIcal(termine)
    const eventCount = (ical.match(/BEGIN:VEVENT/g) || []).length
    expect(eventCount).toBe(2)
  })
})
```

- [ ] **Step 2: Tests ausführen — FAIL**

Run: `npx vitest run tests/lib/ical.test.ts`

- [ ] **Step 3: iCal-Modul implementieren**

```typescript
// src/lib/ical.ts
interface TerminForIcal {
  id: string
  titel: string
  beschreibung: string | null
  startzeit: Date
  endzeit: Date | null
  ort: string | null
  ganztaegig: boolean
}

function formatDateTimeUTC(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

function escapeIcalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function generateIcal(termine: TerminForIcal[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SG 1898 Chattengau//Terminkalender//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:SG 1898 Chattengau Termine',
    'X-WR-TIMEZONE:Europe/Berlin',
  ]

  for (const t of termine) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${t.id}@sg1898chattengau.de`)

    if (t.ganztaegig) {
      lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(t.startzeit)}`)
      if (t.endzeit) {
        lines.push(`DTEND;VALUE=DATE:${formatDateOnly(t.endzeit)}`)
      }
    } else {
      lines.push(`DTSTART:${formatDateTimeUTC(t.startzeit)}`)
      if (t.endzeit) {
        lines.push(`DTEND:${formatDateTimeUTC(t.endzeit)}`)
      }
    }

    lines.push(`SUMMARY:${escapeIcalText(t.titel)}`)

    if (t.beschreibung) {
      lines.push(`DESCRIPTION:${escapeIcalText(t.beschreibung)}`)
    }

    if (t.ort) {
      lines.push(`LOCATION:${escapeIcalText(t.ort)}`)
    }

    lines.push(`DTSTAMP:${formatDateTimeUTC(new Date())}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}
```

- [ ] **Step 4: Tests ausführen — PASS**

Run: `npx vitest run tests/lib/ical.test.ts`

Expected: 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ical.ts tests/lib/ical.test.ts
git commit -m "feat: iCal feed generation with TDD"
```

---

### Task 4: Termine API — CRUD + iCal-Feed

**Files:**
- Create: `src/app/api/v1/termine/route.ts`
- Create: `src/app/api/v1/termine/[id]/route.ts`
- Create: `src/app/api/v1/termine/ical/route.ts`

- [ ] **Step 1: GET (public, filtered) + POST (auth)**

```typescript
// src/app/api/v1/termine/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { ValidationError, UnauthorizedError, ForbiddenError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'
import { terminCreateSchema } from '@/lib/validations/termin'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const sparteId = url.searchParams.get('sparte')
    const von = url.searchParams.get('von')
    const bis = url.searchParams.get('bis')

    const where: Record<string, unknown> = {}

    if (sparteId) {
      // Support comma-separated sparte IDs for multi-filter
      const ids = sparteId.split(',').filter(Boolean)
      if (ids.length === 1) {
        where.sparteId = ids[0]
      } else if (ids.length > 1) {
        where.sparteId = { in: ids }
      }
    }

    if (von || bis) {
      where.startzeit = {}
      if (von) (where.startzeit as Record<string, unknown>).gte = new Date(von)
      if (bis) (where.startzeit as Record<string, unknown>).lte = new Date(bis)
    }

    const termine = await prisma.termin.findMany({
      where,
      include: { sparte: { select: { id: true, name: true, slug: true } } },
      orderBy: { startzeit: 'asc' },
    })

    return apiSuccess(termine)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const body = await req.json()
    const parsed = terminCreateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const d = parsed.data

    // Spartenleiter/Kursleiter can only create for their own sparte
    if (user.role !== 'ADMIN') {
      if (d.sparteId && d.sparteId !== user.sparteId) {
        throw new ForbiddenError('Keine Berechtigung für diese Sparte')
      }
      if (!d.sparteId) {
        d.sparteId = user.sparteId || undefined
      }
    }

    const termin = await prisma.termin.create({
      data: {
        titel: d.titel,
        beschreibung: d.beschreibung || null,
        startzeit: new Date(d.startzeit),
        endzeit: d.endzeit ? new Date(d.endzeit) : null,
        ort: d.ort || null,
        ganztaegig: d.ganztaegig ?? false,
        sparteId: d.sparteId || null,
      },
    })

    return apiSuccess(termin, 201)
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 2: GET, PUT, DELETE einzelner Termin**

```typescript
// src/app/api/v1/termine/[id]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'
import { terminUpdateSchema } from '@/lib/validations/termin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const termin = await prisma.termin.findUnique({
      where: { id },
      include: { sparte: { select: { id: true, name: true, slug: true } } },
    })
    if (!termin) throw new NotFoundError('Termin')
    return apiSuccess(termin)
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const { id } = await params
    const termin = await prisma.termin.findUnique({ where: { id } })
    if (!termin) throw new NotFoundError('Termin')

    // Spartenleiter can only edit their sparte's termine
    if (user.role !== 'ADMIN' && termin.sparteId !== user.sparteId) {
      throw new ForbiddenError()
    }

    const body = await req.json()
    const parsed = terminUpdateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.titel !== undefined) data.titel = parsed.data.titel
    if (parsed.data.beschreibung !== undefined) data.beschreibung = parsed.data.beschreibung || null
    if (parsed.data.startzeit !== undefined) data.startzeit = new Date(parsed.data.startzeit)
    if (parsed.data.endzeit !== undefined) data.endzeit = parsed.data.endzeit ? new Date(parsed.data.endzeit) : null
    if (parsed.data.ort !== undefined) data.ort = parsed.data.ort || null
    if (parsed.data.ganztaegig !== undefined) data.ganztaegig = parsed.data.ganztaegig
    if (parsed.data.sparteId !== undefined) data.sparteId = parsed.data.sparteId || null

    const updated = await prisma.termin.update({ where: { id }, data })

    return apiSuccess(updated)
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const { id } = await params
    const termin = await prisma.termin.findUnique({ where: { id } })
    if (!termin) throw new NotFoundError('Termin')

    if (user.role !== 'ADMIN' && termin.sparteId !== user.sparteId) {
      throw new ForbiddenError()
    }

    await prisma.termin.delete({ where: { id } })

    return apiSuccess({ deleted: true })
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 3: iCal-Feed Endpunkt**

```typescript
// src/app/api/v1/termine/ical/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateIcal } from '@/lib/ical'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const sparteId = url.searchParams.get('sparte')

  const where: Record<string, unknown> = {}
  if (sparteId) {
    const ids = sparteId.split(',').filter(Boolean)
    if (ids.length === 1) {
      where.sparteId = ids[0]
    } else if (ids.length > 1) {
      where.sparteId = { in: ids }
    }
  }

  const termine = await prisma.termin.findMany({
    where,
    orderBy: { startzeit: 'asc' },
  })

  const ical = generateIcal(termine)

  return new NextResponse(ical, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="sg-chattengau-termine.ics"',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/v1/termine/ src/lib/validations/termin.ts
git commit -m "feat: Termine API with CRUD, filtering, and iCal feed"
```

---

### Task 5: Kalender-Komponenten (öffentlich)

**Files:**
- Create: `src/components/termine/termin-filter.tsx`
- Create: `src/components/termine/termin-list.tsx`
- Create: `src/components/termine/termin-month.tsx`
- Create: `src/components/termine/kalender.tsx`

- [ ] **Step 1: Spartenfilter**

```tsx
// src/components/termine/termin-filter.tsx
'use client'

interface SparteOption {
  id: string
  name: string
}

// Feste Farben für die ersten 10 Sparten, danach Grau
const SPARTE_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500',
  'bg-teal-500', 'bg-cyan-500',
]

export function getSparteColor(index: number): string {
  return SPARTE_COLORS[index % SPARTE_COLORS.length]
}

interface TerminFilterProps {
  sparten: SparteOption[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function TerminFilter({ sparten, selected, onChange }: TerminFilterProps) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange([])}
        className={`px-3 py-1.5 rounded-full text-sm min-h-[36px] transition-colors
          ${selected.length === 0
            ? 'bg-primary text-white'
            : 'bg-section-alt text-text-body hover:bg-border-light'}`}
      >
        Alle
      </button>
      {sparten.map((s, i) => {
        const active = selected.includes(s.id)
        const color = getSparteColor(i)
        return (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className={`px-3 py-1.5 rounded-full text-sm min-h-[36px] transition-colors flex items-center gap-1.5
              ${active
                ? 'bg-primary text-white'
                : 'bg-section-alt text-text-body hover:bg-border-light'}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            {s.name}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Listenansicht**

```tsx
// src/components/termine/termin-list.tsx
import { getSparteColor } from './termin-filter'

interface Termin {
  id: string
  titel: string
  beschreibung: string | null
  startzeit: string
  endzeit: string | null
  ort: string | null
  ganztaegig: boolean
  sparte: { id: string; name: string; slug: string } | null
}

interface TerminListProps {
  termine: Termin[]
  sparteIndexMap: Map<string, number>
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function TerminList({ termine, sparteIndexMap }: TerminListProps) {
  if (termine.length === 0) {
    return <p className="text-text-body py-8 text-center">Keine Termine gefunden.</p>
  }

  // Group by date
  const grouped = new Map<string, Termin[]>()
  for (const t of termine) {
    const dateKey = new Date(t.startzeit).toISOString().slice(0, 10)
    if (!grouped.has(dateKey)) grouped.set(dateKey, [])
    grouped.get(dateKey)!.push(t)
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([dateKey, dayTermine]) => (
        <div key={dateKey}>
          <h3 className="font-heading text-sm font-semibold text-text-heading mb-2 uppercase tracking-wide">
            {formatDate(dayTermine[0].startzeit)}
          </h3>
          <div className="space-y-2">
            {dayTermine.map((t) => {
              const colorIdx = t.sparte ? (sparteIndexMap.get(t.sparte.id) ?? 0) : 0
              const color = getSparteColor(colorIdx)
              return (
                <div key={t.id} className="bg-white rounded-md border border-border p-3 flex gap-3">
                  <div className={`w-1 rounded-full ${color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-heading">{t.titel}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-body mt-1">
                      {!t.ganztaegig && (
                        <span>
                          {formatTime(t.startzeit)}
                          {t.endzeit && ` – ${formatTime(t.endzeit)}`}
                        </span>
                      )}
                      {t.ganztaegig && <span>Ganztägig</span>}
                      {t.ort && <span>{t.ort}</span>}
                      {t.sparte && <span className="text-primary">{t.sparte.name}</span>}
                    </div>
                    {t.beschreibung && (
                      <p className="text-sm text-text-body mt-1 line-clamp-2">{t.beschreibung}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Monatsansicht**

```tsx
// src/components/termine/termin-month.tsx
import { getSparteColor } from './termin-filter'

interface Termin {
  id: string
  titel: string
  startzeit: string
  ganztaegig: boolean
  sparte: { id: string; name: string } | null
}

interface TerminMonthProps {
  termine: Termin[]
  year: number
  month: number // 0-indexed
  onPrev: () => void
  onNext: () => void
  sparteIndexMap: Map<string, number>
}

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function TerminMonth({ termine, year, month, onPrev, onNext, sparteIndexMap }: TerminMonthProps) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  // Build grid
  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  // Map termine to days
  const termineByDay = new Map<number, Termin[]>()
  for (const t of termine) {
    const d = new Date(t.startzeit)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!termineByDay.has(day)) termineByDay.set(day, [])
      termineByDay.get(day)!.push(t)
    }
  }

  const today = new Date()
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="text-primary hover:text-primary-hover min-h-[44px] px-3 text-lg">←</button>
        <h3 className="font-heading text-h3 text-text-heading">{MONATE[month]} {year}</h3>
        <button onClick={onNext} className="text-primary hover:text-primary-hover min-h-[44px] px-3 text-lg">→</button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {WOCHENTAGE.map((tag) => (
          <div key={tag} className="text-center text-xs font-medium text-text-body py-1">{tag}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden">
        {cells.map((day, i) => (
          <div
            key={i}
            className={`bg-white min-h-[80px] p-1 ${day === null ? 'bg-section-alt' : ''}`}
          >
            {day !== null && (
              <>
                <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full
                  ${isToday(day) ? 'bg-primary text-white' : 'text-text-heading'}`}>
                  {day}
                </span>
                <div className="space-y-0.5 mt-0.5">
                  {(termineByDay.get(day) || []).slice(0, 3).map((t) => {
                    const colorIdx = t.sparte ? (sparteIndexMap.get(t.sparte.id) ?? 0) : 0
                    const color = getSparteColor(colorIdx)
                    return (
                      <div key={t.id} className={`text-[10px] leading-tight text-white px-1 py-0.5 rounded truncate ${color}`}>
                        {!t.ganztaegig && `${formatTime(t.startzeit)} `}{t.titel}
                      </div>
                    )
                  })}
                  {(termineByDay.get(day) || []).length > 3 && (
                    <div className="text-[10px] text-text-body px-1">+{(termineByDay.get(day) || []).length - 3} weitere</div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Kalender-Orchestrator**

```tsx
// src/components/termine/kalender.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { TerminFilter } from './termin-filter'
import { TerminList } from './termin-list'
import { TerminMonth } from './termin-month'
import { Button } from '@/components/ui/button'

interface SparteOption {
  id: string
  name: string
  slug: string
}

interface Termin {
  id: string
  titel: string
  beschreibung: string | null
  startzeit: string
  endzeit: string | null
  ort: string | null
  ganztaegig: boolean
  sparte: { id: string; name: string; slug: string } | null
}

interface KalenderProps {
  sparten: SparteOption[]
  baseUrl: string // for webcal link
}

type ViewMode = 'list' | 'month'

export function Kalender({ sparten, baseUrl }: KalenderProps) {
  const [view, setView] = useState<ViewMode>('list')
  const [selectedSparten, setSelectedSparten] = useState<string[]>([])
  const [termine, setTermine] = useState<Termin[]>([])
  const [loading, setLoading] = useState(true)
  const [monthYear, setMonthYear] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const sparteIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    sparten.forEach((s, i) => map.set(s.id, i))
    return map
  }, [sparten])

  const fetchTermine = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedSparten.length > 0) {
      params.set('sparte', selectedSparten.join(','))
    }
    // For month view, filter by month range
    if (view === 'month') {
      const von = new Date(monthYear.year, monthYear.month, 1)
      const bis = new Date(monthYear.year, monthYear.month + 1, 0, 23, 59, 59)
      params.set('von', von.toISOString())
      params.set('bis', bis.toISOString())
    }

    const res = await fetch(`/api/v1/termine?${params}`)
    if (res.ok) {
      const body = await res.json()
      setTermine(body.data || [])
    }
    setLoading(false)
  }, [selectedSparten, view, monthYear])

  useEffect(() => { fetchTermine() }, [fetchTermine])

  // Detect mobile for default view
  useEffect(() => {
    if (window.innerWidth >= 768) setView('month')
  }, [])

  const icalUrl = `${baseUrl}/api/v1/termine/ical${selectedSparten.length > 0 ? `?sparte=${selectedSparten.join(',')}` : ''}`
  const webcalUrl = icalUrl.replace(/^https?:/, 'webcal:')

  return (
    <div className="space-y-4">
      {/* View toggle + iCal */}
      <div className="flex flex-col tablet:flex-row items-start tablet:items-center justify-between gap-3">
        <div className="flex gap-1 bg-section-alt rounded-md p-1">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded text-sm min-h-[36px] transition-colors
              ${view === 'list' ? 'bg-white text-text-heading shadow-sm' : 'text-text-body'}`}
          >
            Liste
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1.5 rounded text-sm min-h-[36px] transition-colors
              ${view === 'month' ? 'bg-white text-text-heading shadow-sm' : 'text-text-body'}`}
          >
            Monat
          </button>
        </div>

        <a href={webcalUrl} className="text-sm text-primary hover:text-primary-hover">
          Kalender abonnieren (iCal)
        </a>
      </div>

      {/* Spartenfilter */}
      <TerminFilter
        sparten={sparten}
        selected={selectedSparten}
        onChange={setSelectedSparten}
      />

      {/* Content */}
      {loading ? (
        <p className="text-text-body py-8 text-center">Laden...</p>
      ) : view === 'list' ? (
        <TerminList termine={termine} sparteIndexMap={sparteIndexMap} />
      ) : (
        <TerminMonth
          termine={termine}
          year={monthYear.year}
          month={monthYear.month}
          sparteIndexMap={sparteIndexMap}
          onPrev={() => setMonthYear((p) => {
            const d = new Date(p.year, p.month - 1)
            return { year: d.getFullYear(), month: d.getMonth() }
          })}
          onNext={() => setMonthYear((p) => {
            const d = new Date(p.year, p.month + 1)
            return { year: d.getFullYear(), month: d.getMonth() }
          })}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/termine/
git commit -m "feat: calendar components with list/month views, sparte filter, iCal link"
```

---

### Task 6: Öffentliche Termine-Seite

**Files:**
- Modify: `src/app/termine/page.tsx`

- [ ] **Step 1: Termine-Seite ersetzen**

```tsx
// src/app/termine/page.tsx
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Container } from '@/components/layout/container'
import { Kalender } from '@/components/termine/kalender'
import { headers } from 'next/headers'

export const metadata: Metadata = {
  title: 'Termine',
  description: 'Alle Termine und Veranstaltungen der SG 1898 Chattengau e.V.',
}

export default async function TerminePage() {
  const sparten = await prisma.sparte.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { sortOrder: 'asc' },
  })

  // Get base URL for webcal link
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') || 'http'
  const baseUrl = `${proto}://${host}`

  return (
    <section className="py-8 tablet:py-12">
      <Container>
        <h1 className="font-heading text-h1 text-text-heading mb-6">Termine</h1>
        <Kalender sparten={sparten} baseUrl={baseUrl} />
      </Container>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/termine/page.tsx
git commit -m "feat: public calendar page with list/month views"
```

---

### Task 7: Admin — Termine-Verwaltung

**Files:**
- Modify: `src/components/admin/sidebar.tsx`
- Create: `src/components/admin/termin-form.tsx`
- Create: `src/app/admin/termine/page.tsx`
- Create: `src/app/admin/termine/[id]/page.tsx`

- [ ] **Step 1: Admin-Sidebar um Termine erweitern**

In `src/components/admin/sidebar.tsx`:

Füge in `ADMIN_ITEMS` nach `{ href: '/admin/beitraege', label: 'Beiträge' }` ein:
```typescript
{ href: '/admin/termine', label: 'Termine' },
```

Füge in `LEITER_ITEMS` nach `{ href: '/admin/beitraege', label: 'Beiträge' }` ein:
```typescript
{ href: '/admin/termine', label: 'Termine' },
```

- [ ] **Step 2: Termin-Formular Komponente**

```tsx
// src/components/admin/termin-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SparteOption {
  id: string
  name: string
}

interface TerminFormProps {
  termin?: {
    id: string
    titel: string
    beschreibung: string | null
    startzeit: string
    endzeit: string | null
    ort: string | null
    ganztaegig: boolean
    sparteId: string | null
  }
  sparten: SparteOption[]
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function TerminForm({ termin, sparten }: TerminFormProps) {
  const router = useRouter()
  const isNew = !termin

  const [titel, setTitel] = useState(termin?.titel || '')
  const [beschreibung, setBeschreibung] = useState(termin?.beschreibung || '')
  const [startzeit, setStartzeit] = useState(termin?.startzeit ? toDatetimeLocal(termin.startzeit) : '')
  const [endzeit, setEndzeit] = useState(termin?.endzeit ? toDatetimeLocal(termin.endzeit) : '')
  const [ort, setOrt] = useState(termin?.ort || '')
  const [ganztaegig, setGanztaegig] = useState(termin?.ganztaegig ?? false)
  const [sparteId, setSparteId] = useState(termin?.sparteId || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true)
    setError('')

    try {
      const url = isNew ? '/api/v1/termine' : `/api/v1/termine/${termin!.id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titel,
          beschreibung: beschreibung || undefined,
          startzeit: new Date(startzeit).toISOString(),
          endzeit: endzeit ? new Date(endzeit).toISOString() : undefined,
          ort: ort || undefined,
          ganztaegig,
          sparteId: sparteId || undefined,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error?.message || 'Fehler beim Speichern')
        return
      }

      router.push('/admin/termine')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {error && <div className="p-3 bg-red-50 text-error rounded-md text-sm">{error}</div>}

      <Input label="Titel" value={titel} onChange={(e) => setTitel(e.target.value)} required />

      <div>
        <label className="block text-sm font-medium text-text-heading mb-1">Beschreibung</label>
        <textarea
          value={beschreibung}
          onChange={(e) => setBeschreibung(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border px-4 py-3 text-text-heading focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <label className="flex items-center gap-2 min-h-[44px]">
        <input
          type="checkbox"
          checked={ganztaegig}
          onChange={(e) => setGanztaegig(e.target.checked)}
          className="accent-primary w-4 h-4"
        />
        <span className="text-text-heading text-sm">Ganztägig</span>
      </label>

      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
        <Input
          label={ganztaegig ? 'Datum' : 'Beginn'}
          type={ganztaegig ? 'date' : 'datetime-local'}
          value={ganztaegig ? startzeit.slice(0, 10) : startzeit}
          onChange={(e) => setStartzeit(ganztaegig ? `${e.target.value}T00:00` : e.target.value)}
          required
        />
        {!ganztaegig && (
          <Input
            label="Ende"
            type="datetime-local"
            value={endzeit}
            onChange={(e) => setEndzeit(e.target.value)}
          />
        )}
      </div>

      <Input label="Ort" value={ort} onChange={(e) => setOrt(e.target.value)} />

      <div>
        <label className="block text-sm font-medium text-text-heading mb-1">Sparte</label>
        <select
          value={sparteId}
          onChange={(e) => setSparteId(e.target.value)}
          className="w-full rounded-md border border-border px-4 py-3 text-text-heading bg-white"
        >
          <option value="">Vereinstermin (keine Sparte)</option>
          {sparten.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={save} disabled={saving}>{saving ? 'Speichern...' : isNew ? 'Erstellen' : 'Speichern'}</Button>
        <Button variant="outline" onClick={() => router.back()}>Abbrechen</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Termine-Verwaltungsseite**

```tsx
// src/app/admin/termine/page.tsx
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'

export default async function AdminTerminePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const where: Record<string, unknown> = {}
  if (session.user.role !== 'ADMIN' && session.user.sparteId) {
    where.sparteId = session.user.sparteId
  }

  const termine = await prisma.termin.findMany({
    where,
    include: { sparte: { select: { name: true } } },
    orderBy: { startzeit: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-h1 text-text-heading">Termine</h1>
        <Link href="/admin/termine/neu">
          <Button className="text-sm">+ Neuer Termin</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-section-alt">
              <th className="text-left p-3 font-medium text-text-heading">Titel</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Datum</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Sparte</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Ort</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {termine.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-body">Keine Termine vorhanden.</td></tr>
            ) : (
              termine.map((t) => (
                <tr key={t.id} className="border-b border-border-light hover:bg-section-alt">
                  <td className="p-3">
                    <div className="font-medium text-text-heading">{t.titel}</div>
                    <div className="text-xs text-text-body tablet:hidden">
                      {t.startzeit.toLocaleDateString('de-DE')}
                      {t.sparte && ` · ${t.sparte.name}`}
                    </div>
                  </td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">
                    {t.startzeit.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {!t.ganztaegig && ` ${t.startzeit.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`}
                  </td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">{t.sparte?.name || '—'}</td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">{t.ort || '—'}</td>
                  <td className="p-3">
                    <Link href={`/admin/termine/${t.id}`} className="text-primary hover:text-primary-hover text-sm">
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Neuer Termin Seite**

Erstelle `src/app/admin/termine/neu/page.tsx` statt einer separaten "neu"-Route. Da die Termin-Form sowohl für Neu als auch Bearbeiten verwendet wird, erstelle die Seite:

```tsx
// src/app/admin/termine/neu/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TerminForm } from '@/components/admin/termin-form'

export default async function NeuTerminPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const sparten = await prisma.sparte.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <h1 className="font-heading text-h1 text-text-heading mb-6">Neuer Termin</h1>
      <div className="bg-white p-6 rounded-lg border border-border">
        <TerminForm sparten={sparten} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Termin bearbeiten Seite**

```tsx
// src/app/admin/termine/[id]/page.tsx
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TerminForm } from '@/components/admin/termin-form'

export default async function TerminEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params
  const termin = await prisma.termin.findUnique({ where: { id } })
  if (!termin) notFound()

  // Spartenleiter can only edit their sparte's termine
  if (session.user.role !== 'ADMIN' && termin.sparteId !== session.user.sparteId) {
    redirect('/admin/termine')
  }

  const sparten = await prisma.sparte.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <Link href="/admin/termine" className="text-sm text-primary hover:text-primary-hover mb-4 inline-block">
        ← Zurück zur Liste
      </Link>
      <h1 className="font-heading text-h1 text-text-heading mb-6">Termin bearbeiten</h1>
      <div className="bg-white p-6 rounded-lg border border-border">
        <TerminForm
          termin={{
            ...termin,
            startzeit: termin.startzeit.toISOString(),
            endzeit: termin.endzeit?.toISOString() || null,
          }}
          sparten={sparten}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/sidebar.tsx src/components/admin/termin-form.tsx src/app/admin/termine/
git commit -m "feat: admin Termine management with create/edit/list"
```

---

### Task 8: Smoke-Test Phase 4

- [ ] **Step 1: Alle Tests ausführen**

Run:
```bash
npx vitest run
```

Expected: Alle Tests grün (bisherige 38 + iCal 4 = ~42 Tests).

- [ ] **Step 2: Dev-Server manuell testen**

Run: `npm run dev`

Teste:
1. `/termine` — Kalenderseite mit Liste/Monats-Toggle
2. Spartenfilter: Sparten an-/abwählen
3. iCal-Link: "Kalender abonnieren" → Download
4. `/admin/termine` → Neuer Termin erstellen
5. Termin erscheint im öffentlichen Kalender
6. Monatsansicht: Navigation vor/zurück
7. Termin bearbeiten und löschen

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: Phase 4 complete — Terminkalender"
```

---

## Summary

| Task | Was | Tests |
|---|---|---|
| 1 | Dependencies (ical.js) | — |
| 2 | Zod-Schemas für Termine | — |
| 3 | iCal-Generierung | 4 Tests |
| 4 | Termine API (CRUD + iCal-Feed) | — |
| 5 | Kalender-Komponenten (Filter, Liste, Monat, Orchestrator) | — |
| 6 | Öffentliche Termine-Seite | — |
| 7 | Admin: Termine-Verwaltung + Sidebar | — |
| 8 | Smoke-Test | ~42 Tests total |

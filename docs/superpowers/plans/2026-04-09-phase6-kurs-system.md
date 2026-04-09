# Phase 6: Kurs-System + 10er-Karten + SumUp — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mitglieder können sich in Kurse (Typ KURS) einbuchen, 10er-Karten kaufen (online via SumUp), und Kursleiter tracken die Anwesenheit. Kursseiten zeigen verfügbare Plätze, Preise und Buchungsoptionen.

**Architecture:** Kurs-spezifische Felder werden dem bestehenden Sparte-Model hinzugefügt (maxTeilnehmer, preis, kursZeitraum). Neue Models: Zehnerkarte, KursBuchung, Zahlung. SumUp-Integration über deren Checkout-API (Server-seitiger Checkout-Link, Client-Redirect). Kursleiter-Dashboard für Teilnehmer- und Anwesenheitsverwaltung.

**Tech Stack:** SumUp Checkout API, Prisma 7, Next.js App Router, Zod

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
│   ├── kurse/
│   │   └── [slug]/
│   │       └── page.tsx                      # Öffentliche Kursseite mit Buchung
│   ├── admin/
│   │   └── kurse/
│   │       ├── page.tsx                      # Kursleiter: Teilnehmerliste
│   │       └── [id]/
│   │           └── page.tsx                  # Kurs-Detail mit Anwesenheit
│   └── api/v1/
│       ├── kurse/
│       │   ├── [slug]/
│       │   │   ├── buchen/
│       │   │   │   └── route.ts              # POST Kursbuchung (Einzeltermin)
│       │   │   └── zehnerkarte/
│       │   │       └── route.ts              # POST 10er-Karte kaufen → SumUp
│       │   └── route.ts                      # GET alle Kurse mit Verfügbarkeit
│       ├── zehnerkarten/
│       │   └── [id]/
│       │       └── route.ts                  # GET Details einer 10er-Karte
│       ├── kursbuchungen/
│       │   ├── route.ts                      # GET Buchungen (Kursleiter)
│       │   └── [id]/
│       │       └── anwesenheit/
│       │           └── route.ts              # PATCH Anwesenheit markieren
│       └── payment/
│           ├── checkout/
│           │   └── route.ts                  # POST SumUp Checkout erstellen
│           └── webhook/
│               └── route.ts                  # POST SumUp Webhook (Zahlungsbestätigung)
├── components/
│   ├── kurse/
│   │   ├── kurs-buchung-card.tsx             # Buchungs-/Kaufoptionen auf Kursseite
│   │   └── zehnerkarte-status.tsx            # 10er-Karten-Anzeige (verbleibende Einheiten)
│   └── admin/
│       ├── kurs-teilnehmer.tsx               # Teilnehmerliste mit Anwesenheit
│       └── sidebar.tsx                       # Erweitert (MODIFY)
├── lib/
│   ├── sumup.ts                              # SumUp API Client
│   ├── validations/
│   │   └── kurs.ts                           # Zod-Schemas
│   └── email-templates.ts                    # Erweitert (MODIFY)
└── tests/
    └── lib/
        └── sumup.test.ts                     # SumUp Checkout URL Tests
```

---

### Task 1: Prisma Schema erweitern

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Sparte-Model um Kurs-Felder erweitern + neue Models**

Am Ende des Sparte-Models (vor `createdAt`) hinzufügen:

```prisma
  // Kurs-spezifische Felder (nur bei typ=KURS)
  maxTeilnehmer   Int?
  preis           Float?     // Preis pro Einzelbuchung in Euro
  preisZehnerkarte Float?   // Preis für 10er-Karte in Euro
  kursBeginn      DateTime?
  kursEnde        DateTime?
  
  zehnerkarten    Zehnerkarte[]
  kursBuchungen   KursBuchung[]
```

Neue Models am Ende der Datei:

```prisma
// === KURS-SYSTEM (Phase 6) ===

model Zehnerkarte {
  id              String    @id @default(cuid())
  sparteId        String
  sparte          Sparte    @relation(fields: [sparteId], references: [id])
  
  kaeuferName     String
  kaeuferEmail    String
  
  preis           Float
  verbleibend     Int       @default(10)
  gueltigVon      DateTime  @default(now())
  gueltigBis      DateTime
  
  zahlungId       String?   @unique
  zahlung         Zahlung?  @relation(fields: [zahlungId], references: [id])
  
  buchungen       KursBuchung[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum AnwesenheitStatus {
  GEBUCHT
  ANWESEND
  ABWESEND
  STORNIERT
}

model KursBuchung {
  id              String             @id @default(cuid())
  sparteId        String
  sparte          Sparte             @relation(fields: [sparteId], references: [id])
  
  teilnehmerName  String
  teilnehmerEmail String
  datum           DateTime
  
  zehnerkarteId   String?
  zehnerkarte     Zehnerkarte?       @relation(fields: [zehnerkarteId], references: [id])
  
  anwesenheit     AnwesenheitStatus  @default(GEBUCHT)
  
  zahlungId       String?            @unique
  zahlung         Zahlung?           @relation(fields: [zahlungId], references: [id])
  
  createdAt       DateTime           @default(now())
}

enum ZahlungStatus {
  AUSSTEHEND
  BEZAHLT
  FEHLGESCHLAGEN
  ERSTATTET
}

enum ZahlungTyp {
  ZEHNERKARTE
  EINZELBUCHUNG
}

model Zahlung {
  id              String         @id @default(cuid())
  betrag          Float
  status          ZahlungStatus  @default(AUSSTEHEND)
  typ             ZahlungTyp
  
  sumupCheckoutId String?        @unique
  sumupTxCode     String?
  
  zehnerkarte     Zehnerkarte?
  kursBuchung     KursBuchung?
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}
```

- [ ] **Step 2: Schema zur DB pushen und Client generieren**

Run:
```bash
npx prisma db push
npx prisma generate
```

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: Prisma schema for Kurs-System (Zehnerkarte, KursBuchung, Zahlung)"
```

---

### Task 2: Zod-Schemas + SumUp Client

**Files:**
- Create: `src/lib/validations/kurs.ts`
- Create: `src/lib/sumup.ts`
- Test: `tests/lib/sumup.test.ts`

- [ ] **Step 1: Zod-Schemas erstellen**

```typescript
// src/lib/validations/kurs.ts
import { z } from 'zod'

export const kursBuchungSchema = z.object({
  teilnehmerName: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  teilnehmerEmail: z.string().email('Ungültige E-Mail-Adresse'),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  zehnerkarteId: z.string().optional(),
})

export const zehnerkarteKaufSchema = z.object({
  kaeuferName: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  kaeuferEmail: z.string().email('Ungültige E-Mail-Adresse'),
})

export const anwesenheitSchema = z.object({
  anwesenheit: z.enum(['GEBUCHT', 'ANWESEND', 'ABWESEND', 'STORNIERT']),
})

export const kursUpdateSchema = z.object({
  maxTeilnehmer: z.number().int().min(1).optional(),
  preis: z.number().min(0).optional(),
  preisZehnerkarte: z.number().min(0).optional(),
  kursBeginn: z.string().optional(),
  kursEnde: z.string().optional(),
})

export type KursBuchungInput = z.infer<typeof kursBuchungSchema>
export type ZehnerkarteKaufInput = z.infer<typeof zehnerkarteKaufSchema>
```

- [ ] **Step 2: SumUp-Tests schreiben**

```typescript
// tests/lib/sumup.test.ts
import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.SUMUP_API_KEY = 'test-api-key'
  process.env.SUMUP_MERCHANT_CODE = 'TEST_MERCHANT'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
})

describe('sumup', () => {
  it('builds checkout request body correctly', async () => {
    const { buildCheckoutBody } = await import('@/lib/sumup')
    const body = buildCheckoutBody({
      amount: 80,
      description: '10er-Karte Yoga',
      referenceId: 'zk_123',
    })
    expect(body.amount).toBe(80)
    expect(body.description).toBe('10er-Karte Yoga')
    expect(body.checkout_reference).toBe('zk_123')
    expect(body.currency).toBe('EUR')
    expect(body.merchant_code).toBe('TEST_MERCHANT')
    expect(body.redirect_url).toContain('/payment/success')
  })

  it('builds checkout body for single booking', async () => {
    const { buildCheckoutBody } = await import('@/lib/sumup')
    const body = buildCheckoutBody({
      amount: 12,
      description: 'Einzelbuchung Qigong 15.05.2026',
      referenceId: 'kb_456',
    })
    expect(body.amount).toBe(12)
    expect(body.checkout_reference).toBe('kb_456')
  })
})
```

- [ ] **Step 3: Tests ausführen — FAIL**

Run: `npx vitest run tests/lib/sumup.test.ts`

- [ ] **Step 4: SumUp Client implementieren**

```typescript
// src/lib/sumup.ts

interface CheckoutParams {
  amount: number
  description: string
  referenceId: string
}

interface CheckoutBody {
  amount: number
  currency: string
  checkout_reference: string
  merchant_code: string
  description: string
  redirect_url: string
}

export function buildCheckoutBody(params: CheckoutParams): CheckoutBody {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  return {
    amount: params.amount,
    currency: 'EUR',
    checkout_reference: params.referenceId,
    merchant_code: process.env.SUMUP_MERCHANT_CODE || '',
    description: params.description,
    redirect_url: `${baseUrl}/payment/success?ref=${params.referenceId}`,
  }
}

interface SumUpCheckoutResponse {
  id: string
  checkout_reference: string
  amount: number
  status: string
}

export async function createCheckout(params: CheckoutParams): Promise<SumUpCheckoutResponse> {
  const apiKey = process.env.SUMUP_API_KEY
  if (!apiKey) {
    throw new Error('SUMUP_API_KEY nicht konfiguriert')
  }

  const body = buildCheckoutBody(params)

  const res = await fetch('https://api.sumup.com/v0.1/checkouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`SumUp API Fehler: ${res.status} ${error}`)
  }

  return res.json()
}

export async function getCheckoutStatus(checkoutId: string): Promise<SumUpCheckoutResponse> {
  const apiKey = process.env.SUMUP_API_KEY
  if (!apiKey) {
    throw new Error('SUMUP_API_KEY nicht konfiguriert')
  }

  const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!res.ok) {
    throw new Error(`SumUp API Fehler: ${res.status}`)
  }

  return res.json()
}
```

- [ ] **Step 5: Tests ausführen — PASS**

Run: `npx vitest run tests/lib/sumup.test.ts`

Expected: 2 tests passing.

- [ ] **Step 6: `.env.example` ergänzen**

Hinzufügen:
```env
# SumUp Payment
SUMUP_API_KEY="your-sumup-api-key"
SUMUP_MERCHANT_CODE="your-merchant-code"
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/validations/kurs.ts src/lib/sumup.ts tests/lib/sumup.test.ts .env.example
git commit -m "feat: SumUp client, Zod schemas for Kurs-System"
```

---

### Task 3: Kurs-API Endpunkte

**Files:**
- Create: `src/app/api/v1/kurse/route.ts`
- Create: `src/app/api/v1/kurse/[slug]/buchen/route.ts`
- Create: `src/app/api/v1/kurse/[slug]/zehnerkarte/route.ts`
- Create: `src/app/api/v1/kursbuchungen/route.ts`
- Create: `src/app/api/v1/kursbuchungen/[id]/anwesenheit/route.ts`
- Create: `src/app/api/v1/zehnerkarten/[id]/route.ts`

- [ ] **Step 1: GET alle Kurse mit Verfügbarkeit**

```typescript
// src/app/api/v1/kurse/route.ts
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET() {
  try {
    const kurse = await prisma.sparte.findMany({
      where: { typ: 'KURS', isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        trainingszeiten: { orderBy: { wochentag: 'asc' } },
        ansprechpartner: true,
        _count: {
          select: {
            kursBuchungen: {
              where: { anwesenheit: { not: 'STORNIERT' } },
            },
          },
        },
      },
    })

    const result = kurse.map((k) => ({
      ...k,
      freiePlaetze: k.maxTeilnehmer ? k.maxTeilnehmer - k._count.kursBuchungen : null,
    }))

    return apiSuccess(result)
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 2: POST Kursbuchung (Einzeltermin)**

```typescript
// src/app/api/v1/kurse/[slug]/buchen/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, ValidationError } from '@/lib/api-error'
import { kursBuchungSchema } from '@/lib/validations/kurs'
import { createCheckout } from '@/lib/sumup'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const kurs = await prisma.sparte.findUnique({ where: { slug } })

    if (!kurs || kurs.typ !== 'KURS') throw new NotFoundError('Kurs')

    const body = await req.json()
    const parsed = kursBuchungSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const d = parsed.data

    // Wenn 10er-Karte angegeben: Einheit abbuchen statt bezahlen
    if (d.zehnerkarteId) {
      const karte = await prisma.zehnerkarte.findUnique({ where: { id: d.zehnerkarteId } })
      if (!karte || karte.sparteId !== kurs.id) {
        throw new ValidationError('Ungültige 10er-Karte')
      }
      if (karte.verbleibend <= 0) {
        throw new ValidationError('10er-Karte ist aufgebraucht')
      }
      if (karte.gueltigBis < new Date()) {
        throw new ValidationError('10er-Karte ist abgelaufen')
      }

      const [buchung] = await prisma.$transaction([
        prisma.kursBuchung.create({
          data: {
            sparteId: kurs.id,
            teilnehmerName: d.teilnehmerName,
            teilnehmerEmail: d.teilnehmerEmail,
            datum: new Date(d.datum),
            zehnerkarteId: karte.id,
          },
        }),
        prisma.zehnerkarte.update({
          where: { id: karte.id },
          data: { verbleibend: { decrement: 1 } },
        }),
      ])

      return apiSuccess({ id: buchung.id, type: 'zehnerkarte' }, 201)
    }

    // Einzelbuchung mit Zahlung
    if (!kurs.preis || kurs.preis <= 0) {
      // Kostenloser Kurs: direkt buchen
      const buchung = await prisma.kursBuchung.create({
        data: {
          sparteId: kurs.id,
          teilnehmerName: d.teilnehmerName,
          teilnehmerEmail: d.teilnehmerEmail,
          datum: new Date(d.datum),
        },
      })
      return apiSuccess({ id: buchung.id, type: 'kostenlos' }, 201)
    }

    // SumUp Checkout für Einzelbuchung
    const zahlung = await prisma.zahlung.create({
      data: {
        betrag: kurs.preis,
        typ: 'EINZELBUCHUNG',
        status: 'AUSSTEHEND',
      },
    })

    const buchung = await prisma.kursBuchung.create({
      data: {
        sparteId: kurs.id,
        teilnehmerName: d.teilnehmerName,
        teilnehmerEmail: d.teilnehmerEmail,
        datum: new Date(d.datum),
        zahlungId: zahlung.id,
      },
    })

    try {
      const checkout = await createCheckout({
        amount: kurs.preis,
        description: `${kurs.name} am ${d.datum}`,
        referenceId: zahlung.id,
      })

      await prisma.zahlung.update({
        where: { id: zahlung.id },
        data: { sumupCheckoutId: checkout.id },
      })

      return apiSuccess({ id: buchung.id, type: 'payment', checkoutUrl: `https://pay.sumup.com/b2c/Q${checkout.id}` }, 201)
    } catch {
      // SumUp nicht konfiguriert — Buchung trotzdem erstellen
      return apiSuccess({ id: buchung.id, type: 'pending_payment' }, 201)
    }
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 3: POST 10er-Karte kaufen**

```typescript
// src/app/api/v1/kurse/[slug]/zehnerkarte/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, ValidationError } from '@/lib/api-error'
import { zehnerkarteKaufSchema } from '@/lib/validations/kurs'
import { createCheckout } from '@/lib/sumup'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const kurs = await prisma.sparte.findUnique({ where: { slug } })

    if (!kurs || kurs.typ !== 'KURS') throw new NotFoundError('Kurs')
    if (!kurs.preisZehnerkarte || kurs.preisZehnerkarte <= 0) {
      throw new ValidationError('Für diesen Kurs sind keine 10er-Karten verfügbar')
    }

    const body = await req.json()
    const parsed = zehnerkarteKaufSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const d = parsed.data

    // Gültig für 6 Monate
    const gueltigBis = new Date()
    gueltigBis.setMonth(gueltigBis.getMonth() + 6)

    const zahlung = await prisma.zahlung.create({
      data: {
        betrag: kurs.preisZehnerkarte,
        typ: 'ZEHNERKARTE',
        status: 'AUSSTEHEND',
      },
    })

    const karte = await prisma.zehnerkarte.create({
      data: {
        sparteId: kurs.id,
        kaeuferName: d.kaeuferName,
        kaeuferEmail: d.kaeuferEmail,
        preis: kurs.preisZehnerkarte,
        gueltigBis,
        zahlungId: zahlung.id,
      },
    })

    try {
      const checkout = await createCheckout({
        amount: kurs.preisZehnerkarte,
        description: `10er-Karte ${kurs.name}`,
        referenceId: zahlung.id,
      })

      await prisma.zahlung.update({
        where: { id: zahlung.id },
        data: { sumupCheckoutId: checkout.id },
      })

      return apiSuccess({ id: karte.id, type: 'payment', checkoutUrl: `https://pay.sumup.com/b2c/Q${checkout.id}` }, 201)
    } catch {
      // SumUp nicht konfiguriert
      return apiSuccess({ id: karte.id, type: 'pending_payment' }, 201)
    }
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 4: GET Buchungen (Kursleiter) + PATCH Anwesenheit**

```typescript
// src/app/api/v1/kursbuchungen/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { UnauthorizedError, ForbiddenError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const url = new URL(req.url)
    const sparteId = url.searchParams.get('sparte')
    const datum = url.searchParams.get('datum')

    const where: Record<string, unknown> = {}

    if (user.role !== 'ADMIN') {
      if (!user.sparteId) throw new ForbiddenError()
      where.sparteId = user.sparteId
    } else if (sparteId) {
      where.sparteId = sparteId
    }

    if (datum) {
      const d = new Date(datum)
      const nextDay = new Date(d)
      nextDay.setDate(nextDay.getDate() + 1)
      where.datum = { gte: d, lt: nextDay }
    }

    const buchungen = await prisma.kursBuchung.findMany({
      where,
      include: {
        sparte: { select: { name: true } },
        zehnerkarte: { select: { id: true, verbleibend: true } },
        zahlung: { select: { status: true } },
      },
      orderBy: [{ datum: 'desc' }, { createdAt: 'desc' }],
    })

    return apiSuccess(buchungen)
  } catch (err) {
    return apiError(err)
  }
}
```

```typescript
// src/app/api/v1/kursbuchungen/[id]/anwesenheit/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'
import { anwesenheitSchema } from '@/lib/validations/kurs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const { id } = await params
    const buchung = await prisma.kursBuchung.findUnique({ where: { id } })
    if (!buchung) throw new NotFoundError('Kursbuchung')

    if (user.role !== 'ADMIN' && user.sparteId !== buchung.sparteId) {
      throw new ForbiddenError()
    }

    const body = await req.json()
    const parsed = anwesenheitSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Ungültiger Status')
    }

    // Wenn storniert und 10er-Karte: Einheit zurückgeben
    if (parsed.data.anwesenheit === 'STORNIERT' && buchung.zehnerkarteId && buchung.anwesenheit !== 'STORNIERT') {
      await prisma.zehnerkarte.update({
        where: { id: buchung.zehnerkarteId },
        data: { verbleibend: { increment: 1 } },
      })
    }

    const updated = await prisma.kursBuchung.update({
      where: { id },
      data: { anwesenheit: parsed.data.anwesenheit },
    })

    return apiSuccess(updated)
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 5: GET 10er-Karte Detail**

```typescript
// src/app/api/v1/zehnerkarten/[id]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError } from '@/lib/api-error'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const karte = await prisma.zehnerkarte.findUnique({
      where: { id },
      include: {
        sparte: { select: { name: true, slug: true } },
        buchungen: {
          orderBy: { datum: 'desc' },
          select: { id: true, datum: true, anwesenheit: true },
        },
        zahlung: { select: { status: true } },
      },
    })

    if (!karte) throw new NotFoundError('10er-Karte')

    return apiSuccess(karte)
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 6: SumUp Webhook**

```typescript
// src/app/api/v1/payment/webhook/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // SumUp sends: { id, checkout_reference, status, transaction_code, amount }
    const { checkout_reference, status, transaction_code } = body

    if (!checkout_reference) {
      return apiSuccess({ received: true })
    }

    const zahlung = await prisma.zahlung.findFirst({
      where: { id: checkout_reference },
    })

    if (!zahlung) {
      return apiSuccess({ received: true })
    }

    const newStatus = status === 'PAID' ? 'BEZAHLT' : status === 'FAILED' ? 'FEHLGESCHLAGEN' : 'AUSSTEHEND'

    await prisma.zahlung.update({
      where: { id: zahlung.id },
      data: {
        status: newStatus as 'AUSSTEHEND' | 'BEZAHLT' | 'FEHLGESCHLAGEN',
        sumupTxCode: transaction_code || null,
      },
    })

    return apiSuccess({ received: true })
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/api/v1/kurse/ src/app/api/v1/kursbuchungen/ src/app/api/v1/zehnerkarten/ src/app/api/v1/payment/
git commit -m "feat: Kurs-System API (Buchung, 10er-Karten, Anwesenheit, SumUp)"
```

---

### Task 4: Öffentliche Kursseite mit Buchungsoptionen

**Files:**
- Create: `src/components/kurse/kurs-buchung-card.tsx`
- Create: `src/components/kurse/zehnerkarte-status.tsx`
- Create: `src/app/kurse/[slug]/page.tsx`

- [ ] **Step 1: Buchungs-Card Komponente**

```tsx
// src/components/kurse/kurs-buchung-card.tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface KursBuchungCardProps {
  kursSlug: string
  kursName: string
  preis: number | null
  preisZehnerkarte: number | null
  freiePlaetze: number | null
}

export function KursBuchungCard({ kursSlug, kursName, preis, preisZehnerkarte, freiePlaetze }: KursBuchungCardProps) {
  const [mode, setMode] = useState<'auswahl' | 'einzeln' | 'zehnerkarte' | 'success'>('auswahl')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [datum, setDatum] = useState('')
  const [zehnerkarteId, setZehnerkarteId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ type: string; checkoutUrl?: string } | null>(null)

  async function buchungAbsenden() {
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/kurse/${kursSlug}/buchen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teilnehmerName: name,
          teilnehmerEmail: email,
          datum,
          ...(zehnerkarteId && { zehnerkarteId }),
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error?.message || 'Fehler bei der Buchung')
        return
      }

      const body = await res.json()
      setResult(body.data)

      if (body.data.checkoutUrl) {
        window.location.href = body.data.checkoutUrl
      } else {
        setMode('success')
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setSubmitting(false)
    }
  }

  async function zehnerkarteKaufen() {
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/kurse/${kursSlug}/zehnerkarte`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kaeuferName: name, kaeuferEmail: email }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error?.message || 'Fehler beim Kauf')
        return
      }

      const body = await res.json()
      if (body.data.checkoutUrl) {
        window.location.href = body.data.checkoutUrl
      } else {
        setMode('success')
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setSubmitting(false)
    }
  }

  if (mode === 'success') {
    return (
      <div className="bg-white p-6 rounded-lg border border-border text-center">
        <div className="text-4xl mb-3">✓</div>
        <h3 className="font-heading text-h3 text-text-heading mb-2">
          {result?.type === 'zehnerkarte' ? 'Mit 10er-Karte gebucht!' : 'Buchung erfolgreich!'}
        </h3>
        <p className="text-text-body text-sm">Bestätigung wird an {email} gesendet.</p>
      </div>
    )
  }

  if (mode === 'auswahl') {
    return (
      <div className="bg-white p-6 rounded-lg border border-border space-y-4">
        <h3 className="font-heading text-h3 text-text-heading">Jetzt buchen</h3>

        {freiePlaetze !== null && (
          <p className={`text-sm ${freiePlaetze > 3 ? 'text-success' : freiePlaetze > 0 ? 'text-warning' : 'text-error'}`}>
            {freiePlaetze > 0 ? `${freiePlaetze} freie Plätze` : 'Ausgebucht'}
          </p>
        )}

        <div className="space-y-2">
          {preis !== null && preis > 0 && (
            <button
              onClick={() => setMode('einzeln')}
              className="w-full p-4 rounded-md border border-border hover:border-primary text-left transition-colors"
            >
              <span className="font-medium text-text-heading">Einzeltermin buchen</span>
              <span className="block text-sm text-text-body">{preis.toFixed(2)} € pro Termin</span>
            </button>
          )}

          {preis !== null && preis === 0 && (
            <button
              onClick={() => setMode('einzeln')}
              className="w-full p-4 rounded-md border border-border hover:border-primary text-left transition-colors"
            >
              <span className="font-medium text-text-heading">Termin buchen</span>
              <span className="block text-sm text-text-body">Kostenlos</span>
            </button>
          )}

          {preisZehnerkarte !== null && preisZehnerkarte > 0 && (
            <button
              onClick={() => setMode('zehnerkarte')}
              className="w-full p-4 rounded-md border border-border hover:border-primary text-left transition-colors"
            >
              <span className="font-medium text-text-heading">10er-Karte kaufen</span>
              <span className="block text-sm text-text-body">{preisZehnerkarte.toFixed(2)} € — 6 Monate gültig</span>
            </button>
          )}
        </div>

        {/* 10er-Karte einlösen */}
        <div className="pt-2 border-t border-border-light">
          <p className="text-sm text-text-body mb-2">Bereits eine 10er-Karte?</p>
          <div className="flex gap-2">
            <Input
              label=""
              value={zehnerkarteId}
              onChange={(e) => setZehnerkarteId(e.target.value)}
              placeholder="10er-Karten-ID"
              className="text-sm"
            />
            <Button
              variant="outline"
              className="text-sm shrink-0"
              onClick={() => { if (zehnerkarteId) setMode('einzeln') }}
              disabled={!zehnerkarteId}
            >
              Einlösen
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-border space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-h3 text-text-heading">
          {mode === 'zehnerkarte' ? '10er-Karte kaufen' : 'Termin buchen'}
        </h3>
        <button onClick={() => setMode('auswahl')} className="text-sm text-text-body hover:text-primary">← Zurück</button>
      </div>

      {error && <div className="p-2 bg-red-50 text-error rounded text-sm">{error}</div>}

      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="E-Mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

      {mode === 'einzeln' && (
        <Input label="Datum" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} required />
      )}

      <Button
        className="w-full"
        onClick={mode === 'zehnerkarte' ? zehnerkarteKaufen : buchungAbsenden}
        disabled={submitting || !name || !email || (mode === 'einzeln' && !datum)}
      >
        {submitting ? 'Wird verarbeitet...' :
          mode === 'zehnerkarte' ? `10er-Karte kaufen (${preisZehnerkarte?.toFixed(2)} €)` :
          zehnerkarteId ? 'Mit 10er-Karte buchen' :
          preis && preis > 0 ? `Buchen & Bezahlen (${preis.toFixed(2)} €)` :
          'Kostenlos buchen'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: 10er-Karten-Status Komponente**

```tsx
// src/components/kurse/zehnerkarte-status.tsx
interface ZehnerkarteStatusProps {
  verbleibend: number
  gueltigBis: string
  kursName: string
}

export function ZehnerkarteStatus({ verbleibend, gueltigBis, kursName }: ZehnerkarteStatusProps) {
  const abgelaufen = new Date(gueltigBis) < new Date()

  return (
    <div className={`p-4 rounded-lg border ${abgelaufen ? 'border-error bg-red-50' : 'border-border bg-white'}`}>
      <p className="font-medium text-text-heading">{kursName} — 10er-Karte</p>
      <div className="flex items-center gap-4 mt-2">
        <div>
          <span className={`text-2xl font-bold ${verbleibend > 2 ? 'text-success' : verbleibend > 0 ? 'text-warning' : 'text-error'}`}>
            {verbleibend}
          </span>
          <span className="text-sm text-text-body"> / 10 übrig</span>
        </div>
        <div className="text-sm text-text-body">
          {abgelaufen ? (
            <span className="text-error">Abgelaufen</span>
          ) : (
            <>Gültig bis {new Date(gueltigBis).toLocaleDateString('de-DE')}</>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-2 bg-border-light rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${verbleibend > 2 ? 'bg-success' : verbleibend > 0 ? 'bg-warning' : 'bg-error'}`}
          style={{ width: `${(verbleibend / 10) * 100}%` }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Öffentliche Kursseite**

```tsx
// src/app/kurse/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Container } from '@/components/layout/container'
import { TrainingszeitenDisplay } from '@/components/sparten/trainingszeiten-display'
import { AnsprechpartnerDisplay } from '@/components/sparten/ansprechpartner-display'
import { KursBuchungCard } from '@/components/kurse/kurs-buchung-card'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const kurs = await prisma.sparte.findUnique({ where: { slug }, select: { name: true } })
  if (!kurs) return { title: 'Nicht gefunden' }
  return { title: kurs.name }
}

export default async function KursPage({ params }: Props) {
  const { slug } = await params

  const kurs = await prisma.sparte.findUnique({
    where: { slug },
    include: {
      trainingszeiten: { orderBy: { wochentag: 'asc' } },
      ansprechpartner: true,
      bilder: { orderBy: { sortOrder: 'asc' } },
      _count: {
        select: {
          kursBuchungen: { where: { anwesenheit: { not: 'STORNIERT' } } },
        },
      },
    },
  })

  if (!kurs || kurs.typ !== 'KURS' || !kurs.isActive) notFound()

  const freiePlaetze = kurs.maxTeilnehmer ? kurs.maxTeilnehmer - kurs._count.kursBuchungen : null

  return (
    <section className="py-8 tablet:py-12">
      <Container>
        <div className="grid grid-cols-1 tablet:grid-cols-3 gap-8">
          {/* Main */}
          <div className="tablet:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="font-heading text-h1 text-text-heading">{kurs.name}</h1>
              <span className="text-sm bg-primary-light text-primary px-3 py-1 rounded-full">Kurs</span>
            </div>

            {kurs.beschreibung && (
              <div
                className="prose prose-sm max-w-none text-text-body mb-8"
                dangerouslySetInnerHTML={{ __html: kurs.beschreibung }}
              />
            )}

            {/* Preisinfo */}
            {(kurs.preis !== null || kurs.preisZehnerkarte !== null) && (
              <div className="bg-section-alt p-4 rounded-lg mb-8">
                <h3 className="font-heading text-h3 text-text-heading mb-2">Preise</h3>
                <div className="space-y-1 text-text-body">
                  {kurs.preis !== null && (
                    <p>Einzeltermin: <strong>{kurs.preis === 0 ? 'Kostenlos' : `${kurs.preis.toFixed(2)} €`}</strong></p>
                  )}
                  {kurs.preisZehnerkarte !== null && kurs.preisZehnerkarte > 0 && (
                    <p>10er-Karte: <strong>{kurs.preisZehnerkarte.toFixed(2)} €</strong> (6 Monate gültig)</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <KursBuchungCard
              kursSlug={kurs.slug}
              kursName={kurs.name}
              preis={kurs.preis}
              preisZehnerkarte={kurs.preisZehnerkarte}
              freiePlaetze={freiePlaetze}
            />
            <TrainingszeitenDisplay trainingszeiten={kurs.trainingszeiten} />
            <AnsprechpartnerDisplay ansprechpartner={kurs.ansprechpartner} />
          </div>
        </div>
      </Container>
    </section>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/kurse/ src/app/kurse/
git commit -m "feat: public Kurs page with booking, 10er-Karten, SumUp payment"
```

---

### Task 5: Admin — Kursleiter-Dashboard

**Files:**
- Modify: `src/components/admin/sidebar.tsx`
- Create: `src/components/admin/kurs-teilnehmer.tsx`
- Create: `src/app/admin/kurse/page.tsx`
- Create: `src/app/admin/kurse/[id]/page.tsx`

- [ ] **Step 1: Sidebar erweitern**

In `src/components/admin/sidebar.tsx`:

Zu `ADMIN_ITEMS` hinzufügen (nach Termine):
```typescript
{ href: '/admin/kurse', label: 'Kurse' },
```

Zu `LEITER_ITEMS` hinzufügen (nach Termine):
```typescript
{ href: '/admin/kurse', label: 'Teilnehmer' },
```

- [ ] **Step 2: Teilnehmer-Komponente mit Anwesenheit**

```tsx
// src/components/admin/kurs-teilnehmer.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Buchung {
  id: string
  teilnehmerName: string
  teilnehmerEmail: string
  datum: string
  anwesenheit: string
  zehnerkarte: { id: string; verbleibend: number } | null
  zahlung: { status: string } | null
  sparte: { name: string }
}

const ANWESENHEIT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  GEBUCHT: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Gebucht' },
  ANWESEND: { bg: 'bg-green-100', text: 'text-green-800', label: 'Anwesend' },
  ABWESEND: { bg: 'bg-red-100', text: 'text-red-800', label: 'Abwesend' },
  STORNIERT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Storniert' },
}

interface Props {
  sparteId?: string
}

export function KursTeilnehmer({ sparteId }: Props) {
  const [buchungen, setBuchungen] = useState<Buchung[]>([])
  const [datumFilter, setDatumFilter] = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (sparteId) params.set('sparte', sparteId)
    if (datumFilter) params.set('datum', datumFilter)

    const res = await fetch(`/api/v1/kursbuchungen?${params}`)
    if (res.ok) {
      const body = await res.json()
      setBuchungen(body.data || [])
    }
    setLoading(false)
  }, [sparteId, datumFilter])

  useEffect(() => { fetch_() }, [fetch_])

  async function setAnwesenheit(buchungId: string, status: string) {
    await fetch(`/api/v1/kursbuchungen/${buchungId}/anwesenheit`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anwesenheit: status }),
    })
    fetch_()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <Input
          label="Datum"
          type="date"
          value={datumFilter}
          onChange={(e) => setDatumFilter(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-section-alt">
              <th className="text-left p-3 font-medium text-text-heading">Name</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">E-Mail</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Bezahlung</th>
              <th className="text-left p-3 font-medium text-text-heading">Anwesenheit</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-body">Laden...</td></tr>
            ) : buchungen.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-body">Keine Buchungen für dieses Datum.</td></tr>
            ) : (
              buchungen.map((b) => {
                const style = ANWESENHEIT_STYLES[b.anwesenheit] || ANWESENHEIT_STYLES.GEBUCHT
                return (
                  <tr key={b.id} className="border-b border-border-light">
                    <td className="p-3">
                      <div className="font-medium text-text-heading">{b.teilnehmerName}</div>
                    </td>
                    <td className="p-3 hidden tablet:table-cell text-text-body">{b.teilnehmerEmail}</td>
                    <td className="p-3 hidden tablet:table-cell text-text-body text-xs">
                      {b.zehnerkarte ? `10er-Karte (${b.zehnerkarte.verbleibend} übrig)` :
                       b.zahlung ? (b.zahlung.status === 'BEZAHLT' ? 'Bezahlt' : 'Ausstehend') :
                       'Kostenlos'}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{style.label}</span>
                    </td>
                    <td className="p-3">
                      {b.anwesenheit !== 'STORNIERT' && (
                        <div className="flex gap-1">
                          {b.anwesenheit !== 'ANWESEND' && (
                            <button onClick={() => setAnwesenheit(b.id, 'ANWESEND')} className="text-xs text-success hover:underline min-h-[36px] px-1">✓</button>
                          )}
                          {b.anwesenheit !== 'ABWESEND' && (
                            <button onClick={() => setAnwesenheit(b.id, 'ABWESEND')} className="text-xs text-error hover:underline min-h-[36px] px-1">✗</button>
                          )}
                          <button onClick={() => setAnwesenheit(b.id, 'STORNIERT')} className="text-xs text-text-body hover:underline min-h-[36px] px-1">Storno</button>
                        </div>
                      )}
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

- [ ] **Step 3: Admin Kurse-Seite**

```tsx
// src/app/admin/kurse/page.tsx
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function AdminKursePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Kursleiter: direkt zu ihrem Kurs
  if (session.user.role !== 'ADMIN' && session.user.sparteId) {
    const kurs = await prisma.sparte.findFirst({
      where: { id: session.user.sparteId, typ: 'KURS' },
    })
    if (kurs) redirect(`/admin/kurse/${kurs.id}`)
  }

  const kurse = await prisma.sparte.findMany({
    where: { typ: 'KURS' },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          kursBuchungen: { where: { anwesenheit: { not: 'STORNIERT' } } },
          zehnerkarten: true,
        },
      },
    },
  })

  return (
    <div>
      <h1 className="font-heading text-h1 text-text-heading mb-6">Kurse</h1>

      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-section-alt">
              <th className="text-left p-3 font-medium text-text-heading">Kurs</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Preis</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Buchungen</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">10er-Karten</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {kurse.map((k) => (
              <tr key={k.id} className="border-b border-border-light hover:bg-section-alt">
                <td className="p-3 font-medium text-text-heading">{k.name}</td>
                <td className="p-3 hidden tablet:table-cell text-text-body">
                  {k.preis ? `${k.preis.toFixed(2)} €` : '—'}
                </td>
                <td className="p-3 hidden tablet:table-cell text-text-body">{k._count.kursBuchungen}</td>
                <td className="p-3 hidden tablet:table-cell text-text-body">{k._count.zehnerkarten}</td>
                <td className="p-3">
                  <Link href={`/admin/kurse/${k.id}`} className="text-primary hover:text-primary-hover text-sm">
                    Teilnehmer
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Kurs-Detail mit Teilnehmerliste**

```tsx
// src/app/admin/kurse/[id]/page.tsx
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { KursTeilnehmer } from '@/components/admin/kurs-teilnehmer'

export default async function KursDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params
  const kurs = await prisma.sparte.findUnique({ where: { id } })
  if (!kurs || kurs.typ !== 'KURS') notFound()

  if (session.user.role !== 'ADMIN' && session.user.sparteId !== kurs.id) {
    redirect('/admin/kurse')
  }

  return (
    <div>
      {session.user.role === 'ADMIN' && (
        <Link href="/admin/kurse" className="text-sm text-primary hover:text-primary-hover mb-4 inline-block">
          ← Zurück zur Übersicht
        </Link>
      )}
      <h1 className="font-heading text-h1 text-text-heading mb-6">{kurs.name} — Teilnehmer</h1>
      <KursTeilnehmer sparteId={kurs.id} />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/sidebar.tsx src/components/admin/kurs-teilnehmer.tsx src/app/admin/kurse/
git commit -m "feat: admin Kursleiter dashboard with attendance tracking"
```

---

### Task 6: Kurs-Einstellungen im Sparte-Editor

**Files:**
- Modify: `src/app/admin/sparten/[id]/page.tsx`

- [ ] **Step 1: Kurs-Einstellungen Komponente erstellen**

```tsx
// src/components/admin/kurs-einstellungen.tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props {
  sparteSlug: string
  initial: {
    maxTeilnehmer: number | null
    preis: number | null
    preisZehnerkarte: number | null
  }
}

export function KursEinstellungen({ sparteSlug, initial }: Props) {
  const [maxTeilnehmer, setMaxTeilnehmer] = useState(initial.maxTeilnehmer?.toString() || '')
  const [preis, setPreis] = useState(initial.preis?.toString() || '')
  const [preisZehnerkarte, setPreisZehnerkarte] = useState(initial.preisZehnerkarte?.toString() || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/v1/sparten/${sparteSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxTeilnehmer: maxTeilnehmer ? parseInt(maxTeilnehmer) : null,
          preis: preis ? parseFloat(preis) : null,
          preisZehnerkarte: preisZehnerkarte ? parseFloat(preisZehnerkarte) : null,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-h3 text-text-heading">Kurs-Einstellungen</h3>
      <Input
        label="Max. Teilnehmer"
        type="number"
        value={maxTeilnehmer}
        onChange={(e) => setMaxTeilnehmer(e.target.value)}
        hint="Leer lassen für unbegrenzt"
      />
      <Input
        label="Preis pro Einzeltermin (€)"
        type="number"
        step="0.01"
        value={preis}
        onChange={(e) => setPreis(e.target.value)}
        hint="0 = kostenlos, leer = keine Einzelbuchung"
      />
      <Input
        label="Preis 10er-Karte (€)"
        type="number"
        step="0.01"
        value={preisZehnerkarte}
        onChange={(e) => setPreisZehnerkarte(e.target.value)}
        hint="Leer lassen = keine 10er-Karten"
      />
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</Button>
        {saved && <span className="text-sm text-success">Gespeichert!</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: In Sparte-Edit-Seite einbauen**

In `src/app/admin/sparten/[id]/page.tsx`: Import hinzufügen und bei Kursen die KursEinstellungen-Komponente rendern. Lese die Datei, finde den Abschnitt nach BildUpload, und ergänze:

```tsx
import { KursEinstellungen } from '@/components/admin/kurs-einstellungen'

// ... im JSX nach BildUpload, vor dem schließenden </div>:
{sparte.typ === 'KURS' && (
  <div className="bg-white p-6 rounded-lg border border-border">
    <KursEinstellungen
      sparteSlug={sparte.slug}
      initial={{
        maxTeilnehmer: sparte.maxTeilnehmer,
        preis: sparte.preis,
        preisZehnerkarte: sparte.preisZehnerkarte,
      }}
    />
  </div>
)}
```

- [ ] **Step 3: Sparte-Update-Schema erweitern**

In `src/lib/validations/sparte.ts`, `sparteUpdateSchema` um Kurs-Felder erweitern:

```typescript
export const sparteUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  beschreibung: z.string().optional(),
  typ: z.enum(['SPARTE', 'KURS']).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  maxTeilnehmer: z.number().int().min(1).nullable().optional(),
  preis: z.number().min(0).nullable().optional(),
  preisZehnerkarte: z.number().min(0).nullable().optional(),
})
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/kurs-einstellungen.tsx src/app/admin/sparten/\[id\]/page.tsx src/lib/validations/sparte.ts
git commit -m "feat: Kurs pricing and capacity settings in Sparte editor"
```

---

### Task 7: Smoke-Test Phase 6

- [ ] **Step 1: Alle Tests ausführen**

Run:
```bash
npx vitest run
```

Expected: Alle Tests grün (bisherige 45 + SumUp 2 = ~47 Tests).

- [ ] **Step 2: Dev-Server manuell testen**

Run: `npm run dev`

Teste:
1. `/admin/sparten` → Yoga bearbeiten → Kurs-Einstellungen: Preis 12€, 10er-Karte 80€, Max 15
2. `/kurse/yoga` → Kursseite mit Preisen + Buchungsoptionen
3. Einzeltermin buchen (ohne SumUp → "pending_payment")
4. 10er-Karte kaufen (ohne SumUp → "pending_payment")
5. `/admin/kurse` → Yoga → Teilnehmerliste → Anwesenheit markieren
6. Storno: Gibt 10er-Karten-Einheit zurück

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: Phase 6 complete — Kurs-System with 10er-Karten and SumUp"
```

---

## Summary

| Task | Was | Tests |
|---|---|---|
| 1 | Prisma Schema (Zehnerkarte, KursBuchung, Zahlung) | — |
| 2 | Zod-Schemas + SumUp Client | 2 Tests |
| 3 | Kurs-API (Buchung, 10er-Karten, Anwesenheit, Webhook) | — |
| 4 | Öffentliche Kursseite mit Buchung | — |
| 5 | Admin: Kursleiter-Dashboard + Anwesenheit | — |
| 6 | Kurs-Einstellungen im Sparte-Editor | — |
| 7 | Smoke-Test | ~47 Tests total |

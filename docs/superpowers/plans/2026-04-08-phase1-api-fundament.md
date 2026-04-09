# Phase 1: API-Fundament + Basis-UI — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lauffähige Next.js-App mit Auth, API-Grundgerüst, Prisma-Schema, Verschlüsselungsmodul, Basis-Layout und statischen Seiten — bereit für Phase 2 (Mitgliedsantrag).

**Architecture:** Next.js 15 App Router als Full-Stack-Framework. API Route Handlers unter `/api/v1/` mit Zod-Validierung und einheitlichem Error-Handling. PostgreSQL via Prisma ORM. Dual-Auth: NextAuth v5 Sessions (Web) + JWT Bearer Tokens (App). AES-256-GCM Verschlüsselung auf Application-Level für sensible Felder.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, Prisma 6, PostgreSQL 16, NextAuth v5, Zod, Vitest, Docker

---

## File Structure

```
sg-website/
├── .env.example                    # Template für Environment-Variablen
├── .env.local                      # Lokale Entwicklung (gitignored)
├── .gitignore
├── docker-compose.yml              # PostgreSQL + App
├── Dockerfile                      # Multi-stage Next.js Build
├── next.config.ts                  # Next.js Config
├── package.json
├── postcss.config.ts
├── tailwind.config.ts              # Mobile-First + Vereinsfarben
├── tsconfig.json
├── vitest.config.ts                # Test-Config
├── prisma/
│   ├── schema.prisma               # Komplettes Datenmodell
│   └── seed.ts                     # Sparten + Admin-User + Testdaten
├── public/
│   └── logo.jpeg                   # Vereinslogo (bereits vorhanden)
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root-Layout mit Fonts + Metadata
│   │   ├── page.tsx                # Startseite
│   │   ├── globals.css             # Tailwind Imports + Custom Styles
│   │   ├── impressum/
│   │   │   └── page.tsx            # Impressum
│   │   ├── datenschutz/
│   │   │   └── page.tsx            # Datenschutzerklärung
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── route.ts    # JWT Login (App)
│   │   │   │   │   ├── refresh/
│   │   │   │   │   │   └── route.ts    # JWT Refresh (App)
│   │   │   │   │   └── me/
│   │   │   │   │       └── route.ts    # Aktueller User
│   │   │   │   └── sparten/
│   │   │   │       └── route.ts        # GET /api/v1/sparten
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts        # NextAuth Catch-All
│   │   └── (auth)/
│   │       └── login/
│   │           └── page.tsx            # Login-Seite
│   ├── components/
│   │   ├── layout/
│   │   │   ├── header.tsx          # Logo + Nav + Mobile-Menu
│   │   │   ├── footer.tsx          # Footer mit Links
│   │   │   ├── mobile-nav.tsx      # Hamburger-Menu Overlay
│   │   │   └── container.tsx       # Max-Width Container
│   │   └── ui/
│   │       └── button.tsx          # Basis-Button-Komponente
│   └── lib/
│       ├── auth.ts                 # NextAuth Config + Optionen
│       ├── jwt.ts                  # JWT Sign/Verify Helpers
│       ├── prisma.ts               # Prisma Client Singleton
│       ├── encryption.ts           # AES-256-GCM Encrypt/Decrypt
│       ├── api-response.ts         # Einheitliche API-Responses
│       ├── api-error.ts            # API Error-Klassen
│       ├── auth-middleware.ts      # Dual-Auth-Middleware (Session + JWT)
│       └── validations/
│           └── auth.ts             # Zod-Schemas für Auth
├── tests/
│   ├── lib/
│   │   ├── encryption.test.ts      # Verschlüsselungs-Tests
│   │   ├── jwt.test.ts             # JWT-Tests
│   │   ├── api-response.test.ts    # API-Response-Tests
│   │   └── api-error.test.ts       # API-Error-Tests
│   └── api/
│       ├── auth.test.ts            # Auth-Endpunkt-Tests
│       └── sparten.test.ts         # Sparten-Endpunkt-Tests
```

---

### Task 1: Projekt-Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `.gitignore`, `.env.example`, `.env.local`

- [ ] **Step 1: Next.js-Projekt erstellen**

Run:
```bash
cd /Users/sascha/Code/fsg/sg-website
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --yes
```

Expected: Projekt wird erstellt. Falls Fehler wegen existierender Dateien, `--yes` überschreibt.

- [ ] **Step 2: Zusätzliche Dependencies installieren**

Run:
```bash
npm install prisma @prisma/client next-auth@beta zod bcryptjs jsonwebtoken
npm install -D vitest @vitejs/plugin-react @types/bcryptjs @types/jsonwebtoken tsx
```

- [ ] **Step 3: `.env.example` erstellen**

```env
# Datenbank
DATABASE_URL="postgresql://sg_user:sg_password@localhost:5432/sg_website?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# JWT (App-Auth)
JWT_SECRET="generate-with-openssl-rand-base64-32"
JWT_REFRESH_SECRET="generate-with-openssl-rand-base64-32"

# Verschlüsselung
IBAN_ENCRYPTION_KEY="generate-with-node-crypto-randomBytes-32-hex"
```

- [ ] **Step 4: `.env.local` aus `.env.example` erstellen**

Run:
```bash
cp .env.example .env.local
```

Dann die Werte generieren und einsetzen:
```bash
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo "IBAN_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
```

Die generierten Werte in `.env.local` einsetzen.

- [ ] **Step 5: `.gitignore` ergänzen**

Sicherstellen, dass folgende Einträge vorhanden sind (zusätzlich zum Next.js-Standard):
```
.env.local
.env.production
.env*.local
```

- [ ] **Step 6: `vitest.config.ts` erstellen**

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 7: `package.json` Scripts ergänzen**

In `package.json` unter `"scripts"` hinzufügen:
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:seed": "tsx prisma/seed.ts",
  "db:studio": "prisma studio"
}
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: project scaffolding with Next.js 15, Tailwind, Vitest"
```

---

### Task 2: Docker + PostgreSQL

**Files:**
- Create: `docker-compose.yml`, `Dockerfile`

- [ ] **Step 1: `docker-compose.yml` erstellen**

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: sg_user
      POSTGRES_PASSWORD: sg_password
      POSTGRES_DB: sg_website
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "postgresql://sg_user:sg_password@db:5432/sg_website?schema=public"
    depends_on:
      - db
    profiles:
      - production

volumes:
  postgres_data:
```

- [ ] **Step 2: `Dockerfile` erstellen**

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

- [ ] **Step 3: `next.config.ts` für Docker anpassen**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
}

export default nextConfig
```

- [ ] **Step 4: PostgreSQL starten und Verbindung testen**

Run:
```bash
docker compose up -d db
```

Expected: PostgreSQL Container läuft auf Port 5432.

Run:
```bash
docker compose exec db psql -U sg_user -d sg_website -c "SELECT 1"
```

Expected: Gibt `1` zurück.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml Dockerfile next.config.ts
git commit -m "feat: Docker setup with PostgreSQL 16 and multi-stage build"
```

---

### Task 3: Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Prisma initialisieren**

Run:
```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Komplettes Schema schreiben**

Datei `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// === AUTH ===

enum UserRole {
  ADMIN
  SPARTENLEITER
  KURSLEITER
}

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  passwordHash   String
  name           String
  role           UserRole  @default(SPARTENLEITER)
  sparteId       String?
  sparte         Sparte?   @relation(fields: [sparteId], references: [id])
  refreshTokens  RefreshToken[]
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

// === SPARTEN ===

enum SparteTyp {
  SPARTE
  KURS
}

model Sparte {
  id              String    @id @default(cuid())
  name            String
  slug            String    @unique
  beschreibung    String?   @db.Text
  typ             SparteTyp @default(SPARTE)
  isActive        Boolean   @default(true)
  sortOrder       Int       @default(0)

  trainingszeiten Trainingszeit[]
  ansprechpartner Ansprechpartner[]
  bilder          SparteBild[]
  termine         Termin[]
  beitraege       Beitrag[]
  mitgliedsantraege Mitgliedsantrag[]
  leiter          User[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Trainingszeit {
  id        String  @id @default(cuid())
  sparteId  String
  sparte    Sparte  @relation(fields: [sparteId], references: [id], onDelete: Cascade)
  wochentag Int     // 0=Mo, 1=Di, ..., 6=So
  startzeit String  // "18:00"
  endzeit   String  // "20:00"
  ort       String?
  hinweis   String?
}

model Ansprechpartner {
  id       String  @id @default(cuid())
  sparteId String
  sparte   Sparte  @relation(fields: [sparteId], references: [id], onDelete: Cascade)
  name     String
  rolle    String? // z.B. "Spartenleiter", "Trainer"
  telefon  String?
  email    String?
}

model SparteBild {
  id       String  @id @default(cuid())
  sparteId String
  sparte   Sparte  @relation(fields: [sparteId], references: [id], onDelete: Cascade)
  url      String
  alt      String?
  sortOrder Int    @default(0)
}

// === MITGLIEDSANTRÄGE ===

enum AntragStatus {
  EINGEGANGEN
  IN_BEARBEITUNG
  ABGESCHLOSSEN
  EXPORTIERT
  ABGELEHNT
}

model Mitgliedsantrag {
  id                    String       @id @default(cuid())
  status                AntragStatus @default(EINGEGANGEN)

  // Persönliche Daten
  nachname              String
  vorname               String
  strasse               String
  plz                   String
  ort                   String
  telefon               String?
  email                 String
  geburtsdatum          DateTime
  geschlecht            String
  erziehungsberechtigter String?

  // Spartenwahl
  eintrittsdatum        DateTime
  sparteId              String
  sparte                Sparte       @relation(fields: [sparteId], references: [id])

  // SEPA (verschlüsselt)
  ibanEncrypted         String
  ibanLast4             String
  kontoinhaberEncrypted String
  kreditinstitut        String

  // Signaturen (verschlüsselt)
  signaturMitgliedEncrypted  String?  @db.Text
  signaturSepaEncrypted      String?  @db.Text
  signaturErzBerechEncrypted String?  @db.Text

  // Einwilligungen
  satzungAkzeptiert     Boolean
  datenschutzAkzeptiert Boolean
  sepaAkzeptiert        Boolean

  // Meta
  ipAdresse             String?
  userAgent             String?
  createdAt             DateTime     @default(now())
  bearbeitetAm          DateTime?
  bearbeitetVon         String?
  exportiertAm          DateTime?
}

// === MITGLIED (vorbereitet, noch nicht aktiv) ===

enum MitgliedStatus {
  AKTIV
  RUHEND
  AUSGETRETEN
  ARCHIVIERT
}

model Mitglied {
  id                String         @id @default(cuid())
  mitgliedsnummer   String         @unique
  status            MitgliedStatus @default(AKTIV)

  nachname          String
  vorname           String
  strasse           String
  plz               String
  ort               String
  telefon           String?
  email             String?
  geburtsdatum      DateTime
  geschlecht        String

  ibanEncrypted         String?
  ibanLast4             String?
  kontoinhaberEncrypted String?
  kreditinstitut        String?
  mandatsreferenz       String?    @unique
  mandatsDatum          DateTime?

  eintrittsdatum    DateTime
  austrittsdatum    DateTime?
  familienverbundId String?
  istHauptzahler    Boolean    @default(false)
  ausAntragId       String?

  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
}

// === TERMINE ===

model Termin {
  id           String   @id @default(cuid())
  titel        String
  beschreibung String?  @db.Text
  startzeit    DateTime
  endzeit      DateTime?
  ort          String?
  ganztaegig   Boolean  @default(false)
  sparteId     String?
  sparte       Sparte?  @relation(fields: [sparteId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// === NEWS / BEITRÄGE ===

model Beitrag {
  id           String   @id @default(cuid())
  titel        String
  slug         String   @unique
  inhalt       String   @db.Text
  auszug       String?
  bildUrl      String?
  sparteId     String?
  sparte       Sparte?  @relation(fields: [sparteId], references: [id])
  veroeffentlicht Boolean @default(false)
  authorId     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// === VEREINSHEIM-BUCHUNG ===

enum BuchungStatus {
  ANGEFRAGT
  GENEHMIGT
  ABGELEHNT
  STORNIERT
}

model Buchung {
  id           String        @id @default(cuid())
  status       BuchungStatus @default(ANGEFRAGT)
  name         String
  email        String
  telefon      String?
  datum        DateTime
  startzeit    String
  endzeit      String
  anlass       String
  nachricht    String?       @db.Text
  bearbeitetAm DateTime?
  bearbeitetVon String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

// === SYSTEM-KONFIGURATION ===

model SystemConfig {
  key          String   @id
  value        String   @db.Text
  encrypted    Boolean  @default(false)
  description  String?
  updatedAt    DateTime @updatedAt
}
```

- [ ] **Step 3: Schema zur Datenbank pushen**

Run:
```bash
npx prisma db push
```

Expected: "Your database is now in sync with your Prisma schema."

- [ ] **Step 4: Prisma Client generieren**

Run:
```bash
npx prisma generate
```

Expected: "Generated Prisma Client"

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: complete Prisma schema with all models for phases 1-5"
```

---

### Task 4: Prisma Client Singleton

**Files:**
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Prisma Client Singleton erstellen**

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/prisma.ts
git commit -m "feat: Prisma client singleton for hot-reload safety"
```

---

### Task 5: AES-256-GCM Verschlüsselungsmodul (TDD)

**Files:**
- Create: `src/lib/encryption.ts`
- Test: `tests/lib/encryption.test.ts`

- [ ] **Step 1: Test-Datei schreiben**

```typescript
// tests/lib/encryption.test.ts
import { describe, it, expect, beforeAll } from 'vitest'

// Set test encryption key (32 bytes hex = 64 hex chars)
beforeAll(() => {
  process.env.IBAN_ENCRYPTION_KEY =
    'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2'
})

describe('encryption', () => {
  it('encrypts and decrypts an IBAN correctly', async () => {
    const { encrypt, decrypt } = await import('@/lib/encryption')
    const iban = 'DE89370400440532013000'
    const encrypted = encrypt(iban)
    expect(encrypted).not.toBe(iban)
    expect(decrypt(encrypted)).toBe(iban)
  })

  it('produces different ciphertexts for the same input (random IV)', async () => {
    const { encrypt } = await import('@/lib/encryption')
    const iban = 'DE89370400440532013000'
    const a = encrypt(iban)
    const b = encrypt(iban)
    expect(a).not.toBe(b)
  })

  it('throws on tampered ciphertext', async () => {
    const { encrypt, decrypt } = await import('@/lib/encryption')
    const encrypted = encrypt('DE89370400440532013000')
    const tampered = encrypted.slice(0, -2) + 'XX'
    expect(() => decrypt(tampered)).toThrow()
  })

  it('extracts last 4 digits correctly', async () => {
    const { extractLast4 } = await import('@/lib/encryption')
    expect(extractLast4('DE89 3704 0044 0532 0130 00')).toBe('3000')
    expect(extractLast4('DE89370400440532013000')).toBe('3000')
  })

  it('encrypts and decrypts unicode (Kontoinhaber names)', async () => {
    const { encrypt, decrypt } = await import('@/lib/encryption')
    const name = 'Müller-Lüdenscheidt'
    expect(decrypt(encrypt(name))).toBe(name)
  })

  it('encrypts and decrypts long strings (signature base64)', async () => {
    const { encrypt, decrypt } = await import('@/lib/encryption')
    const longString = 'data:image/png;base64,' + 'A'.repeat(10000)
    expect(decrypt(encrypt(longString))).toBe(longString)
  })
})
```

- [ ] **Step 2: Test ausführen — muss fehlschlagen**

Run:
```bash
npx vitest run tests/lib/encryption.test.ts
```

Expected: FAIL — module `@/lib/encryption` not found.

- [ ] **Step 3: Verschlüsselungsmodul implementieren**

```typescript
// src/lib/encryption.ts
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

function getKey(): Buffer {
  const hex = process.env.IBAN_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('IBAN_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }
  return Buffer.from(hex, 'hex')
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  // Format: base64(iv + ciphertext + authTag)
  return Buffer.concat([iv, encrypted, authTag]).toString('base64')
}

export function decrypt(encryptedData: string): string {
  const key = getKey()
  const combined = Buffer.from(encryptedData, 'base64')

  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(combined.length - TAG_LENGTH)
  const ciphertext = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  return decipher.update(ciphertext, undefined, 'utf8') + decipher.final('utf8')
}

export function extractLast4(iban: string): string {
  return iban.replace(/\s/g, '').slice(-4)
}
```

- [ ] **Step 4: Tests ausführen — müssen alle grün sein**

Run:
```bash
npx vitest run tests/lib/encryption.test.ts
```

Expected: 6 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/encryption.ts tests/lib/encryption.test.ts
git commit -m "feat: AES-256-GCM encryption module with tests"
```

---

### Task 6: JWT Helpers (TDD)

**Files:**
- Create: `src/lib/jwt.ts`
- Test: `tests/lib/jwt.test.ts`

- [ ] **Step 1: Tests schreiben**

```typescript
// tests/lib/jwt.test.ts
import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-long!!'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-chars!!'
})

describe('jwt', () => {
  it('signs and verifies an access token', async () => {
    const { signAccessToken, verifyAccessToken } = await import('@/lib/jwt')
    const payload = { userId: 'user123', role: 'ADMIN' as const }
    const token = signAccessToken(payload)
    const decoded = verifyAccessToken(token)
    expect(decoded.userId).toBe('user123')
    expect(decoded.role).toBe('ADMIN')
  })

  it('signs and verifies a refresh token', async () => {
    const { signRefreshToken, verifyRefreshToken } = await import('@/lib/jwt')
    const token = signRefreshToken('user123')
    const decoded = verifyRefreshToken(token)
    expect(decoded.userId).toBe('user123')
  })

  it('rejects an expired access token', async () => {
    const { verifyAccessToken } = await import('@/lib/jwt')
    const jwt = await import('jsonwebtoken')
    const token = jwt.default.sign(
      { userId: 'u1', role: 'ADMIN' },
      process.env.JWT_SECRET!,
      { expiresIn: '0s' }
    )
    expect(verifyAccessToken(token)).toBeNull()
  })

  it('rejects a token signed with wrong secret', async () => {
    const { verifyAccessToken } = await import('@/lib/jwt')
    const jwt = await import('jsonwebtoken')
    const token = jwt.default.sign(
      { userId: 'u1', role: 'ADMIN' },
      'wrong-secret-wrong-secret-wrong!!'
    )
    expect(verifyAccessToken(token)).toBeNull()
  })
})
```

- [ ] **Step 2: Tests ausführen — müssen fehlschlagen**

Run:
```bash
npx vitest run tests/lib/jwt.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: JWT-Modul implementieren**

```typescript
// src/lib/jwt.ts
import jwt from 'jsonwebtoken'
import type { UserRole } from '@prisma/client'

interface AccessTokenPayload {
  userId: string
  role: UserRole
}

interface RefreshTokenPayload {
  userId: string
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' })
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AccessTokenPayload
  } catch {
    return null
  }
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '30d',
  })
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET!
    ) as RefreshTokenPayload
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Tests ausführen — alle grün**

Run:
```bash
npx vitest run tests/lib/jwt.test.ts
```

Expected: 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/jwt.ts tests/lib/jwt.test.ts
git commit -m "feat: JWT sign/verify helpers with tests"
```

---

### Task 7: API Error-Handling + Response-Utilities (TDD)

**Files:**
- Create: `src/lib/api-error.ts`, `src/lib/api-response.ts`
- Test: `tests/lib/api-error.test.ts`, `tests/lib/api-response.test.ts`

- [ ] **Step 1: API-Error Tests schreiben**

```typescript
// tests/lib/api-error.test.ts
import { describe, it, expect } from 'vitest'
import { ApiError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/api-error'

describe('ApiError', () => {
  it('creates an ApiError with code and status', () => {
    const err = new ApiError('CUSTOM_ERROR', 'Something broke', 500)
    expect(err.code).toBe('CUSTOM_ERROR')
    expect(err.message).toBe('Something broke')
    expect(err.statusCode).toBe(500)
  })

  it('creates a ValidationError with details', () => {
    const details = [{ field: 'email', message: 'Ungültige E-Mail' }]
    const err = new ValidationError('Validierung fehlgeschlagen', details)
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.statusCode).toBe(400)
    expect(err.details).toEqual(details)
  })

  it('creates an UnauthorizedError', () => {
    const err = new UnauthorizedError()
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe('UNAUTHORIZED')
  })

  it('creates a ForbiddenError', () => {
    const err = new ForbiddenError()
    expect(err.statusCode).toBe(403)
    expect(err.code).toBe('FORBIDDEN')
  })

  it('creates a NotFoundError', () => {
    const err = new NotFoundError('Sparte')
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('Sparte nicht gefunden')
  })
})
```

- [ ] **Step 2: Tests ausführen — FAIL**

Run:
```bash
npx vitest run tests/lib/api-error.test.ts
```

- [ ] **Step 3: API-Error Klassen implementieren**

```typescript
// src/lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown[]
  ) {
    super(message)
    this.name = 'ApiError'
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    }
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validierung fehlgeschlagen', details?: unknown[]) {
    super('VALIDATION_ERROR', message, 400, details)
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Nicht authentifiziert') {
    super('UNAUTHORIZED', message, 401)
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Keine Berechtigung') {
    super('FORBIDDEN', message, 403)
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = 'Ressource') {
    super('NOT_FOUND', `${resource} nicht gefunden`, 404)
  }
}
```

- [ ] **Step 4: Tests ausführen — PASS**

Run:
```bash
npx vitest run tests/lib/api-error.test.ts
```

Expected: 5 tests passing.

- [ ] **Step 5: API-Response Tests schreiben**

```typescript
// tests/lib/api-response.test.ts
import { describe, it, expect } from 'vitest'
import { apiSuccess, apiPaginated, apiError } from '@/lib/api-response'
import { ValidationError } from '@/lib/api-error'

describe('apiSuccess', () => {
  it('returns a 200 JSON response', async () => {
    const res = apiSuccess({ name: 'Fußball' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual({ name: 'Fußball' })
  })

  it('accepts a custom status code', async () => {
    const res = apiSuccess({ id: '1' }, 201)
    expect(res.status).toBe(201)
  })
})

describe('apiPaginated', () => {
  it('returns paginated response with meta', async () => {
    const items = [{ id: '1' }, { id: '2' }]
    const res = apiPaginated(items, { seite: 1, limit: 20, gesamt: 50 })
    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.meta).toEqual({ seite: 1, limit: 20, gesamt: 50 })
  })
})

describe('apiError', () => {
  it('returns error response from ApiError', async () => {
    const err = new ValidationError('Feld fehlt', [
      { field: 'email', message: 'Pflichtfeld' },
    ])
    const res = apiError(err)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.details).toHaveLength(1)
  })

  it('returns 500 for unknown errors', async () => {
    const res = apiError(new Error('boom'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})
```

- [ ] **Step 6: Tests ausführen — FAIL**

Run:
```bash
npx vitest run tests/lib/api-response.test.ts
```

- [ ] **Step 7: API-Response Utilities implementieren**

```typescript
// src/lib/api-response.ts
import { NextResponse } from 'next/server'
import { ApiError } from './api-error'

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status })
}

interface PaginationMeta {
  seite: number
  limit: number
  gesamt: number
}

export function apiPaginated<T>(
  data: T[],
  meta: PaginationMeta
): NextResponse {
  return NextResponse.json({ data, meta })
}

export function apiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }

  console.error('Unhandled error:', err)
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Interner Serverfehler' } },
    { status: 500 }
  )
}
```

- [ ] **Step 8: Alle Tests ausführen — PASS**

Run:
```bash
npx vitest run tests/lib/api-response.test.ts
```

Expected: 4 tests passing.

- [ ] **Step 9: Commit**

```bash
git add src/lib/api-error.ts src/lib/api-response.ts tests/lib/api-error.test.ts tests/lib/api-response.test.ts
git commit -m "feat: API error classes and response utilities with tests"
```

---

### Task 8: Zod Validation Schemas

**Files:**
- Create: `src/lib/validations/auth.ts`

- [ ] **Step 1: Auth-Validierungsschemas erstellen**

```typescript
// src/lib/validations/auth.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh Token fehlt'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validations/auth.ts
git commit -m "feat: Zod validation schemas for auth"
```

---

### Task 9: NextAuth v5 Konfiguration

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: NextAuth-Konfiguration erstellen**

```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { sparte: true },
        })

        if (!user || !user.isActive) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sparteId: user.sparteId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
        token.sparteId = (user as { sparteId: string | null }).sparteId
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.sparteId = token.sparteId as string | null
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
```

- [ ] **Step 2: NextAuth Route-Handler erstellen**

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

- [ ] **Step 3: NextAuth-Typen erweitern**

Datei `src/types/next-auth.d.ts` erstellen:

```typescript
// src/types/next-auth.d.ts
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      sparteId: string | null
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/\[...nextauth\]/route.ts src/types/next-auth.d.ts
git commit -m "feat: NextAuth v5 config with credentials provider"
```

---

### Task 10: Auth-Middleware (Dual: Session + JWT)

**Files:**
- Create: `src/lib/auth-middleware.ts`

- [ ] **Step 1: Dual-Auth-Middleware implementieren**

```typescript
// src/lib/auth-middleware.ts
import { NextRequest } from 'next/server'
import { auth } from './auth'
import { verifyAccessToken } from './jwt'
import type { UserRole } from '@prisma/client'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  sparteId: string | null
  source: 'web' | 'app'
}

export async function authenticateRequest(
  req: NextRequest
): Promise<AuthUser | null> {
  // 1. Check Bearer Token (App)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = verifyAccessToken(token)
    if (payload) {
      return {
        id: payload.userId,
        email: '',
        name: '',
        role: payload.role,
        sparteId: null,
        source: 'app',
      }
    }
  }

  // 2. Check Session (Web)
  const session = await auth()
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as UserRole,
      sparteId: session.user.sparteId,
      source: 'web',
    }
  }

  return null
}

export function requireRole(...roles: UserRole[]) {
  return async (req: NextRequest): Promise<AuthUser> => {
    const user = await authenticateRequest(req)
    if (!user) {
      throw new (await import('./api-error')).UnauthorizedError()
    }
    if (!roles.includes(user.role)) {
      throw new (await import('./api-error')).ForbiddenError()
    }
    return user
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth-middleware.ts
git commit -m "feat: dual auth middleware supporting session + JWT"
```

---

### Task 11: JWT API-Endpunkte (Login, Refresh, Me)

**Files:**
- Create: `src/app/api/v1/auth/login/route.ts`, `src/app/api/v1/auth/refresh/route.ts`, `src/app/api/v1/auth/me/route.ts`

- [ ] **Step 1: Login-Endpunkt erstellen**

```typescript
// src/app/api/v1/auth/login/route.ts
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import { apiSuccess, apiError } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/api-error'
import { loginSchema } from '@/lib/validations/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) throw new UnauthorizedError('Ungültige Anmeldedaten')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedError('Ungültige Anmeldedaten')

    const accessToken = signAccessToken({ userId: user.id, role: user.role })
    const refreshToken = signRefreshToken(user.id)

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    return apiSuccess({ accessToken, refreshToken })
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 2: Refresh-Endpunkt erstellen**

```typescript
// src/app/api/v1/auth/refresh/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signAccessToken, verifyRefreshToken } from '@/lib/jwt'
import { apiSuccess, apiError } from '@/lib/api-response'
import { UnauthorizedError, ValidationError } from '@/lib/api-error'
import { refreshTokenSchema } from '@/lib/validations/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = refreshTokenSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const { refreshToken } = parsed.data
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) throw new UnauthorizedError('Ungültiger Refresh Token')

    // Verify token exists in DB and is not expired
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } })
      throw new UnauthorizedError('Ungültiger Refresh Token')
    }

    const accessToken = signAccessToken({
      userId: stored.user.id,
      role: stored.user.role,
    })

    return apiSuccess({ accessToken })
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 3: Me-Endpunkt erstellen**

```typescript
// src/app/api/v1/auth/me/route.ts
import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { apiSuccess, apiError } from '@/lib/api-response'
import { UnauthorizedError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    return apiSuccess({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sparteId: user.sparteId,
    })
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/v1/auth/
git commit -m "feat: JWT auth API endpoints (login, refresh, me)"
```

---

### Task 12: Sparten API-Endpunkt

**Files:**
- Create: `src/app/api/v1/sparten/route.ts`

- [ ] **Step 1: GET /api/v1/sparten implementieren**

```typescript
// src/app/api/v1/sparten/route.ts
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET() {
  try {
    const sparten = await prisma.sparte.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        trainingszeiten: { orderBy: { wochentag: 'asc' } },
        ansprechpartner: true,
      },
    })

    return apiSuccess(sparten)
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/v1/sparten/route.ts
git commit -m "feat: public sparten API endpoint"
```

---

### Task 13: Tailwind Mobile-First Config + Design-System

**Files:**
- Modify: `tailwind.config.ts`
- Create: `src/app/globals.css`

- [ ] **Step 1: Tailwind Config mit Vereinsfarben und Fonts anpassen**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2ea3f2',
          hover: '#1a8cd8',
          light: '#e8f4fd',
        },
        text: {
          heading: '#333333',
          body: '#666666',
        },
        border: {
          DEFAULT: '#dddddd',
          light: '#eeeeee',
        },
        section: {
          alt: '#f7f7f7',
        },
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
      },
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
        heading: ['Archivo', 'sans-serif'],
      },
      maxWidth: {
        container: '1080px',
      },
      fontSize: {
        // Mobile-first sizes
        'h1': ['1.5rem', { lineHeight: '1.3', fontWeight: '700' }],     // 24px
        'h2': ['1.25rem', { lineHeight: '1.3', fontWeight: '700' }],    // 20px
        'h3': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],   // 18px
        'body': ['0.875rem', { lineHeight: '1.7' }],                     // 14px
      },
      screens: {
        'tablet': '768px',
        'desktop': '1024px',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Globale Styles anpassen**

```css
/* src/app/globals.css */
@import 'tailwindcss';

@theme {
  --color-primary: #2ea3f2;
  --color-primary-hover: #1a8cd8;
  --color-primary-light: #e8f4fd;
  --color-text-heading: #333333;
  --color-text-body: #666666;
  --color-border: #dddddd;
  --color-border-light: #eeeeee;
  --color-section-alt: #f7f7f7;
  --color-success: #28a745;
  --color-error: #dc3545;
  --color-warning: #ffc107;

  --font-sans: 'Open Sans', sans-serif;
  --font-heading: 'Archivo', sans-serif;
}

/* Desktop typography overrides */
@media (min-width: 1024px) {
  h1, .text-h1 { font-size: 1.875rem; } /* 30px */
  h2, .text-h2 { font-size: 1.625rem; } /* 26px */
  h3, .text-h3 { font-size: 1.375rem; } /* 22px */
  body { font-size: 1rem; }              /* 16px */
}
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat: Tailwind config with club colors, fonts, mobile-first breakpoints"
```

---

### Task 14: Basis-Layout-Komponenten

**Files:**
- Create: `src/components/layout/container.tsx`, `src/components/layout/header.tsx`, `src/components/layout/mobile-nav.tsx`, `src/components/layout/footer.tsx`, `src/components/ui/button.tsx`

- [ ] **Step 1: Container-Komponente erstellen**

```tsx
// src/components/layout/container.tsx
export function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-container px-4 tablet:px-6 ${className}`}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Button-Komponente erstellen**

```tsx
// src/components/ui/button.tsx
import { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-section-alt text-text-heading hover:bg-border-light',
  outline: 'border-2 border-primary text-primary hover:bg-primary-light',
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-6 py-3 font-semibold
        min-h-[44px] min-w-[44px] transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 3: Mobile-Navigation erstellen**

```tsx
// src/components/layout/mobile-nav.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

const navLinks = [
  { href: '/', label: 'Startseite' },
  { href: '/angebote', label: 'Sportangebote' },
  { href: '/termine', label: 'Termine' },
  { href: '/aktuelles', label: 'Aktuelles' },
  { href: '/mitmachen', label: 'Mitglied werden' },
  { href: '/belegung-vereinsheim', label: 'Vereinsheim' },
  { href: '/kontakt', label: 'Kontakt' },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Hamburger Button */}
      <button
        className="tablet:hidden flex items-center justify-center w-11 h-11"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
        aria-expanded={open}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {open && (
        <div className="tablet:hidden fixed inset-0 top-[64px] z-50 bg-white">
          <nav className="flex flex-col p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 px-4 text-text-body hover:text-primary hover:bg-primary-light
                  rounded-md transition-colors min-h-[44px] flex items-center"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 4: Header erstellen**

```tsx
// src/components/layout/header.tsx
import Link from 'next/link'
import Image from 'next/image'
import { Container } from './container'
import { MobileNav } from './mobile-nav'
import { Button } from '../ui/button'

const navLinks = [
  { href: '/', label: 'Startseite' },
  { href: '/angebote', label: 'Sportangebote' },
  { href: '/termine', label: 'Termine' },
  { href: '/aktuelles', label: 'Aktuelles' },
  { href: '/belegung-vereinsheim', label: 'Vereinsheim' },
  { href: '/kontakt', label: 'Kontakt' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border">
      <Container className="flex items-center justify-between h-16">
        {/* Logo + Claim */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo.jpeg"
            alt="SG 1898 Chattengau"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="hidden tablet:block font-heading font-bold text-text-heading">
            Wir bewegen Niedenstein!
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden tablet:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm text-text-body hover:text-primary
                rounded-md transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/mitmachen">
            <Button className="ml-2 text-sm">Mitglied werden</Button>
          </Link>
        </nav>

        {/* Mobile Nav */}
        <MobileNav />
      </Container>
    </header>
  )
}
```

- [ ] **Step 5: Footer erstellen**

```tsx
// src/components/layout/footer.tsx
import Link from 'next/link'
import { Container } from './container'

export function Footer() {
  return (
    <footer className="bg-text-heading text-white mt-auto">
      <Container className="py-8 tablet:py-12">
        <div className="grid grid-cols-1 tablet:grid-cols-3 gap-8">
          {/* Verein */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-3">
              SG 1898 Chattengau e.V.
            </h3>
            <p className="text-sm text-gray-300">
              Wir bewegen Niedenstein!
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-3">Links</h3>
            <nav className="flex flex-col gap-2 text-sm text-gray-300">
              <Link href="/kontakt" className="hover:text-white transition-colors">
                Kontakt
              </Link>
              <Link href="/impressum" className="hover:text-white transition-colors">
                Impressum
              </Link>
              <Link href="/datenschutz" className="hover:text-white transition-colors">
                Datenschutz
              </Link>
            </nav>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-3">Kontakt</h3>
            <address className="not-italic text-sm text-gray-300 space-y-1">
              <p>SG 1898 Chattengau e.V.</p>
              <p>Niedenstein</p>
            </address>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-600 text-sm text-gray-400 text-center">
          &copy; {new Date().getFullYear()} SG 1898 Chattengau e.V. Alle Rechte vorbehalten.
        </div>
      </Container>
    </footer>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/
git commit -m "feat: layout components (header, footer, mobile-nav, container, button)"
```

---

### Task 15: Root Layout + Fonts

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Root-Layout mit Google Fonts und Layout-Komponenten**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Open_Sans, Archivo } from 'next/font/google'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import './globals.css'

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'SG 1898 Chattengau e.V. | Wir bewegen Niedenstein!',
    template: '%s | SG 1898 Chattengau e.V.',
  },
  description: 'Sportgemeinschaft 1898 Chattengau e.V. — Dein Sportverein in Niedenstein mit über 18 Sparten und Kursangeboten.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${openSans.variable} ${archivo.variable}`}>
      <body className="font-sans text-body text-text-body bg-white min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: root layout with Google Fonts, header, footer"
```

---

### Task 16: Statische Seiten (Startseite, Impressum, Datenschutz)

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/impressum/page.tsx`, `src/app/datenschutz/page.tsx`

- [ ] **Step 1: Startseite erstellen**

```tsx
// src/app/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-primary-light py-12 tablet:py-20">
        <Container className="text-center">
          <Image
            src="/logo.jpeg"
            alt="SG 1898 Chattengau"
            width={120}
            height={120}
            className="mx-auto rounded-full mb-6"
            priority
          />
          <h1 className="font-heading text-h1 desktop:text-[1.875rem] text-text-heading mb-4">
            Wir bewegen Niedenstein!
          </h1>
          <p className="text-text-body max-w-xl mx-auto mb-8">
            Die Sportgemeinschaft 1898 Chattengau e.V. bietet dir über 18 Sparten
            und Kursangebote — von Fußball über Yoga bis Triathlon.
          </p>
          <div className="flex flex-col tablet:flex-row gap-4 justify-center">
            <Link href="/mitmachen">
              <Button>Mitglied werden</Button>
            </Link>
            <Link href="/angebote">
              <Button variant="outline">Sportangebote entdecken</Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Kurze Vorstellung */}
      <section className="py-12 tablet:py-16">
        <Container>
          <h2 className="font-heading text-h2 text-text-heading text-center mb-8">
            Unser Verein
          </h2>
          <p className="text-text-body text-center max-w-2xl mx-auto">
            Seit 1898 sind wir der Sportverein für Niedenstein und die Region Chattengau.
            Mit über 18 Sparten und Kursangeboten ist für jeden etwas dabei —
            egal ob Jung oder Alt, Anfänger oder Fortgeschritten.
          </p>
        </Container>
      </section>
    </>
  )
}
```

- [ ] **Step 2: Impressum erstellen**

```tsx
// src/app/impressum/page.tsx
import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = {
  title: 'Impressum',
}

export default function ImpressumPage() {
  return (
    <section className="py-12">
      <Container className="max-w-2xl">
        <h1 className="font-heading text-h1 text-text-heading mb-8">Impressum</h1>

        <div className="space-y-6 text-text-body">
          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">Angaben gemäß § 5 TMG</h2>
            <p>
              SG 1898 Chattengau e.V.<br />
              Niedenstein<br />
            </p>
          </div>

          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">Vertreten durch</h2>
            <p>1. Vorsitzender: Christoph Eubel</p>
          </div>

          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">Registereintrag</h2>
            <p>
              Eingetragen im Vereinsregister.<br />
              Registergericht: Amtsgericht Fritzlar
            </p>
          </div>

          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </h2>
            <p>
              Christoph Eubel<br />
              SG 1898 Chattengau e.V.<br />
              Niedenstein
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}
```

- [ ] **Step 3: Datenschutzseite erstellen**

```tsx
// src/app/datenschutz/page.tsx
import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
}

export default function DatenschutzPage() {
  return (
    <section className="py-12">
      <Container className="max-w-2xl">
        <h1 className="font-heading text-h1 text-text-heading mb-8">Datenschutzerklärung</h1>

        <div className="space-y-8 text-text-body">
          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">
              1. Verantwortlicher
            </h2>
            <p>
              SG 1898 Chattengau e.V.<br />
              1. Vorsitzender: Christoph Eubel<br />
              Niedenstein
            </p>
          </div>

          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">
              2. Datenschutzbeauftragter
            </h2>
            <p>Frank Kirchner</p>
          </div>

          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">
              3. Erhebung und Verarbeitung personenbezogener Daten
            </h2>
            <p>
              Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung
              unserer Website und unserer Leistungen erforderlich ist. Die Verarbeitung
              personenbezogener Daten erfolgt regelmäßig nur nach Einwilligung oder wenn
              die Verarbeitung durch gesetzliche Vorschriften gestattet ist.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">
              4. Digitaler Mitgliedsantrag
            </h2>
            <p>
              Bei der Nutzung unseres digitalen Mitgliedsantrags werden folgende Daten erhoben:
              Name, Adresse, Geburtsdatum, Kontaktdaten, Bankverbindung (IBAN) und digitale Unterschrift.
            </p>
            <p className="mt-2">
              <strong>Bankdaten (IBAN, Kontoinhaber)</strong> werden verschlüsselt gespeichert
              (AES-256-GCM) und sind nur für berechtigte Administratoren einsehbar. Die Datenübermittlung
              erfolgt ausschließlich über verschlüsselte Verbindungen (HTTPS/TLS 1.3).
            </p>
            <p className="mt-2">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b) DSGVO (Erfüllung des Beitrittsvertrags).
            </p>
          </div>

          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">
              5. Ihre Rechte
            </h2>
            <p>
              Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO),
              Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO),
              Datenübertragbarkeit (Art. 20 DSGVO) und Widerspruch (Art. 21 DSGVO).
            </p>
          </div>

          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">
              6. Löschfristen
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Abgeschlossene Mitgliedsanträge: 2 Jahre nach Abschluss</li>
              <li>Abgelehnte Anträge: 6 Monate</li>
              <li>Buchungsanfragen (abgelehnt): 6 Monate</li>
              <li>Buchungsanfragen (bestätigt): 2 Jahre</li>
            </ul>
          </div>
        </div>
      </Container>
    </section>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/impressum/ src/app/datenschutz/
git commit -m "feat: static pages (homepage, impressum, datenschutz)"
```

---

### Task 17: Login-Seite

**Files:**
- Create: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Login-Seite erstellen**

```tsx
// src/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Ungültige Anmeldedaten')
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <section className="py-12">
      <Container className="max-w-sm">
        <h1 className="font-heading text-h1 text-text-heading mb-8 text-center">
          Anmelden
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-error text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-heading mb-1">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-border px-4 py-3 text-text-heading
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-heading mb-1">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-md border border-border px-4 py-3 text-text-heading
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Anmelden...' : 'Anmelden'}
          </Button>
        </form>
      </Container>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(auth)/"
git commit -m "feat: login page with NextAuth credentials flow"
```

---

### Task 18: Seed-Script

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Seed-Script mit Sparten und Admin-User erstellen**

```typescript
// prisma/seed.ts
import { PrismaClient, SparteTyp } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const sparten = [
  { name: 'Fußball', slug: 'fussball', typ: SparteTyp.SPARTE, sortOrder: 1 },
  { name: 'Schwimmen', slug: 'schwimmen', typ: SparteTyp.SPARTE, sortOrder: 2 },
  { name: 'Volleyball', slug: 'volleyball', typ: SparteTyp.SPARTE, sortOrder: 3 },
  { name: 'Tischtennis', slug: 'tischtennis', typ: SparteTyp.SPARTE, sortOrder: 4 },
  { name: 'Tennis', slug: 'tennis', typ: SparteTyp.SPARTE, sortOrder: 5 },
  { name: 'Judo', slug: 'judo', typ: SparteTyp.SPARTE, sortOrder: 6 },
  { name: 'Laufen', slug: 'laufen', typ: SparteTyp.SPARTE, sortOrder: 7 },
  { name: 'Triathlon / Multisport', slug: 'triathlon-multisport', typ: SparteTyp.SPARTE, sortOrder: 8 },
  { name: 'Kinderturnen', slug: 'kinderturnen', typ: SparteTyp.SPARTE, sortOrder: 9 },
  { name: 'Rehasport', slug: 'rehasport', typ: SparteTyp.SPARTE, sortOrder: 10 },
  { name: 'Gesundheitssport', slug: 'gesundheitssport', typ: SparteTyp.SPARTE, sortOrder: 11 },
  { name: 'Fitness / Gymnastik', slug: 'fitness-gymnastik', typ: SparteTyp.SPARTE, sortOrder: 12 },
  { name: 'Nordic Walking', slug: 'nordic-walking', typ: SparteTyp.SPARTE, sortOrder: 13 },
  { name: 'Fotografie', slug: 'fotografie', typ: SparteTyp.SPARTE, sortOrder: 14 },
  // Kurse
  { name: 'Yoga', slug: 'yoga', typ: SparteTyp.KURS, sortOrder: 20 },
  { name: 'Qigong', slug: 'qigong', typ: SparteTyp.KURS, sortOrder: 21 },
  { name: 'Metalza', slug: 'metalza', typ: SparteTyp.KURS, sortOrder: 22 },
  { name: 'Fit am Montag', slug: 'fit-am-montag', typ: SparteTyp.KURS, sortOrder: 23 },
]

async function main() {
  console.log('Seeding database...')

  // Admin-User
  const passwordHash = await bcrypt.hash('admin1234', 12)
  await prisma.user.upsert({
    where: { email: 'admin@sg1898chattengau.de' },
    update: {},
    create: {
      email: 'admin@sg1898chattengau.de',
      name: 'Administrator',
      passwordHash,
      role: 'ADMIN',
    },
  })
  console.log('Admin user created: admin@sg1898chattengau.de / admin1234')

  // Sparten
  for (const sparte of sparten) {
    await prisma.sparte.upsert({
      where: { slug: sparte.slug },
      update: { name: sparte.name, typ: sparte.typ, sortOrder: sparte.sortOrder },
      create: sparte,
    })
  }
  console.log(`${sparten.length} Sparten/Kurse created`)

  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Seed ausführen**

Run:
```bash
npx tsx prisma/seed.ts
```

Expected: "Seed complete!" mit Admin-User und 18 Sparten/Kursen.

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed script with 18 Sparten/Kurse and admin user"
```

---

### Task 19: Smoke-Test — App starten und prüfen

- [ ] **Step 1: Dev-Server starten**

Run:
```bash
npm run dev
```

Expected: Server startet auf `http://localhost:3000`.

- [ ] **Step 2: Prüfe Startseite**

Öffne `http://localhost:3000` im Browser.

Expected:
- Header mit Logo und Navigation sichtbar
- Hero-Bereich mit "Wir bewegen Niedenstein!" und Buttons
- Footer mit Vereinsinfos
- Mobile: Hamburger-Menu, Desktop: horizontale Navigation

- [ ] **Step 3: Prüfe statische Seiten**

- `http://localhost:3000/impressum` → Impressum-Seite
- `http://localhost:3000/datenschutz` → Datenschutzseite

- [ ] **Step 4: Prüfe Login-Seite**

`http://localhost:3000/login` → Login-Formular sichtbar.

- [ ] **Step 5: Prüfe API-Endpunkt**

Run:
```bash
curl -s http://localhost:3000/api/v1/sparten | jq '.data | length'
```

Expected: `18` (Anzahl der geseedeten Sparten).

- [ ] **Step 6: Alle Tests ausführen**

Run:
```bash
npx vitest run
```

Expected: Alle Tests grün (Encryption: 6, JWT: 4, API-Error: 5, API-Response: 4 = 19 Tests).

- [ ] **Step 7: Commit (falls noch uncommitted changes)**

```bash
git add -A
git commit -m "chore: Phase 1 complete — API foundation and base UI"
```

---

## Summary

| Task | Was | Tests |
|---|---|---|
| 1 | Projekt-Scaffolding | — |
| 2 | Docker + PostgreSQL | — |
| 3 | Prisma Schema (komplett) | — |
| 4 | Prisma Client Singleton | — |
| 5 | AES-256-GCM Verschlüsselung | 6 Tests |
| 6 | JWT Helpers | 4 Tests |
| 7 | API Error + Response | 9 Tests |
| 8 | Zod Validation Schemas | — |
| 9 | NextAuth v5 Config | — |
| 10 | Auth-Middleware (Dual) | — |
| 11 | JWT API-Endpunkte | — |
| 12 | Sparten API-Endpunkt | — |
| 13 | Tailwind Mobile-First Config | — |
| 14 | Layout-Komponenten | — |
| 15 | Root Layout + Fonts | — |
| 16 | Statische Seiten | — |
| 17 | Login-Seite | — |
| 18 | Seed-Script | — |
| 19 | Smoke-Test | 19 Tests total |

# Phase 7: Feinschliff + Migration — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SEO-Optimierung (Meta-Tags, Open Graph, JSON-LD), 301-Redirects von WordPress-URLs, Rate-Limiting für öffentliche API-Endpunkte, Sitemap, robots.txt und Performance-Optimierungen.

**Architecture:** Next.js Metadata API für SEO. Middleware für 301-Redirects und Rate-Limiting. Statische Sitemap-Generierung. JSON-LD als Script-Tag im Layout.

**Tech Stack:** Next.js Metadata API, Next.js Middleware, next-sitemap

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                    # Erweitert: JSON-LD Structured Data (MODIFY)
│   ├── sitemap.ts                    # Dynamische Sitemap
│   ├── robots.ts                     # robots.txt
│   ├── not-found.tsx                 # Custom 404-Seite
│   ├── opengraph-image.tsx           # Default OG-Image
│   └── api/v1/
│       └── ...                       # Rate-Limiting hinzufügen
├── middleware.ts                      # 301-Redirects + Rate-Limiting
└── lib/
    └── rate-limit.ts                  # Rate-Limiting Utility
tests/
└── lib/
    └── rate-limit.test.ts             # Rate-Limiting Tests
```

---

### Task 1: SEO Meta-Tags + Open Graph

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Root-Layout Metadata erweitern**

In `src/app/layout.tsx`, die `metadata` erweitern:

```typescript
export const metadata: Metadata = {
  title: {
    default: 'SG 1898 Chattengau e.V. | Wir bewegen Niedenstein!',
    template: '%s | SG 1898 Chattengau e.V.',
  },
  description: 'Sportgemeinschaft 1898 Chattengau e.V. — Dein Sportverein in Niedenstein mit über 18 Sparten und Kursangeboten.',
  metadataBase: new URL('https://sg1898chattengau.de'),
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'SG 1898 Chattengau e.V.',
    title: 'SG 1898 Chattengau e.V. | Wir bewegen Niedenstein!',
    description: 'Dein Sportverein in Niedenstein mit über 18 Sparten und Kursangeboten.',
    images: [{ url: '/logo.jpeg', width: 400, height: 400, alt: 'SG 1898 Chattengau e.V.' }],
  },
  twitter: {
    card: 'summary',
    title: 'SG 1898 Chattengau e.V.',
    description: 'Wir bewegen Niedenstein!',
  },
  icons: {
    icon: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
}
```

- [ ] **Step 2: JSON-LD Structured Data im Layout**

In `src/app/layout.tsx`, im `<body>` Tag vor `<Header />`:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SportsOrganization',
      name: 'SG 1898 Chattengau e.V.',
      description: 'Sportgemeinschaft 1898 Chattengau e.V. — Dein Sportverein in Niedenstein.',
      url: 'https://sg1898chattengau.de',
      logo: 'https://sg1898chattengau.de/logo.jpeg',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Niedenstein',
        addressCountry: 'DE',
      },
      sameAs: [],
    }),
  }}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: SEO meta tags, Open Graph, JSON-LD structured data"
```

---

### Task 2: Dynamische Sitemap + robots.txt

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

- [ ] **Step 1: Sitemap erstellen**

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sg1898chattengau.de'

  // Statische Seiten
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/angebote`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/termine`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/aktuelles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/mitmachen`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/belegung-vereinsheim`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/kontakt`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/impressum`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/datenschutz`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Dynamische Sparten-Seiten
  const sparten = await prisma.sparte.findMany({
    where: { isActive: true },
    select: { slug: true, typ: true, updatedAt: true },
  })

  const spartenPages: MetadataRoute.Sitemap = sparten.map((s) => ({
    url: `${baseUrl}/${s.typ === 'KURS' ? 'kurse' : 'sparten'}/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Dynamische Beitrags-Seiten
  const beitraege = await prisma.beitrag.findMany({
    where: { veroeffentlicht: true },
    select: { slug: true, updatedAt: true },
  })

  const beitraegePages: MetadataRoute.Sitemap = beitraege.map((b) => ({
    url: `${baseUrl}/aktuelles/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...spartenPages, ...beitraegePages]
}
```

- [ ] **Step 2: robots.txt erstellen**

```typescript
// src/app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login'],
      },
    ],
    sitemap: 'https://sg1898chattengau.de/sitemap.xml',
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat: dynamic sitemap and robots.txt"
```

---

### Task 3: 301-Redirects von WordPress-URLs

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Redirect-Map erstellen**

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

// WordPress-URL → Neue URL
const REDIRECTS: Record<string, string> = {
  // Sparten (alte WordPress-Slugs → neue Sparten-Seiten)
  '/fussball': '/sparten/fussball',
  '/schwimmen-2': '/sparten/schwimmen',
  '/volleyball-2': '/sparten/volleyball',
  '/tischtennis-2': '/sparten/tischtennis',
  '/tennis': '/sparten/tennis',
  '/judo-2': '/sparten/judo',
  '/laufen-2': '/sparten/laufen',
  '/triathlon-multisport': '/sparten/triathlon-multisport',
  '/kinderturnen-2': '/sparten/kinderturnen',
  '/rehasport': '/sparten/rehasport',
  '/gesundheitssport': '/sparten/gesundheitssport',
  '/fitness-gymnastik': '/sparten/fitness-gymnastik',
  '/nordic-walking': '/sparten/nordic-walking',
  '/fotografie': '/sparten/fotografie',

  // Kurse
  '/yoga': '/kurse/yoga',
  '/qigong': '/kurse/qigong',
  '/metalza': '/kurse/metalza',
  '/fit-am-montag': '/kurse/fit-am-montag',
  '/kurse': '/angebote',

  // Seiten
  '/ueber-uns': '/',
  '/angebot-uebersicht': '/angebote',
  '/veranstaltungen': '/termine',
  '/veranstaltungen/meine-buchungen': '/termine',
  '/veranstaltungen/veranstaltungsorte': '/termine',
  '/veranstaltungen/kategorien': '/termine',
  '/veranstaltungen/schlagwoerter': '/termine',
  '/stellenangebote': '/kontakt',

  // Spezielle Seiten
  '/1-chattengau-swim-2026': '/termine',
  '/3-niedensteiner-volkstriathlon-2': '/termine',
  '/3817-2': '/',
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 301-Redirect prüfen
  const redirect = REDIRECTS[path]
  if (redirect) {
    const url = request.nextUrl.clone()
    url.pathname = redirect
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  // Nicht auf statische Dateien und API-Routen anwenden
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.jpeg|uploads|api).*)',
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: 301 redirects from WordPress URLs"
```

---

### Task 4: Rate-Limiting für öffentliche API-Endpunkte (TDD)

**Files:**
- Create: `src/lib/rate-limit.ts`
- Test: `tests/lib/rate-limit.test.ts`

- [ ] **Step 1: Tests schreiben**

```typescript
// tests/lib/rate-limit.test.ts
import { describe, it, expect, beforeEach } from 'vitest'

describe('rate-limit', () => {
  beforeEach(async () => {
    // Reset module cache to get fresh limiter
    const mod = await import('@/lib/rate-limit')
    mod.resetRateLimitStore()
  })

  it('allows requests under the limit', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const result = checkRateLimit('test-ip-1', 5, 60000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('blocks requests over the limit', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    for (let i = 0; i < 3; i++) {
      checkRateLimit('test-ip-2', 3, 60000)
    }
    const result = checkRateLimit('test-ip-2', 3, 60000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('tracks different IPs separately', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    for (let i = 0; i < 3; i++) {
      checkRateLimit('ip-a', 3, 60000)
    }
    const resultA = checkRateLimit('ip-a', 3, 60000)
    const resultB = checkRateLimit('ip-b', 3, 60000)
    expect(resultA.allowed).toBe(false)
    expect(resultB.allowed).toBe(true)
  })
})
```

- [ ] **Step 2: Tests ausführen — FAIL**

Run: `npx vitest run tests/lib/rate-limit.test.ts`

- [ ] **Step 3: Rate-Limiting implementieren**

```typescript
// src/lib/rate-limit.ts
interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  // Cleanup expired entry
  if (entry && entry.resetAt <= now) {
    store.delete(key)
  }

  const current = store.get(key)

  if (!current) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  current.count++

  if (current.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt }
  }

  return { allowed: true, remaining: maxRequests - current.count, resetAt: current.resetAt }
}

export function resetRateLimitStore(): void {
  store.clear()
}
```

- [ ] **Step 4: Tests ausführen — PASS**

Run: `npx vitest run tests/lib/rate-limit.test.ts`

Expected: 3 tests passing.

- [ ] **Step 5: Rate-Limiting in Middleware einbauen**

In `src/middleware.ts`, die middleware-Funktion erweitern um Rate-Limiting für API-Routen:

```typescript
import { checkRateLimit } from '@/lib/rate-limit'

// In der middleware function, nach dem Redirect-Check:

  // Rate-Limiting für öffentliche API-Endpunkte
  if (path.startsWith('/api/v1/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    const authHeader = request.headers.get('authorization')
    const limit = authHeader ? 300 : 100 // 300/min für auth, 100/min für public
    const windowMs = 60 * 1000 // 1 Minute

    const result = checkRateLimit(`api:${ip}`, limit, windowMs)

    if (!result.allowed) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Zu viele Anfragen. Bitte warte einen Moment.' } },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(limit))
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))
    return response
  }
```

Auch den `config.matcher` aktualisieren damit API-Routen eingeschlossen sind:

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.jpeg|uploads).*)',
  ],
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/rate-limit.ts tests/lib/rate-limit.test.ts src/middleware.ts
git commit -m "feat: rate limiting for public API (100/min) and authenticated (300/min)"
```

---

### Task 5: Custom 404-Seite

**Files:**
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: 404-Seite erstellen**

```tsx
// src/app/not-found.tsx
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <section className="py-16 tablet:py-24">
      <Container className="text-center max-w-lg">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="font-heading text-h2 text-text-heading mb-4">
          Seite nicht gefunden
        </h2>
        <p className="text-text-body mb-8">
          Die gewünschte Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="flex flex-col tablet:flex-row gap-4 justify-center">
          <Link href="/">
            <Button>Zur Startseite</Button>
          </Link>
          <Link href="/angebote">
            <Button variant="outline">Sportangebote</Button>
          </Link>
        </div>
      </Container>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/not-found.tsx
git commit -m "feat: custom 404 page"
```

---

### Task 6: Performance-Optimierungen

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `next.config.ts`

- [ ] **Step 1: Next.js Config optimieren**

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mein.toubiz.de',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/logo.jpeg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig
```

- [ ] **Step 2: DNS-Prefetch und Preconnect im Layout**

In `src/app/layout.tsx`, im `<head>` Bereich (innerhalb `<html>` vor `<body>`):

```tsx
<head>
  <link rel="dns-prefetch" href="https://mein.toubiz.de" />
  <link rel="preconnect" href="https://mein.toubiz.de" crossOrigin="anonymous" />
</head>
```

- [ ] **Step 3: Commit**

```bash
git add next.config.ts src/app/layout.tsx
git commit -m "feat: performance optimizations (image formats, caching, prefetch)"
```

---

### Task 7: Smoke-Test Phase 7

- [ ] **Step 1: Alle Tests ausführen**

Run:
```bash
npx vitest run
```

Expected: Alle Tests grün (bisherige 47 + Rate-Limit 3 = ~50 Tests).

- [ ] **Step 2: Redirects testen**

Run:
```bash
curl -I http://localhost:3000/fussball 2>/dev/null | head -5
```

Expected: `HTTP/1.1 301 Moved Permanently` + `Location: /sparten/fussball`

- [ ] **Step 3: SEO testen**

- `http://localhost:3000/sitemap.xml` — Sitemap mit allen Seiten
- `http://localhost:3000/robots.txt` — robots.txt mit Sitemap-Link
- View Source der Startseite — JSON-LD Script und Open Graph Meta-Tags vorhanden

- [ ] **Step 4: 404 testen**

- `http://localhost:3000/gibts-nicht` — Custom 404-Seite mit Links

- [ ] **Step 5: Rate-Limiting testen**

```bash
for i in $(seq 1 105); do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/v1/sparten; done | sort | uniq -c
```

Expected: ~100x `200`, ~5x `429`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: Phase 7 complete — SEO, redirects, rate limiting, 404"
```

---

## Summary

| Task | Was | Tests |
|---|---|---|
| 1 | SEO Meta-Tags, Open Graph, JSON-LD | — |
| 2 | Dynamische Sitemap + robots.txt | — |
| 3 | 301-Redirects von WordPress-URLs | — |
| 4 | Rate-Limiting (100/min public, 300/min auth) | 3 Tests |
| 5 | Custom 404-Seite | — |
| 6 | Performance-Optimierungen (Caching, Image-Formate) | — |
| 7 | Smoke-Test | ~50 Tests total |

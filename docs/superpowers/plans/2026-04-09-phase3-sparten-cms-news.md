# Phase 3: Sparten-CMS + News — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sparten und Kurse mit eigenen Seiten, Tiptap-Editor für Beschreibungen, Trainingszeiten/Ansprechpartner-Verwaltung, Bild-Upload, News-Modul mit Spartenfilter, und Spartenleiter-Dashboard zum Pflegen der eigenen Inhalte.

**Architecture:** Bild-Upload speichert Dateien lokal in `public/uploads/` (einfach, keine Cloud-Abhängigkeit). Tiptap als eingeschränkter Rich-Text-Editor. Admin-Layout wird erweitert für Spartenleiter/Kursleiter (sehen nur ihre eigene Sparte). API-Endpunkte prüfen Rollen-Berechtigung: Admin kann alles, Spartenleiter nur eigene Sparte.

**Tech Stack:** Tiptap, Sharp (Bildoptimierung), Next.js App Router, Prisma 7, Zod

---

## Prisma 7 Import Convention

```typescript
import { prisma } from '@/lib/prisma'
import { SparteTyp } from '@/generated/prisma/enums'
import { apiSuccess, apiPaginated, apiError } from '@/lib/api-response'
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/api-error'
import { authenticateRequest, requireRole } from '@/lib/auth-middleware'
```

---

## File Structure

```
src/
├── app/
│   ├── sparten/
│   │   └── [slug]/
│   │       └── page.tsx                      # Öffentliche Spartenseite
│   ├── angebote/
│   │   └── page.tsx                          # Übersicht aller Sparten (REPLACE)
│   ├── aktuelles/
│   │   ├── page.tsx                          # News-Liste (REPLACE)
│   │   └── [slug]/
│   │       └── page.tsx                      # Einzelner Beitrag
│   ├── admin/
│   │   ├── layout.tsx                        # Erweitert für Spartenleiter (MODIFY)
│   │   ├── sparten/
│   │   │   ├── page.tsx                      # Sparten-Verwaltung (Admin)
│   │   │   └── [id]/
│   │   │       └── page.tsx                  # Sparte bearbeiten
│   │   ├── beitraege/
│   │   │   ├── page.tsx                      # Beiträge-Liste
│   │   │   ├── neu/
│   │   │   │   └── page.tsx                  # Neuer Beitrag
│   │   │   └── [id]/
│   │   │       └── page.tsx                  # Beitrag bearbeiten
│   │   └── nutzer/
│   │       └── page.tsx                      # Nutzerverwaltung (Admin)
│   └── api/v1/
│       ├── sparten/
│       │   ├── route.ts                      # GET (public), POST (admin) (MODIFY)
│       │   └── [slug]/
│       │       ├── route.ts                  # GET (public), PUT (admin/leiter)
│       │       ├── trainingszeiten/
│       │       │   └── route.ts              # PUT (admin/leiter)
│       │       ├── ansprechpartner/
│       │       │   └── route.ts              # PUT (admin/leiter)
│       │       └── bilder/
│       │           └── route.ts              # POST upload, DELETE (admin/leiter)
│       ├── beitraege/
│       │   ├── route.ts                      # GET (public), POST (auth)
│       │   └── [id]/
│       │       └── route.ts                  # GET, PUT, DELETE (auth)
│       ├── upload/
│       │   └── route.ts                      # POST file upload (auth)
│       └── admin/
│           └── nutzer/
│               └── route.ts                  # GET, POST, PUT, DELETE (admin)
├── components/
│   ├── sparten/
│   │   ├── sparte-card.tsx                   # Card für Angebote-Übersicht
│   │   ├── trainingszeiten-display.tsx       # Trainingszeiten-Anzeige
│   │   └── ansprechpartner-display.tsx       # Ansprechpartner-Anzeige
│   ├── beitraege/
│   │   └── beitrag-card.tsx                  # Card für News-Liste
│   ├── admin/
│   │   ├── sidebar.tsx                       # Erweitert (MODIFY)
│   │   ├── sparte-edit-form.tsx              # Sparte-Bearbeitungsformular
│   │   ├── trainingszeiten-editor.tsx        # Trainingszeiten CRUD
│   │   ├── ansprechpartner-editor.tsx        # Ansprechpartner CRUD
│   │   ├── bild-upload.tsx                   # Bild-Upload Komponente
│   │   ├── beitrag-form.tsx                  # Beitrag erstellen/bearbeiten
│   │   └── nutzer-verwaltung.tsx             # Nutzerverwaltung
│   └── ui/
│       └── tiptap-editor.tsx                 # Tiptap Rich-Text-Editor
├── lib/
│   ├── upload.ts                             # Datei-Upload Utility
│   ├── slug.ts                               # Slug-Generierung
│   └── validations/
│       ├── sparte.ts                         # Zod-Schemas für Sparten
│       └── beitrag.ts                        # Zod-Schemas für Beiträge
└── tests/
    └── lib/
        └── slug.test.ts                      # Slug-Tests
```

---

### Task 1: Dependencies installieren

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Tiptap und Sharp installieren**

Run:
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/pm sharp
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add tiptap editor and sharp for image optimization"
```

---

### Task 2: Slug-Utility (TDD)

**Files:**
- Create: `src/lib/slug.ts`
- Test: `tests/lib/slug.test.ts`

- [ ] **Step 1: Tests schreiben**

```typescript
// tests/lib/slug.test.ts
import { describe, it, expect } from 'vitest'
import { generateSlug } from '@/lib/slug'

describe('generateSlug', () => {
  it('converts to lowercase', () => {
    expect(generateSlug('Fußball')).toBe('fussball')
  })

  it('replaces spaces with hyphens', () => {
    expect(generateSlug('Fit am Montag')).toBe('fit-am-montag')
  })

  it('replaces umlauts', () => {
    expect(generateSlug('Übungsleiter Müller')).toBe('uebungsleiter-mueller')
  })

  it('removes special characters', () => {
    expect(generateSlug('Triathlon / Multisport')).toBe('triathlon-multisport')
  })

  it('collapses multiple hyphens', () => {
    expect(generateSlug('Fitness & Gymnastik')).toBe('fitness-gymnastik')
  })

  it('trims hyphens from start and end', () => {
    expect(generateSlug(' -Test- ')).toBe('test')
  })

  it('handles ß correctly', () => {
    expect(generateSlug('Straße')).toBe('strasse')
  })
})
```

- [ ] **Step 2: Tests ausführen — FAIL**

Run: `npx vitest run tests/lib/slug.test.ts`

- [ ] **Step 3: Slug-Modul implementieren**

```typescript
// src/lib/slug.ts
const UMLAUT_MAP: Record<string, string> = {
  'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss',
  'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue',
}

export function generateSlug(text: string): string {
  return text
    .replace(/[äöüßÄÖÜ]/g, (char) => UMLAUT_MAP[char] || char)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
```

- [ ] **Step 4: Tests ausführen — PASS**

Run: `npx vitest run tests/lib/slug.test.ts`

Expected: 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/slug.ts tests/lib/slug.test.ts
git commit -m "feat: slug generation utility with umlaut support"
```

---

### Task 3: Datei-Upload Utility + API-Endpunkt

**Files:**
- Create: `src/lib/upload.ts`
- Create: `src/app/api/v1/upload/route.ts`

- [ ] **Step 1: Upload-Utility erstellen**

```typescript
// src/lib/upload.ts
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

interface UploadResult {
  url: string
  filename: string
}

export async function saveUploadedFile(file: File): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Dateityp ${file.type} nicht erlaubt. Erlaubt: JPEG, PNG, WebP, AVIF`)
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Datei zu groß. Maximal 5 MB.')
  }

  // Create uploads directory if not exists
  const yearMonth = new Date().toISOString().slice(0, 7) // "2026-04"
  const dir = path.join(UPLOAD_DIR, yearMonth)
  await mkdir(dir, { recursive: true })

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'jpg'
  const hash = crypto.randomBytes(8).toString('hex')
  const filename = `${hash}.${ext}`
  const filepath = path.join(dir, filename)

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  return {
    url: `/uploads/${yearMonth}/${filename}`,
    filename,
  }
}
```

- [ ] **Step 2: Upload API-Endpunkt erstellen**

```typescript
// src/app/api/v1/upload/route.ts
import { NextRequest } from 'next/server'
import { saveUploadedFile } from '@/lib/upload'
import { apiSuccess, apiError } from '@/lib/api-response'
import { ValidationError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'
import { UnauthorizedError } from '@/lib/api-error'

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      throw new ValidationError('Keine Datei hochgeladen')
    }

    const result = await saveUploadedFile(file)
    return apiSuccess(result, 201)
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 3: `.gitignore` ergänzen**

Sicherstellen, dass `public/uploads/` im `.gitignore` steht:

```
public/uploads/
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/upload.ts src/app/api/v1/upload/route.ts .gitignore
git commit -m "feat: file upload utility and API endpoint"
```

---

### Task 4: Zod-Schemas für Sparten + Beiträge

**Files:**
- Create: `src/lib/validations/sparte.ts`
- Create: `src/lib/validations/beitrag.ts`

- [ ] **Step 1: Sparten-Schemas erstellen**

```typescript
// src/lib/validations/sparte.ts
import { z } from 'zod'

export const sparteUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  beschreibung: z.string().optional(),
  typ: z.enum(['SPARTE', 'KURS']).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export const trainingszeitSchema = z.object({
  id: z.string().optional(),
  wochentag: z.number().int().min(0).max(6),
  startzeit: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  endzeit: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  ort: z.string().optional(),
  hinweis: z.string().optional(),
})

export const trainingszeitenUpdateSchema = z.object({
  trainingszeiten: z.array(trainingszeitSchema),
})

export const ansprechpartnerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  rolle: z.string().optional(),
  telefon: z.string().optional(),
  email: z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
})

export const ansprechpartnerUpdateSchema = z.object({
  ansprechpartner: z.array(ansprechpartnerSchema),
})

export const sparteCreateSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  typ: z.enum(['SPARTE', 'KURS']).optional(),
})

export type SparteUpdateInput = z.infer<typeof sparteUpdateSchema>
export type TrainingszeitenUpdateInput = z.infer<typeof trainingszeitenUpdateSchema>
export type AnsprechpartnerUpdateInput = z.infer<typeof ansprechpartnerUpdateSchema>
```

- [ ] **Step 2: Beitrags-Schemas erstellen**

```typescript
// src/lib/validations/beitrag.ts
import { z } from 'zod'

export const beitragCreateSchema = z.object({
  titel: z.string().min(3, 'Titel muss mindestens 3 Zeichen lang sein'),
  inhalt: z.string().min(10, 'Inhalt muss mindestens 10 Zeichen lang sein'),
  auszug: z.string().optional(),
  bildUrl: z.string().optional(),
  sparteId: z.string().optional(),
  veroeffentlicht: z.boolean().optional(),
})

export const beitragUpdateSchema = beitragCreateSchema.partial()

export type BeitragCreateInput = z.infer<typeof beitragCreateSchema>
export type BeitragUpdateInput = z.infer<typeof beitragUpdateSchema>
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/validations/sparte.ts src/lib/validations/beitrag.ts
git commit -m "feat: Zod schemas for Sparten and Beiträge CRUD"
```

---

### Task 5: Tiptap Rich-Text-Editor Komponente

**Files:**
- Create: `src/components/ui/tiptap-editor.tsx`

- [ ] **Step 1: Tiptap-Editor erstellen**

```tsx
// src/components/ui/tiptap-editor.tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const btnClass = (active: boolean) =>
    `px-2 py-1 rounded text-sm min-h-[36px] min-w-[36px] transition-colors ${
      active ? 'bg-primary text-white' : 'bg-white text-text-body hover:bg-section-alt border border-border'
    }`

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-section-alt rounded-t-md">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}>
        <strong>B</strong>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}>
        <em>I</em>
      </button>
      <span className="w-px h-6 bg-border self-center mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))}>
        H2
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))}>
        H3
      </button>
      <span className="w-px h-6 bg-border self-center mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}>
        Liste
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))}>
        1. Liste
      </button>
      <span className="w-px h-6 bg-border self-center mx-1" />
      <button
        type="button"
        onClick={() => {
          const url = window.prompt('URL eingeben:')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }}
        className={btnClass(editor.isActive('link'))}
      >
        Link
      </button>
      {editor.isActive('link') && (
        <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} className={btnClass(false)}>
          Unlink
        </button>
      )}
    </div>
  )
}

export function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none',
      },
    },
  })

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      {!content && placeholder && (
        <p className="text-text-body text-sm px-4 -mt-[200px] pointer-events-none opacity-50">
          {placeholder}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/tiptap-editor.tsx
git commit -m "feat: Tiptap rich-text editor with restricted toolbar"
```

---

### Task 6: Sparten API — CRUD-Endpunkte

**Files:**
- Modify: `src/app/api/v1/sparten/route.ts`
- Create: `src/app/api/v1/sparten/[slug]/route.ts`
- Create: `src/app/api/v1/sparten/[slug]/trainingszeiten/route.ts`
- Create: `src/app/api/v1/sparten/[slug]/ansprechpartner/route.ts`
- Create: `src/app/api/v1/sparten/[slug]/bilder/route.ts`

- [ ] **Step 1: GET/POST Sparten erweitern**

```typescript
// src/app/api/v1/sparten/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { ValidationError } from '@/lib/api-error'
import { requireRole } from '@/lib/auth-middleware'
import { sparteCreateSchema } from '@/lib/validations/sparte'
import { generateSlug } from '@/lib/slug'

export async function GET() {
  try {
    const sparten = await prisma.sparte.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        trainingszeiten: { orderBy: { wochentag: 'asc' } },
        ansprechpartner: true,
        bilder: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return apiSuccess(sparten)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const checkAdmin = requireRole('ADMIN')
    await checkAdmin(req)

    const body = await req.json()
    const parsed = sparteCreateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const slug = generateSlug(parsed.data.name)

    // Check slug uniqueness
    const existing = await prisma.sparte.findUnique({ where: { slug } })
    if (existing) {
      throw new ValidationError('Eine Sparte mit diesem Namen existiert bereits')
    }

    const maxOrder = await prisma.sparte.aggregate({ _max: { sortOrder: true } })
    const sortOrder = (maxOrder._max.sortOrder || 0) + 1

    const sparte = await prisma.sparte.create({
      data: {
        name: parsed.data.name,
        slug,
        typ: parsed.data.typ || 'SPARTE',
        sortOrder,
      },
    })

    return apiSuccess(sparte, 201)
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 2: GET/PUT Einzelne Sparte**

```typescript
// src/app/api/v1/sparten/[slug]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, ForbiddenError } from '@/lib/api-error'
import { ValidationError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'
import { sparteUpdateSchema } from '@/lib/validations/sparte'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const sparte = await prisma.sparte.findUnique({
      where: { slug },
      include: {
        trainingszeiten: { orderBy: { wochentag: 'asc' } },
        ansprechpartner: true,
        bilder: { orderBy: { sortOrder: 'asc' } },
        beitraege: {
          where: { veroeffentlicht: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!sparte) throw new NotFoundError('Sparte')

    return apiSuccess(sparte)
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new (await import('@/lib/api-error')).UnauthorizedError()

    const { slug } = await params
    const sparte = await prisma.sparte.findUnique({ where: { slug } })
    if (!sparte) throw new NotFoundError('Sparte')

    // Admin can edit all, Spartenleiter/Kursleiter only their own
    if (user.role !== 'ADMIN' && user.sparteId !== sparte.id) {
      throw new ForbiddenError('Keine Berechtigung für diese Sparte')
    }

    const body = await req.json()
    const parsed = sparteUpdateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const updated = await prisma.sparte.update({
      where: { slug },
      data: parsed.data,
    })

    return apiSuccess(updated)
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 3: Trainingszeiten Batch-Update**

```typescript
// src/app/api/v1/sparten/[slug]/trainingszeiten/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, ForbiddenError, UnauthorizedError, ValidationError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'
import { trainingszeitenUpdateSchema } from '@/lib/validations/sparte'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const { slug } = await params
    const sparte = await prisma.sparte.findUnique({ where: { slug } })
    if (!sparte) throw new NotFoundError('Sparte')

    if (user.role !== 'ADMIN' && user.sparteId !== sparte.id) {
      throw new ForbiddenError()
    }

    const body = await req.json()
    const parsed = trainingszeitenUpdateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    // Delete all existing and recreate (simpler than diffing)
    await prisma.trainingszeit.deleteMany({ where: { sparteId: sparte.id } })

    if (parsed.data.trainingszeiten.length > 0) {
      await prisma.trainingszeit.createMany({
        data: parsed.data.trainingszeiten.map((t) => ({
          sparteId: sparte.id,
          wochentag: t.wochentag,
          startzeit: t.startzeit,
          endzeit: t.endzeit,
          ort: t.ort || null,
          hinweis: t.hinweis || null,
        })),
      })
    }

    const updated = await prisma.trainingszeit.findMany({
      where: { sparteId: sparte.id },
      orderBy: { wochentag: 'asc' },
    })

    return apiSuccess(updated)
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 4: Ansprechpartner Batch-Update**

```typescript
// src/app/api/v1/sparten/[slug]/ansprechpartner/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, ForbiddenError, UnauthorizedError, ValidationError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'
import { ansprechpartnerUpdateSchema } from '@/lib/validations/sparte'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const { slug } = await params
    const sparte = await prisma.sparte.findUnique({ where: { slug } })
    if (!sparte) throw new NotFoundError('Sparte')

    if (user.role !== 'ADMIN' && user.sparteId !== sparte.id) {
      throw new ForbiddenError()
    }

    const body = await req.json()
    const parsed = ansprechpartnerUpdateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    // Delete all existing and recreate
    await prisma.ansprechpartner.deleteMany({ where: { sparteId: sparte.id } })

    if (parsed.data.ansprechpartner.length > 0) {
      await prisma.ansprechpartner.createMany({
        data: parsed.data.ansprechpartner.map((a) => ({
          sparteId: sparte.id,
          name: a.name,
          rolle: a.rolle || null,
          telefon: a.telefon || null,
          email: a.email || null,
        })),
      })
    }

    const updated = await prisma.ansprechpartner.findMany({
      where: { sparteId: sparte.id },
    })

    return apiSuccess(updated)
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 5: Bilder-Upload für Sparte**

```typescript
// src/app/api/v1/sparten/[slug]/bilder/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveUploadedFile } from '@/lib/upload'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, ForbiddenError, UnauthorizedError, ValidationError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const { slug } = await params
    const sparte = await prisma.sparte.findUnique({ where: { slug } })
    if (!sparte) throw new NotFoundError('Sparte')

    if (user.role !== 'ADMIN' && user.sparteId !== sparte.id) {
      throw new ForbiddenError()
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const alt = formData.get('alt') as string | null

    if (!file || !(file instanceof File)) {
      throw new ValidationError('Keine Datei hochgeladen')
    }

    const result = await saveUploadedFile(file)

    const maxOrder = await prisma.sparteBild.aggregate({
      where: { sparteId: sparte.id },
      _max: { sortOrder: true },
    })

    const bild = await prisma.sparteBild.create({
      data: {
        sparteId: sparte.id,
        url: result.url,
        alt: alt || null,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    })

    return apiSuccess(bild, 201)
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const { slug } = await params
    const sparte = await prisma.sparte.findUnique({ where: { slug } })
    if (!sparte) throw new NotFoundError('Sparte')

    if (user.role !== 'ADMIN' && user.sparteId !== sparte.id) {
      throw new ForbiddenError()
    }

    const url = new URL(req.url)
    const bildId = url.searchParams.get('id')
    if (!bildId) throw new ValidationError('Bild-ID fehlt')

    await prisma.sparteBild.delete({
      where: { id: bildId, sparteId: sparte.id },
    })

    return apiSuccess({ deleted: true })
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/v1/sparten/
git commit -m "feat: Sparten CRUD API with trainingszeiten, ansprechpartner, bilder"
```

---

### Task 7: Beiträge API — CRUD-Endpunkte

**Files:**
- Create: `src/app/api/v1/beitraege/route.ts`
- Create: `src/app/api/v1/beitraege/[id]/route.ts`

- [ ] **Step 1: Beiträge Liste + Erstellen**

```typescript
// src/app/api/v1/beitraege/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiPaginated, apiError } from '@/lib/api-response'
import { ValidationError, UnauthorizedError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'
import { beitragCreateSchema } from '@/lib/validations/beitrag'
import { generateSlug } from '@/lib/slug'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const seite = parseInt(url.searchParams.get('seite') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const sparteId = url.searchParams.get('sparte')

    const where: Record<string, unknown> = { veroeffentlicht: true }
    if (sparteId) where.sparteId = sparteId

    const [beitraege, gesamt] = await Promise.all([
      prisma.beitrag.findMany({
        where,
        include: { sparte: { select: { name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (seite - 1) * limit,
        take: limit,
      }),
      prisma.beitrag.count({ where }),
    ])

    return apiPaginated(beitraege, { seite, limit, gesamt })
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const body = await req.json()
    const parsed = beitragCreateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    // Spartenleiter/Kursleiter can only post for their own sparte
    if (user.role !== 'ADMIN' && parsed.data.sparteId && user.sparteId !== parsed.data.sparteId) {
      throw new (await import('@/lib/api-error')).ForbiddenError('Keine Berechtigung für diese Sparte')
    }

    // If Spartenleiter, auto-assign their sparte
    const sparteId = parsed.data.sparteId || (user.role !== 'ADMIN' ? user.sparteId : null)

    let slug = generateSlug(parsed.data.titel)
    // Ensure unique slug
    const existing = await prisma.beitrag.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    const beitrag = await prisma.beitrag.create({
      data: {
        titel: parsed.data.titel,
        slug,
        inhalt: parsed.data.inhalt,
        auszug: parsed.data.auszug || null,
        bildUrl: parsed.data.bildUrl || null,
        sparteId: sparteId || null,
        veroeffentlicht: parsed.data.veroeffentlicht ?? false,
        authorId: user.id,
      },
    })

    return apiSuccess(beitrag, 201)
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 2: Beitrag Detail + Update + Delete**

```typescript
// src/app/api/v1/beitraege/[id]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'
import { beitragUpdateSchema } from '@/lib/validations/beitrag'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const beitrag = await prisma.beitrag.findUnique({
      where: { id },
      include: { sparte: { select: { name: true, slug: true } } },
    })

    if (!beitrag) throw new NotFoundError('Beitrag')

    return apiSuccess(beitrag)
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
    const beitrag = await prisma.beitrag.findUnique({ where: { id } })
    if (!beitrag) throw new NotFoundError('Beitrag')

    // Only author or admin can edit
    if (user.role !== 'ADMIN' && beitrag.authorId !== user.id) {
      throw new ForbiddenError()
    }

    const body = await req.json()
    const parsed = beitragUpdateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const updated = await prisma.beitrag.update({
      where: { id },
      data: parsed.data,
    })

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
    const beitrag = await prisma.beitrag.findUnique({ where: { id } })
    if (!beitrag) throw new NotFoundError('Beitrag')

    if (user.role !== 'ADMIN' && beitrag.authorId !== user.id) {
      throw new ForbiddenError()
    }

    await prisma.beitrag.delete({ where: { id } })

    return apiSuccess({ deleted: true })
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/v1/beitraege/
git commit -m "feat: Beiträge CRUD API with auth and sparte filtering"
```

---

### Task 8: Nutzerverwaltung API (Admin)

**Files:**
- Create: `src/app/api/v1/admin/nutzer/route.ts`

- [ ] **Step 1: Nutzer-CRUD erstellen**

```typescript
// src/app/api/v1/admin/nutzer/route.ts
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { ValidationError } from '@/lib/api-error'
import { requireRole } from '@/lib/auth-middleware'
import { z } from 'zod'

const nutzerCreateSchema = z.object({
  email: z.string().email('Ungültige E-Mail'),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  role: z.enum(['ADMIN', 'SPARTENLEITER', 'KURSLEITER']),
  sparteId: z.string().optional(),
})

const nutzerUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['ADMIN', 'SPARTENLEITER', 'KURSLEITER']).optional(),
  sparteId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const checkAdmin = requireRole('ADMIN')
    await checkAdmin(req)

    const nutzer = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        sparteId: true,
        sparte: { select: { name: true } },
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    return apiSuccess(nutzer)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const checkAdmin = requireRole('ADMIN')
    await checkAdmin(req)

    const body = await req.json()
    const parsed = nutzerCreateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (existing) throw new ValidationError('E-Mail bereits vergeben')

    const passwordHash = await bcrypt.hash(parsed.data.password, 12)

    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
        role: parsed.data.role,
        sparteId: parsed.data.sparteId || null,
      },
      select: { id: true, email: true, name: true, role: true, sparteId: true },
    })

    return apiSuccess(user, 201)
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const checkAdmin = requireRole('ADMIN')
    await checkAdmin(req)

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) throw new ValidationError('Nutzer-ID fehlt')

    const body = await req.json()
    const parsed = nutzerUpdateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const data: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.password) {
      data.passwordHash = await bcrypt.hash(parsed.data.password, 12)
      delete data.password
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, sparteId: true, isActive: true },
    })

    return apiSuccess(user)
  } catch (err) {
    return apiError(err)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/v1/admin/nutzer/
git commit -m "feat: admin user management API"
```

---

### Task 9: Öffentliche Seiten — Sportangebote + Spartenseite

**Files:**
- Create: `src/components/sparten/sparte-card.tsx`
- Create: `src/components/sparten/trainingszeiten-display.tsx`
- Create: `src/components/sparten/ansprechpartner-display.tsx`
- Modify: `src/app/angebote/page.tsx`
- Create: `src/app/sparten/[slug]/page.tsx`

- [ ] **Step 1: Sparte-Card Komponente**

```tsx
// src/components/sparten/sparte-card.tsx
import Link from 'next/link'
import Image from 'next/image'

interface SparteCardProps {
  name: string
  slug: string
  beschreibung: string | null
  typ: string
  bilder: { url: string; alt: string | null }[]
  trainingszeiten: { wochentag: number; startzeit: string; endzeit: string }[]
}

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export function SparteCard({ name, slug, beschreibung, typ, bilder, trainingszeiten }: SparteCardProps) {
  const erstesTraining = trainingszeiten[0]

  return (
    <Link
      href={`/sparten/${slug}`}
      className="block bg-white rounded-lg border border-border hover:border-primary
        transition-colors overflow-hidden group"
    >
      {bilder[0] && (
        <div className="aspect-video relative overflow-hidden">
          <Image
            src={bilder[0].url}
            alt={bilder[0].alt || name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-heading text-h3 text-text-heading">{name}</h3>
          {typ === 'KURS' && (
            <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full">Kurs</span>
          )}
        </div>
        {beschreibung && (
          <p className="text-sm text-text-body line-clamp-2 mb-2"
            dangerouslySetInnerHTML={{ __html: beschreibung.replace(/<[^>]*>/g, '').slice(0, 120) + '...' }}
          />
        )}
        {erstesTraining && (
          <p className="text-xs text-text-body">
            {WOCHENTAGE[erstesTraining.wochentag]} {erstesTraining.startzeit}–{erstesTraining.endzeit}
            {trainingszeiten.length > 1 && ` +${trainingszeiten.length - 1} weitere`}
          </p>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Trainingszeiten-Anzeige**

```tsx
// src/components/sparten/trainingszeiten-display.tsx
const WOCHENTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

interface Trainingszeit {
  wochentag: number
  startzeit: string
  endzeit: string
  ort: string | null
  hinweis: string | null
}

export function TrainingszeitenDisplay({ trainingszeiten }: { trainingszeiten: Trainingszeit[] }) {
  if (trainingszeiten.length === 0) return null

  return (
    <div>
      <h3 className="font-heading text-h3 text-text-heading mb-3">Trainingszeiten</h3>
      <div className="space-y-2">
        {trainingszeiten.map((t, i) => (
          <div key={i} className="bg-white p-3 rounded-md border border-border">
            <div className="flex justify-between items-center">
              <span className="font-medium text-text-heading">{WOCHENTAGE[t.wochentag]}</span>
              <span className="text-primary font-medium">{t.startzeit} – {t.endzeit}</span>
            </div>
            {t.ort && <p className="text-sm text-text-body mt-1">{t.ort}</p>}
            {t.hinweis && <p className="text-xs text-text-body mt-1 italic">{t.hinweis}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Ansprechpartner-Anzeige**

```tsx
// src/components/sparten/ansprechpartner-display.tsx
interface AnsprechpartnerItem {
  name: string
  rolle: string | null
  telefon: string | null
  email: string | null
}

export function AnsprechpartnerDisplay({ ansprechpartner }: { ansprechpartner: AnsprechpartnerItem[] }) {
  if (ansprechpartner.length === 0) return null

  return (
    <div>
      <h3 className="font-heading text-h3 text-text-heading mb-3">Ansprechpartner</h3>
      <div className="space-y-2">
        {ansprechpartner.map((a, i) => (
          <div key={i} className="bg-white p-3 rounded-md border border-border">
            <p className="font-medium text-text-heading">{a.name}</p>
            {a.rolle && <p className="text-sm text-text-body">{a.rolle}</p>}
            <div className="flex flex-col tablet:flex-row gap-2 mt-1 text-sm">
              {a.telefon && (
                <a href={`tel:${a.telefon}`} className="text-primary hover:text-primary-hover">{a.telefon}</a>
              )}
              {a.email && (
                <a href={`mailto:${a.email}`} className="text-primary hover:text-primary-hover">{a.email}</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Angebote-Seite (Sparten-Übersicht) ersetzen**

```tsx
// src/app/angebote/page.tsx
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Container } from '@/components/layout/container'
import { SparteCard } from '@/components/sparten/sparte-card'

export const metadata: Metadata = {
  title: 'Sportangebote',
  description: 'Alle Sparten und Kursangebote der SG 1898 Chattengau e.V.',
}

export default async function AngebotePage() {
  const sparten = await prisma.sparte.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      trainingszeiten: { orderBy: { wochentag: 'asc' } },
      bilder: { orderBy: { sortOrder: 'asc' }, take: 1 },
    },
  })

  const spartenList = sparten.filter((s) => s.typ === 'SPARTE')
  const kurseList = sparten.filter((s) => s.typ === 'KURS')

  return (
    <section className="py-8 tablet:py-12">
      <Container>
        <h1 className="font-heading text-h1 text-text-heading mb-8">Sportangebote</h1>

        {spartenList.length > 0 && (
          <div className="mb-12">
            <h2 className="font-heading text-h2 text-text-heading mb-4">Sparten</h2>
            <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
              {spartenList.map((s) => (
                <SparteCard key={s.id} {...s} />
              ))}
            </div>
          </div>
        )}

        {kurseList.length > 0 && (
          <div>
            <h2 className="font-heading text-h2 text-text-heading mb-4">Kurse</h2>
            <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
              {kurseList.map((s) => (
                <SparteCard key={s.id} {...s} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  )
}
```

- [ ] **Step 5: Spartenseite (öffentlich)**

```tsx
// src/app/sparten/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Container } from '@/components/layout/container'
import { TrainingszeitenDisplay } from '@/components/sparten/trainingszeiten-display'
import { AnsprechpartnerDisplay } from '@/components/sparten/ansprechpartner-display'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const sparte = await prisma.sparte.findUnique({ where: { slug }, select: { name: true } })
  if (!sparte) return { title: 'Nicht gefunden' }
  return { title: sparte.name }
}

export default async function SpartePage({ params }: Props) {
  const { slug } = await params

  const sparte = await prisma.sparte.findUnique({
    where: { slug },
    include: {
      trainingszeiten: { orderBy: { wochentag: 'asc' } },
      ansprechpartner: true,
      bilder: { orderBy: { sortOrder: 'asc' } },
      beitraege: {
        where: { veroeffentlicht: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, titel: true, slug: true, auszug: true, createdAt: true },
      },
    },
  })

  if (!sparte || !sparte.isActive) notFound()

  return (
    <section className="py-8 tablet:py-12">
      <Container>
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="font-heading text-h1 text-text-heading">{sparte.name}</h1>
            {sparte.typ === 'KURS' && (
              <span className="text-sm bg-primary-light text-primary px-3 py-1 rounded-full">Kurs</span>
            )}
          </div>

          {/* Bilder */}
          {sparte.bilder.length > 0 && (
            <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 mb-6">
              {sparte.bilder.map((bild) => (
                <div key={bild.id} className="aspect-video relative rounded-lg overflow-hidden">
                  <Image
                    src={bild.url}
                    alt={bild.alt || sparte.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 tablet:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="tablet:col-span-2">
            {sparte.beschreibung && (
              <div
                className="prose prose-sm max-w-none text-text-body"
                dangerouslySetInnerHTML={{ __html: sparte.beschreibung }}
              />
            )}

            {/* News der Sparte */}
            {sparte.beitraege.length > 0 && (
              <div className="mt-8">
                <h3 className="font-heading text-h3 text-text-heading mb-3">Aktuelles</h3>
                <div className="space-y-3">
                  {sparte.beitraege.map((b) => (
                    <a key={b.id} href={`/aktuelles/${b.slug}`} className="block p-3 bg-white rounded-md border border-border hover:border-primary transition-colors">
                      <p className="font-medium text-text-heading">{b.titel}</p>
                      {b.auszug && <p className="text-sm text-text-body mt-1">{b.auszug}</p>}
                      <p className="text-xs text-text-body mt-1">{new Date(b.createdAt).toLocaleDateString('de-DE')}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TrainingszeitenDisplay trainingszeiten={sparte.trainingszeiten} />
            <AnsprechpartnerDisplay ansprechpartner={sparte.ansprechpartner} />
          </div>
        </div>
      </Container>
    </section>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/sparten/ src/app/angebote/page.tsx src/app/sparten/
git commit -m "feat: public Sparten pages with overview and detail view"
```

---

### Task 10: Öffentliche News-Seiten

**Files:**
- Create: `src/components/beitraege/beitrag-card.tsx`
- Modify: `src/app/aktuelles/page.tsx`
- Create: `src/app/aktuelles/[slug]/page.tsx`

- [ ] **Step 1: Beitrag-Card Komponente**

```tsx
// src/components/beitraege/beitrag-card.tsx
import Link from 'next/link'
import Image from 'next/image'

interface BeitragCardProps {
  titel: string
  slug: string
  auszug: string | null
  bildUrl: string | null
  sparte: { name: string; slug: string } | null
  createdAt: string
}

export function BeitragCard({ titel, slug, auszug, bildUrl, sparte, createdAt }: BeitragCardProps) {
  return (
    <Link
      href={`/aktuelles/${slug}`}
      className="block bg-white rounded-lg border border-border hover:border-primary
        transition-colors overflow-hidden group"
    >
      {bildUrl && (
        <div className="aspect-video relative overflow-hidden">
          <Image
            src={bildUrl}
            alt={titel}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-heading text-h3 text-text-heading mb-1">{titel}</h3>
        <div className="flex items-center gap-2 text-xs text-text-body mb-2">
          <time>{new Date(createdAt).toLocaleDateString('de-DE')}</time>
          {sparte && (
            <>
              <span>·</span>
              <span>{sparte.name}</span>
            </>
          )}
        </div>
        {auszug && <p className="text-sm text-text-body line-clamp-3">{auszug}</p>}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Aktuelles-Seite ersetzen**

```tsx
// src/app/aktuelles/page.tsx
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Container } from '@/components/layout/container'
import { BeitragCard } from '@/components/beitraege/beitrag-card'

export const metadata: Metadata = {
  title: 'Aktuelles',
  description: 'Neuigkeiten aus dem Verein und den Sparten.',
}

export default async function AktuellesPage() {
  const beitraege = await prisma.beitrag.findMany({
    where: { veroeffentlicht: true },
    include: { sparte: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return (
    <section className="py-8 tablet:py-12">
      <Container>
        <h1 className="font-heading text-h1 text-text-heading mb-8">Aktuelles</h1>

        {beitraege.length === 0 ? (
          <p className="text-text-body">Noch keine Neuigkeiten vorhanden.</p>
        ) : (
          <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
            {beitraege.map((b) => (
              <BeitragCard
                key={b.id}
                titel={b.titel}
                slug={b.slug}
                auszug={b.auszug}
                bildUrl={b.bildUrl}
                sparte={b.sparte}
                createdAt={b.createdAt.toISOString()}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
```

- [ ] **Step 3: Einzelner Beitrag**

```tsx
// src/app/aktuelles/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Container } from '@/components/layout/container'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const beitrag = await prisma.beitrag.findUnique({ where: { slug }, select: { titel: true, auszug: true } })
  if (!beitrag) return { title: 'Nicht gefunden' }
  return { title: beitrag.titel, description: beitrag.auszug || undefined }
}

export default async function BeitragPage({ params }: Props) {
  const { slug } = await params

  const beitrag = await prisma.beitrag.findUnique({
    where: { slug },
    include: { sparte: { select: { name: true, slug: true } } },
  })

  if (!beitrag || !beitrag.veroeffentlicht) notFound()

  return (
    <article className="py-8 tablet:py-12">
      <Container className="max-w-3xl">
        {beitrag.bildUrl && (
          <div className="aspect-video relative rounded-lg overflow-hidden mb-6">
            <Image
              src={beitrag.bildUrl}
              alt={beitrag.titel}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        <h1 className="font-heading text-h1 text-text-heading mb-2">{beitrag.titel}</h1>

        <div className="flex items-center gap-2 text-sm text-text-body mb-8">
          <time>{new Date(beitrag.createdAt).toLocaleDateString('de-DE')}</time>
          {beitrag.sparte && (
            <>
              <span>·</span>
              <Link href={`/sparten/${beitrag.sparte.slug}`} className="text-primary hover:text-primary-hover">
                {beitrag.sparte.name}
              </Link>
            </>
          )}
        </div>

        <div
          className="prose prose-sm max-w-none text-text-body"
          dangerouslySetInnerHTML={{ __html: beitrag.inhalt }}
        />

        <div className="mt-8 pt-8 border-t border-border">
          <Link href="/aktuelles" className="text-primary hover:text-primary-hover text-sm">
            ← Zurück zu Aktuelles
          </Link>
        </div>
      </Container>
    </article>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/beitraege/ src/app/aktuelles/
git commit -m "feat: public news pages with listing and detail view"
```

---

### Task 11: Admin-Sidebar erweitern + Layout für Spartenleiter

**Files:**
- Modify: `src/components/admin/sidebar.tsx`
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: Sidebar mit rollenbasierter Navigation**

```tsx
// src/components/admin/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  role: string
}

const ADMIN_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/antraege', label: 'Mitgliedsanträge' },
  { href: '/admin/sparten', label: 'Sparten' },
  { href: '/admin/beitraege', label: 'Beiträge' },
  { href: '/admin/nutzer', label: 'Nutzer' },
]

const LEITER_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/sparten', label: 'Meine Sparte' },
  { href: '/admin/beitraege', label: 'Beiträge' },
]

export function AdminSidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const items = role === 'ADMIN' ? ADMIN_ITEMS : LEITER_ITEMS

  return (
    <aside className="w-full tablet:w-64 bg-white border-b tablet:border-b-0 tablet:border-r border-border shrink-0">
      <nav className="flex tablet:flex-col p-2 tablet:p-4 gap-1 overflow-x-auto">
        {items.map((item) => {
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
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Admin-Layout für Spartenleiter/Kursleiter öffnen**

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

  const allowedRoles = ['ADMIN', 'SPARTENLEITER', 'KURSLEITER']
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/')
  }

  return (
    <div className="flex flex-col tablet:flex-row min-h-[calc(100vh-64px)]">
      <AdminSidebar role={session.user.role} />
      <div className="flex-1 p-4 tablet:p-8 bg-section-alt">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/sidebar.tsx src/app/admin/layout.tsx
git commit -m "feat: extend admin layout for Spartenleiter and Kursleiter roles"
```

---

### Task 12: Admin — Sparten-Verwaltung

**Files:**
- Create: `src/app/admin/sparten/page.tsx`
- Create: `src/app/admin/sparten/[id]/page.tsx`
- Create: `src/components/admin/sparte-edit-form.tsx`
- Create: `src/components/admin/trainingszeiten-editor.tsx`
- Create: `src/components/admin/ansprechpartner-editor.tsx`
- Create: `src/components/admin/bild-upload.tsx`

- [ ] **Step 1: Trainingszeiten-Editor**

```tsx
// src/components/admin/trainingszeiten-editor.tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const WOCHENTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

interface Trainingszeit {
  id?: string
  wochentag: number
  startzeit: string
  endzeit: string
  ort: string
  hinweis: string
}

interface Props {
  initial: Trainingszeit[]
  sparteSlug: string
}

export function TrainingszeitenEditor({ initial, sparteSlug }: Props) {
  const [zeiten, setZeiten] = useState<Trainingszeit[]>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function addZeit() {
    setZeiten([...zeiten, { wochentag: 0, startzeit: '18:00', endzeit: '20:00', ort: '', hinweis: '' }])
  }

  function removeZeit(index: number) {
    setZeiten(zeiten.filter((_, i) => i !== index))
  }

  function updateZeit(index: number, field: keyof Trainingszeit, value: string | number) {
    const updated = [...zeiten]
    updated[index] = { ...updated[index], [field]: value }
    setZeiten(updated)
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/v1/sparten/${sparteSlug}/trainingszeiten`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingszeiten: zeiten }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-h3 text-text-heading">Trainingszeiten</h3>
        <Button variant="outline" className="text-sm" onClick={addZeit}>+ Hinzufügen</Button>
      </div>

      {zeiten.map((z, i) => (
        <div key={i} className="bg-white p-4 rounded-md border border-border space-y-3">
          <div className="flex justify-between items-center">
            <select
              value={z.wochentag}
              onChange={(e) => updateZeit(i, 'wochentag', parseInt(e.target.value))}
              className="rounded-md border border-border px-3 py-2 text-sm bg-white"
            >
              {WOCHENTAGE.map((tag, wi) => (
                <option key={wi} value={wi}>{tag}</option>
              ))}
            </select>
            <button onClick={() => removeZeit(i)} className="text-error text-sm hover:underline min-h-[44px] px-2">
              Entfernen
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Von" type="time" value={z.startzeit} onChange={(e) => updateZeit(i, 'startzeit', e.target.value)} />
            <Input label="Bis" type="time" value={z.endzeit} onChange={(e) => updateZeit(i, 'endzeit', e.target.value)} />
          </div>
          <Input label="Ort" value={z.ort} onChange={(e) => updateZeit(i, 'ort', e.target.value)} />
          <Input label="Hinweis" value={z.hinweis} onChange={(e) => updateZeit(i, 'hinweis', e.target.value)} />
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</Button>
        {saved && <span className="text-sm text-success">Gespeichert!</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Ansprechpartner-Editor**

```tsx
// src/components/admin/ansprechpartner-editor.tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface AnsprechpartnerItem {
  id?: string
  name: string
  rolle: string
  telefon: string
  email: string
}

interface Props {
  initial: AnsprechpartnerItem[]
  sparteSlug: string
}

export function AnsprechpartnerEditor({ initial, sparteSlug }: Props) {
  const [personen, setPersonen] = useState<AnsprechpartnerItem[]>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function add() {
    setPersonen([...personen, { name: '', rolle: '', telefon: '', email: '' }])
  }

  function remove(index: number) {
    setPersonen(personen.filter((_, i) => i !== index))
  }

  function update(index: number, field: keyof AnsprechpartnerItem, value: string) {
    const updated = [...personen]
    updated[index] = { ...updated[index], [field]: value }
    setPersonen(updated)
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/v1/sparten/${sparteSlug}/ansprechpartner`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ansprechpartner: personen }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-h3 text-text-heading">Ansprechpartner</h3>
        <Button variant="outline" className="text-sm" onClick={add}>+ Hinzufügen</Button>
      </div>

      {personen.map((p, i) => (
        <div key={i} className="bg-white p-4 rounded-md border border-border space-y-3">
          <div className="flex justify-end">
            <button onClick={() => remove(i)} className="text-error text-sm hover:underline min-h-[44px] px-2">
              Entfernen
            </button>
          </div>
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
            <Input label="Name" value={p.name} onChange={(e) => update(i, 'name', e.target.value)} required />
            <Input label="Rolle" value={p.rolle} onChange={(e) => update(i, 'rolle', e.target.value)} placeholder="z.B. Spartenleiter" />
          </div>
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
            <Input label="Telefon" type="tel" value={p.telefon} onChange={(e) => update(i, 'telefon', e.target.value)} />
            <Input label="E-Mail" type="email" value={p.email} onChange={(e) => update(i, 'email', e.target.value)} />
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</Button>
        {saved && <span className="text-sm text-success">Gespeichert!</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Bild-Upload Komponente**

```tsx
// src/components/admin/bild-upload.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface Bild {
  id: string
  url: string
  alt: string | null
}

interface Props {
  initial: Bild[]
  sparteSlug: string
}

export function BildUpload({ initial, sparteSlug }: Props) {
  const [bilder, setBilder] = useState<Bild[]>(initial)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/v1/sparten/${sparteSlug}/bilder`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const body = await res.json()
        setBilder([...bilder, body.data])
      }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDelete(bildId: string) {
    const res = await fetch(`/api/v1/sparten/${sparteSlug}/bilder?id=${bildId}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      setBilder(bilder.filter((b) => b.id !== bildId))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-h3 text-text-heading">Bilder</h3>
        <label className="cursor-pointer">
          <Button variant="outline" className="text-sm pointer-events-none" disabled={uploading}>
            {uploading ? 'Hochladen...' : '+ Bild hochladen'}
          </Button>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      </div>

      {bilder.length === 0 && <p className="text-sm text-text-body">Noch keine Bilder hochgeladen.</p>}

      <div className="grid grid-cols-2 tablet:grid-cols-3 gap-3">
        {bilder.map((bild) => (
          <div key={bild.id} className="relative group">
            <div className="aspect-video relative rounded-md overflow-hidden border border-border">
              <Image src={bild.url} alt={bild.alt || ''} fill className="object-cover" sizes="200px" />
            </div>
            <button
              onClick={() => handleDelete(bild.id)}
              className="absolute top-1 right-1 bg-error text-white rounded-full w-6 h-6 text-xs
                opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Sparte-Bearbeitungsformular**

```tsx
// src/components/admin/sparte-edit-form.tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TiptapEditor } from '@/components/ui/tiptap-editor'

interface Props {
  sparte: {
    slug: string
    name: string
    beschreibung: string | null
    typ: string
    isActive: boolean
  }
  isAdmin: boolean
}

export function SparteEditForm({ sparte, isAdmin }: Props) {
  const [name, setName] = useState(sparte.name)
  const [beschreibung, setBeschreibung] = useState(sparte.beschreibung || '')
  const [isActive, setIsActive] = useState(sparte.isActive)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/v1/sparten/${sparte.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isAdmin && { name }),
          beschreibung,
          ...(isAdmin && { isActive }),
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
      <h3 className="font-heading text-h3 text-text-heading">Allgemein</h3>

      {isAdmin && (
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      )}

      <div>
        <label className="block text-sm font-medium text-text-heading mb-1">Beschreibung</label>
        <TiptapEditor content={beschreibung} onChange={setBeschreibung} placeholder="Beschreibung der Sparte..." />
      </div>

      {isAdmin && (
        <label className="flex items-center gap-2 min-h-[44px]">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          <span className="text-text-heading text-sm">Aktiv (auf der Website sichtbar)</span>
        </label>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</Button>
        {saved && <span className="text-sm text-success">Gespeichert!</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Sparten-Verwaltungsseite (Liste)**

```tsx
// src/app/admin/sparten/page.tsx
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'

export default async function AdminSpartenPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Spartenleiter: redirect to their sparte
  if (session.user.role !== 'ADMIN' && session.user.sparteId) {
    const sparte = await prisma.sparte.findFirst({
      where: { id: session.user.sparteId },
      select: { id: true },
    })
    if (sparte) redirect(`/admin/sparten/${sparte.id}`)
  }

  const sparten = await prisma.sparte.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { trainingszeiten: true, ansprechpartner: true, bilder: true } },
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-h1 text-text-heading">Sparten-Verwaltung</h1>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-section-alt">
              <th className="text-left p-3 font-medium text-text-heading">Name</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Typ</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Status</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Inhalte</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {sparten.map((s) => (
              <tr key={s.id} className="border-b border-border-light hover:bg-section-alt">
                <td className="p-3 font-medium text-text-heading">{s.name}</td>
                <td className="p-3 hidden tablet:table-cell text-text-body">
                  {s.typ === 'KURS' ? 'Kurs' : 'Sparte'}
                </td>
                <td className="p-3 hidden tablet:table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {s.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="p-3 hidden tablet:table-cell text-text-body text-xs">
                  {s._count.trainingszeiten} Zeiten · {s._count.ansprechpartner} Kontakte · {s._count.bilder} Bilder
                </td>
                <td className="p-3">
                  <Link href={`/admin/sparten/${s.id}`} className="text-primary hover:text-primary-hover text-sm">
                    Bearbeiten
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

- [ ] **Step 6: Sparte-Bearbeitungsseite**

```tsx
// src/app/admin/sparten/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SparteEditForm } from '@/components/admin/sparte-edit-form'
import { TrainingszeitenEditor } from '@/components/admin/trainingszeiten-editor'
import { AnsprechpartnerEditor } from '@/components/admin/ansprechpartner-editor'
import { BildUpload } from '@/components/admin/bild-upload'

export default async function SparteEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params

  const sparte = await prisma.sparte.findUnique({
    where: { id },
    include: {
      trainingszeiten: { orderBy: { wochentag: 'asc' } },
      ansprechpartner: true,
      bilder: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!sparte) notFound()

  // Check permissions
  const isAdmin = session.user.role === 'ADMIN'
  if (!isAdmin && session.user.sparteId !== sparte.id) {
    redirect('/admin')
  }

  const trainingszeiten = sparte.trainingszeiten.map((t) => ({
    id: t.id,
    wochentag: t.wochentag,
    startzeit: t.startzeit,
    endzeit: t.endzeit,
    ort: t.ort || '',
    hinweis: t.hinweis || '',
  }))

  const ansprechpartner = sparte.ansprechpartner.map((a) => ({
    id: a.id,
    name: a.name,
    rolle: a.rolle || '',
    telefon: a.telefon || '',
    email: a.email || '',
  }))

  return (
    <div>
      {isAdmin && (
        <Link href="/admin/sparten" className="text-sm text-primary hover:text-primary-hover mb-4 inline-block">
          ← Zurück zur Liste
        </Link>
      )}

      <h1 className="font-heading text-h1 text-text-heading mb-6">{sparte.name} bearbeiten</h1>

      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg border border-border">
          <SparteEditForm
            sparte={{ slug: sparte.slug, name: sparte.name, beschreibung: sparte.beschreibung, typ: sparte.typ, isActive: sparte.isActive }}
            isAdmin={isAdmin}
          />
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <TrainingszeitenEditor initial={trainingszeiten} sparteSlug={sparte.slug} />
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <AnsprechpartnerEditor initial={ansprechpartner} sparteSlug={sparte.slug} />
        </div>

        <div className="bg-white p-6 rounded-lg border border-border">
          <BildUpload initial={sparte.bilder} sparteSlug={sparte.slug} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/sparten/ src/components/admin/sparte-edit-form.tsx src/components/admin/trainingszeiten-editor.tsx src/components/admin/ansprechpartner-editor.tsx src/components/admin/bild-upload.tsx
git commit -m "feat: admin Sparten management with Tiptap, trainingszeiten, ansprechpartner, images"
```

---

### Task 13: Admin — Beiträge-Verwaltung

**Files:**
- Create: `src/app/admin/beitraege/page.tsx`
- Create: `src/app/admin/beitraege/neu/page.tsx`
- Create: `src/app/admin/beitraege/[id]/page.tsx`
- Create: `src/components/admin/beitrag-form.tsx`

- [ ] **Step 1: Beitrag-Formular Komponente**

```tsx
// src/components/admin/beitrag-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TiptapEditor } from '@/components/ui/tiptap-editor'

interface SparteOption {
  id: string
  name: string
}

interface BeitragFormProps {
  beitrag?: {
    id: string
    titel: string
    inhalt: string
    auszug: string | null
    bildUrl: string | null
    sparteId: string | null
    veroeffentlicht: boolean
  }
  sparten: SparteOption[]
}

export function BeitragForm({ beitrag, sparten }: BeitragFormProps) {
  const router = useRouter()
  const isNew = !beitrag

  const [titel, setTitel] = useState(beitrag?.titel || '')
  const [inhalt, setInhalt] = useState(beitrag?.inhalt || '')
  const [auszug, setAuszug] = useState(beitrag?.auszug || '')
  const [bildUrl, setBildUrl] = useState(beitrag?.bildUrl || '')
  const [sparteId, setSparteId] = useState(beitrag?.sparteId || '')
  const [veroeffentlicht, setVeroeffentlicht] = useState(beitrag?.veroeffentlicht ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/v1/upload', { method: 'POST', body: formData })
    if (res.ok) {
      const body = await res.json()
      setBildUrl(body.data.url)
    }
    e.target.value = ''
  }

  async function save() {
    setSaving(true)
    setError('')

    try {
      const url = isNew ? '/api/v1/beitraege' : `/api/v1/beitraege/${beitrag!.id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titel, inhalt, auszug: auszug || undefined, bildUrl: bildUrl || undefined, sparteId: sparteId || undefined, veroeffentlicht }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error?.message || 'Fehler beim Speichern')
        return
      }

      router.push('/admin/beitraege')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-error rounded-md text-sm">{error}</div>}

      <Input label="Titel" value={titel} onChange={(e) => setTitel(e.target.value)} required />

      <div>
        <label className="block text-sm font-medium text-text-heading mb-1">Inhalt</label>
        <TiptapEditor content={inhalt} onChange={setInhalt} placeholder="Beitragsinhalt..." />
      </div>

      <Input label="Auszug (kurze Vorschau)" value={auszug} onChange={(e) => setAuszug(e.target.value)} hint="Optional. Wird in der Übersicht angezeigt." />

      <div>
        <label className="block text-sm font-medium text-text-heading mb-1">Beitragsbild</label>
        <div className="flex items-center gap-3">
          {bildUrl && <img src={bildUrl} alt="Vorschau" className="w-20 h-14 object-cover rounded border border-border" />}
          <label className="cursor-pointer">
            <Button variant="outline" className="text-sm pointer-events-none">Bild wählen</Button>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
          {bildUrl && <button onClick={() => setBildUrl('')} className="text-sm text-error">Entfernen</button>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-heading mb-1">Sparte</label>
        <select
          value={sparteId}
          onChange={(e) => setSparteId(e.target.value)}
          className="w-full rounded-md border border-border px-4 py-3 text-text-heading bg-white"
        >
          <option value="">Keine Zuordnung (Vereinsnews)</option>
          {sparten.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 min-h-[44px]">
        <input
          type="checkbox"
          checked={veroeffentlicht}
          onChange={(e) => setVeroeffentlicht(e.target.checked)}
          className="accent-primary w-4 h-4"
        />
        <span className="text-text-heading text-sm">Veröffentlicht</span>
      </label>

      <div className="flex gap-3 pt-4">
        <Button onClick={save} disabled={saving}>{saving ? 'Speichern...' : isNew ? 'Erstellen' : 'Speichern'}</Button>
        <Button variant="outline" onClick={() => router.back()}>Abbrechen</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Beiträge-Liste**

```tsx
// src/app/admin/beitraege/page.tsx
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'

export default async function AdminBeitraegePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const where: Record<string, unknown> = {}
  // Spartenleiter: only their own sparte's articles or their authored ones
  if (session.user.role !== 'ADMIN') {
    where.OR = [
      { authorId: session.user.id },
      ...(session.user.sparteId ? [{ sparteId: session.user.sparteId }] : []),
    ]
  }

  const beitraege = await prisma.beitrag.findMany({
    where,
    include: { sparte: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-h1 text-text-heading">Beiträge</h1>
        <Link href="/admin/beitraege/neu">
          <Button className="text-sm">+ Neuer Beitrag</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-section-alt">
              <th className="text-left p-3 font-medium text-text-heading">Titel</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Sparte</th>
              <th className="text-left p-3 font-medium text-text-heading">Status</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Datum</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {beitraege.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-body">Keine Beiträge vorhanden.</td></tr>
            ) : (
              beitraege.map((b) => (
                <tr key={b.id} className="border-b border-border-light hover:bg-section-alt">
                  <td className="p-3 font-medium text-text-heading">{b.titel}</td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">{b.sparte?.name || '—'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.veroeffentlicht ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {b.veroeffentlicht ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </td>
                  <td className="p-3 hidden tablet:table-cell text-text-body">
                    {b.createdAt.toLocaleDateString('de-DE')}
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/beitraege/${b.id}`} className="text-primary hover:text-primary-hover text-sm">
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

- [ ] **Step 3: Neuer Beitrag Seite**

```tsx
// src/app/admin/beitraege/neu/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BeitragForm } from '@/components/admin/beitrag-form'

export default async function NeuBeitragPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const sparten = await prisma.sparte.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <h1 className="font-heading text-h1 text-text-heading mb-6">Neuer Beitrag</h1>
      <div className="bg-white p-6 rounded-lg border border-border max-w-3xl">
        <BeitragForm sparten={sparten} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Beitrag bearbeiten Seite**

```tsx
// src/app/admin/beitraege/[id]/page.tsx
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { BeitragForm } from '@/components/admin/beitrag-form'

export default async function BeitragEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params

  const beitrag = await prisma.beitrag.findUnique({ where: { id } })
  if (!beitrag) notFound()

  // Only author or admin can edit
  if (session.user.role !== 'ADMIN' && beitrag.authorId !== session.user.id) {
    redirect('/admin/beitraege')
  }

  const sparten = await prisma.sparte.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <Link href="/admin/beitraege" className="text-sm text-primary hover:text-primary-hover mb-4 inline-block">
        ← Zurück zur Liste
      </Link>
      <h1 className="font-heading text-h1 text-text-heading mb-6">Beitrag bearbeiten</h1>
      <div className="bg-white p-6 rounded-lg border border-border max-w-3xl">
        <BeitragForm beitrag={beitrag} sparten={sparten} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/beitraege/ src/components/admin/beitrag-form.tsx
git commit -m "feat: admin Beiträge management with Tiptap editor"
```

---

### Task 14: Admin — Nutzerverwaltung

**Files:**
- Create: `src/app/admin/nutzer/page.tsx`
- Create: `src/components/admin/nutzer-verwaltung.tsx`

- [ ] **Step 1: Nutzer-Verwaltung Komponente**

```tsx
// src/components/admin/nutzer-verwaltung.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface User {
  id: string
  email: string
  name: string
  role: string
  sparteId: string | null
  sparte: { name: string } | null
  isActive: boolean
}

interface SparteOption {
  id: string
  name: string
}

export function NutzerVerwaltung({ sparten }: { sparten: SparteOption[] }) {
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'SPARTENLEITER', sparteId: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/v1/admin/nutzer')
    if (res.ok) {
      const body = await res.json()
      setUsers(body.data || [])
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function createUser() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/v1/admin/nutzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error?.message || 'Fehler')
        return
      }
      setShowForm(false)
      setForm({ email: '', name: '', password: '', role: 'SPARTENLEITER', sparteId: '' })
      load()
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(user: User) {
    await fetch(`/api/v1/admin/nutzer?id=${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive }),
    })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-h1 text-text-heading">Nutzerverwaltung</h1>
        <Button className="text-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Abbrechen' : '+ Neuer Nutzer'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-border mb-6 max-w-lg space-y-3">
          {error && <p className="text-sm text-error">{error}</p>}
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="E-Mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Passwort" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-text-heading mb-1">Rolle</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-md border border-border px-4 py-3 bg-white">
              <option value="ADMIN">Admin</option>
              <option value="SPARTENLEITER">Spartenleiter</option>
              <option value="KURSLEITER">Kursleiter</option>
            </select>
          </div>
          {form.role !== 'ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-text-heading mb-1">Zugeordnete Sparte</label>
              <select value={form.sparteId} onChange={(e) => setForm({ ...form, sparteId: e.target.value })} className="w-full rounded-md border border-border px-4 py-3 bg-white">
                <option value="">Keine</option>
                {sparten.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <Button onClick={createUser} disabled={saving}>{saving ? 'Erstellen...' : 'Nutzer erstellen'}</Button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-section-alt">
              <th className="text-left p-3 font-medium text-text-heading">Name</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">E-Mail</th>
              <th className="text-left p-3 font-medium text-text-heading">Rolle</th>
              <th className="text-left p-3 font-medium text-text-heading hidden tablet:table-cell">Sparte</th>
              <th className="text-left p-3 font-medium text-text-heading">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border-light hover:bg-section-alt">
                <td className="p-3 font-medium text-text-heading">{u.name}</td>
                <td className="p-3 hidden tablet:table-cell text-text-body">{u.email}</td>
                <td className="p-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary">{u.role}</span>
                </td>
                <td className="p-3 hidden tablet:table-cell text-text-body">{u.sparte?.name || '—'}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {u.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="p-3">
                  <button onClick={() => toggleActive(u)} className="text-sm text-primary hover:text-primary-hover">
                    {u.isActive ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
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

- [ ] **Step 2: Nutzer-Seite**

```tsx
// src/app/admin/nutzer/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { NutzerVerwaltung } from '@/components/admin/nutzer-verwaltung'

export default async function NutzerPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/admin')

  const sparten = await prisma.sparte.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return <NutzerVerwaltung sparten={sparten} />
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/nutzer/ src/components/admin/nutzer-verwaltung.tsx
git commit -m "feat: admin user management page"
```

---

### Task 15: Smoke-Test Phase 3

- [ ] **Step 1: Alle Tests ausführen**

Run:
```bash
npx vitest run
```

Expected: Alle Tests grün (bisherige 31 + Slug 7 = ~38 Tests).

- [ ] **Step 2: Dev-Server manuell testen**

Run: `npm run dev`

Teste:
1. `http://localhost:3000/angebote` — Sparten-Übersicht mit Cards
2. `http://localhost:3000/sparten/fussball` — Spartenseite (noch ohne Beschreibung/Bilder)
3. `http://localhost:3000/aktuelles` — News-Seite (noch leer)
4. Admin-Login → Sparten → Fußball bearbeiten → Beschreibung mit Tiptap schreiben → Speichern
5. Admin → Sparten → Trainingszeiten hinzufügen → Speichern
6. Admin → Sparten → Ansprechpartner hinzufügen → Speichern
7. Admin → Beiträge → Neuer Beitrag → Veröffentlichen
8. Admin → Nutzer → Neuen Spartenleiter anlegen → Sparte zuweisen
9. Spartenseite refreshen → Beschreibung + Trainingszeiten sichtbar
10. Aktuelles refreshen → Neuer Beitrag sichtbar

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: Phase 3 complete — Sparten CMS + News"
```

---

## Summary

| Task | Was | Tests |
|---|---|---|
| 1 | Dependencies (Tiptap, Sharp) | — |
| 2 | Slug-Utility | 7 Tests |
| 3 | Datei-Upload Utility + API | — |
| 4 | Zod-Schemas (Sparten, Beiträge) | — |
| 5 | Tiptap-Editor Komponente | — |
| 6 | Sparten API CRUD | — |
| 7 | Beiträge API CRUD | — |
| 8 | Nutzerverwaltung API | — |
| 9 | Öffentliche Sparten-Seiten | — |
| 10 | Öffentliche News-Seiten | — |
| 11 | Admin-Sidebar + Layout erweitert | — |
| 12 | Admin: Sparten-Verwaltung | — |
| 13 | Admin: Beiträge-Verwaltung | — |
| 14 | Admin: Nutzerverwaltung | — |
| 15 | Smoke-Test | ~38 Tests total |

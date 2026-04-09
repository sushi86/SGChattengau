import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { requireRole } from '@/lib/auth-middleware'
import { ValidationError, NotFoundError } from '@/lib/api-error'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const nutzerCreateSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  role: z.enum(['ADMIN', 'SPARTENLEITER', 'KURSLEITER']).optional(),
  sparteId: z.string().optional(),
  isActive: z.boolean().optional(),
})

const nutzerUpdateSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse').optional(),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein').optional(),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein').optional(),
  role: z.enum(['ADMIN', 'SPARTENLEITER', 'KURSLEITER']).optional(),
  sparteId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const authenticate = requireRole('ADMIN')
    await authenticate(req)

    const nutzer = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        sparteId: true,
        sparte: { select: { id: true, name: true } },
        isActive: true,
        createdAt: true,
        updatedAt: true,
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
    const authenticate = requireRole('ADMIN')
    await authenticate(req)

    const body = await req.json()
    const parsed = nutzerCreateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Validierung fehlgeschlagen',
        parsed.error.issues.map((e) => ({ feld: e.path.join('.'), meldung: e.message }))
      )
    }

    const { email, password, name, role, sparteId, isActive } = parsed.data

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw new ValidationError('Ein Nutzer mit dieser E-Mail-Adresse existiert bereits')
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const nutzer = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role ?? 'SPARTENLEITER',
        sparteId: sparteId ?? null,
        isActive: isActive ?? true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        sparteId: true,
        isActive: true,
        createdAt: true,
      },
    })

    return apiSuccess(nutzer, 201)
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authenticate = requireRole('ADMIN')
    await authenticate(req)

    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      throw new ValidationError('Nutzer-ID fehlt')
    }

    const existingUser = await prisma.user.findUnique({ where: { id } })
    if (!existingUser) {
      throw new NotFoundError('Nutzer')
    }

    const body = await req.json()
    const parsed = nutzerUpdateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Validierung fehlgeschlagen',
        parsed.error.issues.map((e) => ({ feld: e.path.join('.'), meldung: e.message }))
      )
    }

    const { email, password, name, role, sparteId, isActive } = parsed.data

    // Check email uniqueness if email is being changed
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } })
      if (emailTaken) {
        throw new ValidationError('Ein Nutzer mit dieser E-Mail-Adresse existiert bereits')
      }
    }

    const updateData: Record<string, unknown> = {}
    if (email !== undefined) updateData.email = email
    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (sparteId !== undefined) updateData.sparteId = sparteId
    if (isActive !== undefined) updateData.isActive = isActive

    // Only hash password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12)
    }

    const nutzer = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        sparteId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiSuccess(nutzer)
  } catch (err) {
    return apiError(err)
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { ValidationError } from '@/lib/api-error'
import { requireRole } from '@/lib/auth-middleware'
import { buchungAdminCreateSchema } from '@/lib/validations/buchung'

// Admin: Tag blockieren oder Belegung einspeichern
export async function POST(req: NextRequest) {
  try {
    const checkAdmin = requireRole('ADMIN')
    await checkAdmin(req)

    const body = await req.json()
    const parsed = buchungAdminCreateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const d = parsed.data

    const buchung = await prisma.buchung.create({
      data: {
        name: d.name || 'Gesperrt',
        email: d.email || '',
        datum: new Date(d.datum),
        startzeit: 'Ganztags',
        endzeit: 'Ganztags',
        anlass: d.anlass,
        status: d.status || 'GENEHMIGT', // Default: direkt genehmigt (= belegt)
      },
    })

    return apiSuccess(buchung, 201)
  } catch (err) {
    return apiError(err)
  }
}

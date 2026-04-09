import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { ValidationError, UnauthorizedError, ForbiddenError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'

const adminCreateSchema = z.object({
  sparteId: z.string().min(1),
  vorname: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein'),
  nachname: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().or(z.literal('')),
  istMitglied: z.boolean(),
  verbleibend: z.number().int().min(1).max(10).optional(),
})

// POST: 10er-Karte manuell anlegen (Kursleiter/Admin, z.B. Barzahler)
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const body = await req.json()
    const parsed = adminCreateSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError(
        'Ungültige Eingabe',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      )
    }

    const d = parsed.data

    // Kursleiter darf nur für eigene Sparte anlegen
    if (user.role !== 'ADMIN' && user.sparteId !== d.sparteId) {
      throw new ForbiddenError()
    }

    const kurs = await prisma.sparte.findUnique({ where: { id: d.sparteId } })
    if (!kurs || kurs.typ !== 'KURS') {
      throw new ValidationError('Kein gültiger Kurs')
    }

    const preis = d.istMitglied
      ? (kurs.preisZehnerkarteMitglied || 30)
      : (kurs.preisZehnerkarteGast || 60)

    const karte = await prisma.zehnerkarte.create({
      data: {
        sparteId: d.sparteId,
        kaeuferVorname: d.vorname,
        kaeuferNachname: d.nachname,
        kaeuferEmail: d.email ? d.email.toLowerCase().trim() : '',
        istMitglied: d.istMitglied,
        preis,
        verbleibend: d.verbleibend ?? 10,
        // Keine Zahlung — manuell angelegt (Bar/Überweisung)
      },
    })

    return apiSuccess(karte, 201)
  } catch (err) {
    return apiError(err)
  }
}

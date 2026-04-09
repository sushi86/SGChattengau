import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/api-error'
import { authenticateRequest } from '@/lib/auth-middleware'
import { sendMail } from '@/lib/email'

// POST: 10er-Karte abstempeln (Kursleiter/Admin)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req)
    if (!user) throw new UnauthorizedError()

    const { id } = await params
    const karte = await prisma.zehnerkarte.findUnique({
      where: { id },
      include: { sparte: { select: { name: true } } },
    })

    if (!karte) throw new NotFoundError('10er-Karte')

    // Kursleiter darf nur eigene Sparte stempeln
    if (user.role !== 'ADMIN' && user.sparteId !== karte.sparteId) {
      throw new ForbiddenError()
    }

    if (karte.verbleibend <= 0) {
      throw new ValidationError('10er-Karte ist bereits aufgebraucht')
    }

    // Stempeln = verbleibend -1
    const updated = await prisma.zehnerkarte.update({
      where: { id },
      data: { verbleibend: { decrement: 1 } },
    })

    // E-Mail an Teilnehmer (fire-and-forget)
    const verbraucht = 10 - updated.verbleibend
    sendMail({
      to: karte.kaeuferEmail,
      subject: `${karte.sparte.name} — Stempel ${verbraucht}/10`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Stempel erhalten!</h2>
          <p>Hallo ${karte.kaeuferVorname},</p>
          <p>deine 10er-Karte für <strong>${karte.sparte.name}</strong> wurde abgestempelt.</p>
          <p style="font-size: 24px; font-weight: bold; color: #2ea3f2;">
            ${verbraucht} / 10 Stempel verwendet
          </p>
          <p>Noch <strong>${updated.verbleibend}</strong> ${updated.verbleibend === 1 ? 'Stempel' : 'Stempel'} übrig.</p>
          ${updated.verbleibend === 0 ? '<p style="color: #dc3545;"><strong>Deine 10er-Karte ist damit aufgebraucht.</strong></p>' : ''}
          <p style="color: #666; font-size: 14px; margin-top: 24px;">SG 1898 Chattengau e.V. — Wir bewegen Niedenstein!</p>
        </div>
      `,
      text: `Stempel erhalten! ${karte.sparte.name}: ${verbraucht}/10 Stempel verwendet. Noch ${updated.verbleibend} übrig.`,
    }).catch((err) => console.error('Stempel-E-Mail-Fehler:', err))

    return apiSuccess({ id: updated.id, verbleibend: updated.verbleibend })
  } catch (err) {
    return apiError(err)
  }
}

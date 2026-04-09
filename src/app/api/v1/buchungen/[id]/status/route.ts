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

    // E-Mail senden (fire-and-forget)
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

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { apiSuccess, apiError } from '@/lib/api-response'
import { NotFoundError } from '@/lib/api-error'
import { requireRole } from '@/lib/auth-middleware'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const checkAdmin = requireRole('ADMIN')
    await checkAdmin(req)

    const { id } = await params

    const antrag = await prisma.mitgliedsantrag.findUnique({
      where: { id },
      include: { sparte: { select: { name: true, typ: true } } },
    })

    if (!antrag) throw new NotFoundError('Mitgliedsantrag')

    // Decrypt sensitive fields for admin detail view
    return apiSuccess({
      ...antrag,
      ibanEncrypted: undefined,
      kontoinhaberEncrypted: undefined,
      signaturMitgliedEncrypted: undefined,
      signaturSepaEncrypted: undefined,
      signaturErzBerechEncrypted: undefined,
      iban: decrypt(antrag.ibanEncrypted),
      kontoinhaber: decrypt(antrag.kontoinhaberEncrypted),
      signaturMitglied: antrag.signaturMitgliedEncrypted
        ? decrypt(antrag.signaturMitgliedEncrypted)
        : null,
      signaturSepa: antrag.signaturSepaEncrypted
        ? decrypt(antrag.signaturSepaEncrypted)
        : null,
      signaturErzBerech: antrag.signaturErzBerechEncrypted
        ? decrypt(antrag.signaturErzBerechEncrypted)
        : null,
    })
  } catch (err) {
    return apiError(err)
  }
}

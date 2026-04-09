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

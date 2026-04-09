import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateIcal } from '@/lib/ical'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const sparteId = url.searchParams.get('sparte')

  const where: Record<string, unknown> = {}
  if (sparteId) {
    const ids = sparteId.split(',').filter(Boolean)
    if (ids.length === 1) {
      where.sparteId = ids[0]
    } else if (ids.length > 1) {
      where.sparteId = { in: ids }
    }
  }

  const termine = await prisma.termin.findMany({
    where,
    orderBy: { startzeit: 'asc' },
  })

  const ical = generateIcal(termine)

  return new NextResponse(ical, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="sg-chattengau-termine.ics"',
      'Cache-Control': 'public, max-age=300',
    },
  })
}

import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Container } from '@/components/layout/container'
import { Kalender } from '@/components/termine/kalender'
import { headers } from 'next/headers'

export const metadata: Metadata = {
  title: 'Termine',
  description: 'Alle Termine und Veranstaltungen der SG 1898 Chattengau e.V.',
}

export default async function TerminePage() {
  const sparten = await prisma.sparte.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { sortOrder: 'asc' },
  })

  // Get base URL for webcal link
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') || 'http'
  const baseUrl = `${proto}://${host}`

  return (
    <section className="py-8 tablet:py-12">
      <Container>
        <h1 className="font-heading text-h1 text-text-heading mb-6">Termine</h1>
        <Kalender sparten={sparten} baseUrl={baseUrl} />
      </Container>
    </section>
  )
}

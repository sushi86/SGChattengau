import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'
import { Belegungskalender } from '@/components/buchung/belegungskalender'

export const metadata: Metadata = {
  title: 'Vereinsheim-Belegung',
  description: 'Belegungskalender und Buchungsanfrage für das Vereinsheim der SG 1898 Chattengau e.V.',
}

export default function VereinsheimPage() {
  return (
    <section className="py-8 tablet:py-12">
      <Container className="max-w-3xl">
        <h1 className="font-heading text-h1 text-text-heading mb-4">Vereinsheim</h1>
        <p className="text-text-body mb-8">
          Unser Vereinsheim kann für private Feiern und Veranstaltungen gemietet werden.
          Klicke auf einen freien Tag, um eine Buchungsanfrage zu stellen.
        </p>
        <Belegungskalender />
      </Container>
    </section>
  )
}

import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'
import { AntragForm } from '@/components/mitmachen/antrag-form'

export const metadata: Metadata = {
  title: 'Mitglied werden',
  description: 'Werde Mitglied bei der SG 1898 Chattengau e.V. — Online-Mitgliedsantrag.',
}

export default function MitmachenPage() {
  return (
    <section className="py-8 tablet:py-12">
      <Container className="max-w-2xl">
        <h1 className="font-heading text-h1 text-text-heading mb-2">Mitglied werden</h1>
        <p className="text-text-body mb-8">
          Fülle den Antrag aus, um Mitglied bei der SG 1898 Chattengau e.V. zu werden.
          Alle mit <span className="text-error">*</span> markierten Felder sind Pflichtfelder.
        </p>
        <AntragForm />
      </Container>
    </section>
  )
}

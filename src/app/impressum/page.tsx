import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = { title: 'Impressum' }

export default function ImpressumPage() {
  return (
    <section className="py-12">
      <Container className="max-w-2xl">
        <h1 className="font-heading text-h1 text-text-heading mb-8">Impressum</h1>
        <div className="space-y-6 text-text-body">
          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">Angaben gemäß § 5 TMG</h2>
            <p>SG 1898 Chattengau e.V.<br />Niedenstein</p>
          </div>
          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">Vertreten durch</h2>
            <p>1. Vorsitzender: Christoph Eubel</p>
          </div>
          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">Registereintrag</h2>
            <p>Eingetragen im Vereinsregister.<br />Registergericht: Amtsgericht Fritzlar</p>
          </div>
          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>Christoph Eubel<br />SG 1898 Chattengau e.V.<br />Niedenstein</p>
          </div>
        </div>
      </Container>
    </section>
  )
}

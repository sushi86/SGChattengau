import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = { title: 'Kontakt' }

export default function KontaktPage() {
  return (
    <section className="py-12">
      <Container className="max-w-2xl">
        <h1 className="font-heading text-h1 text-text-heading mb-8">Kontakt</h1>
        <div className="space-y-4 text-text-body">
          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">Geschäftsstelle</h2>
            <p>SG 1898 Chattengau e.V.</p>
            <p>Niedenstein</p>
          </div>
          <div>
            <h2 className="font-heading text-h3 text-text-heading mb-2">1. Vorsitzender</h2>
            <p>Christoph Eubel</p>
          </div>
        </div>
      </Container>
    </section>
  )
}

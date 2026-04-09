import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <section className="py-16 tablet:py-24">
      <Container className="text-center max-w-lg">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="font-heading text-h2 text-text-heading mb-4">
          Seite nicht gefunden
        </h2>
        <p className="text-text-body mb-8">
          Die gewünschte Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="flex flex-col tablet:flex-row gap-4 justify-center">
          <Link href="/">
            <Button>Zur Startseite</Button>
          </Link>
          <Link href="/angebote">
            <Button variant="outline">Sportangebote</Button>
          </Link>
        </div>
      </Container>
    </section>
  )
}

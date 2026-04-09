import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <>
      <section
        className="relative py-16 tablet:py-28 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(46, 163, 242, 0.92) 0%, rgba(46, 163, 242, 0.75) 50%, rgba(46, 163, 242, 0.45) 100%), url('https://mein.toubiz.de/api/v1/media/9f5b202a-376c-4e8a-9828-332cb1eef58a/view')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        <Container className="text-center">
          <Image
            src="/logo.jpeg"
            alt="SG 1898 Chattengau"
            width={120}
            height={120}
            className="mx-auto rounded-full mb-6 w-auto h-auto"
            priority
          />
          <h1 className="font-heading text-h1 desktop:text-[1.875rem] text-white mb-4">
            Wir bewegen Niedenstein!
          </h1>
          <p className="text-white/80 max-w-xl mx-auto mb-8">
            Die Sportgemeinschaft 1898 Chattengau e.V. bietet dir über 18 Sparten
            und Kursangebote — von Fußball über Yoga bis Triathlon.
          </p>
          <div className="flex flex-col tablet:flex-row gap-4 justify-center tablet:items-center">
            <Link href="/mitmachen" className="w-full tablet:w-auto">
              <Button className="!bg-white !text-primary hover:!bg-white/90 font-bold w-full tablet:w-64 h-14 border-2 border-white">Mitglied werden</Button>
            </Link>
            <Link href="/angebote" className="w-full tablet:w-auto">
              <Button variant="outline" className="!border-white !text-white hover:!bg-white/10 w-full tablet:w-64">Sportangebote entdecken</Button>
            </Link>
          </div>
        </Container>
      </section>
      <section className="py-12 tablet:py-16">
        <Container>
          <h2 className="font-heading text-h2 text-text-heading text-center mb-8">
            Unser Verein
          </h2>
          <p className="text-text-body text-center max-w-2xl mx-auto">
            Seit 1898 sind wir der Sportverein für Niedenstein und die Region Chattengau.
            Mit über 18 Sparten und Kursangeboten ist für jeden etwas dabei —
            egal ob Jung oder Alt, Anfänger oder Fortgeschritten.
          </p>
        </Container>
      </section>
    </>
  )
}

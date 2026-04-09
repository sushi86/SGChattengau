import Link from 'next/link'
import Image from 'next/image'
import { Container } from './container'
import { MobileNav } from './mobile-nav'
import { Button } from '../ui/button'

const navLinks = [
  { href: '/', label: 'Startseite' },
  { href: '/angebote', label: 'Sportangebote' },
  { href: '/termine', label: 'Termine' },
  { href: '/aktuelles', label: 'Aktuelles' },
  { href: '/belegung-vereinsheim', label: 'Vereinsheim' },
  { href: '/kontakt', label: 'Kontakt' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border">
      <Container className="flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo.jpeg"
            alt="SG 1898 Chattengau"
            width={40}
            height={40}
            className="rounded-full w-auto h-auto"
          />
          <span className="hidden tablet:block font-heading font-bold text-text-heading">
            Wir bewegen Niedenstein!
          </span>
        </Link>

        <nav className="hidden tablet:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm text-text-body hover:text-primary
                rounded-md transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/mitmachen">
            <Button className="ml-2 text-sm">Mitglied werden</Button>
          </Link>
        </nav>

        <MobileNav />
      </Container>
    </header>
  )
}

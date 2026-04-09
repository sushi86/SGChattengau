import Link from 'next/link'
import { Container } from './container'

export function Footer() {
  return (
    <footer className="bg-text-heading text-white mt-auto">
      <Container className="py-8 tablet:py-12">
        <div className="grid grid-cols-1 tablet:grid-cols-3 gap-8">
          <div>
            <h3 className="font-heading font-bold text-lg mb-3">SG 1898 Chattengau e.V.</h3>
            <p className="text-sm text-gray-300">Wir bewegen Niedenstein!</p>
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg mb-3">Links</h3>
            <nav className="flex flex-col gap-2 text-sm text-gray-300">
              <Link href="/kontakt" className="hover:text-white transition-colors">Kontakt</Link>
              <Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link>
              <Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
            </nav>
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg mb-3">Kontakt</h3>
            <address className="not-italic text-sm text-gray-300 space-y-1">
              <p>SG 1898 Chattengau e.V.</p>
              <p>Niedenstein</p>
            </address>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-600 text-sm text-gray-400 text-center">
          &copy; {new Date().getFullYear()} SG 1898 Chattengau e.V. Alle Rechte vorbehalten.
        </div>
      </Container>
    </footer>
  )
}

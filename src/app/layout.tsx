import type { Metadata } from 'next'
import { Open_Sans, Archivo } from 'next/font/google'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import './globals.css'

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'SG 1898 Chattengau e.V. | Wir bewegen Niedenstein!',
    template: '%s | SG 1898 Chattengau e.V.',
  },
  description: 'Sportgemeinschaft 1898 Chattengau e.V. — Dein Sportverein in Niedenstein mit über 18 Sparten und Kursangeboten.',
  metadataBase: new URL('https://sg1898chattengau.de'),
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'SG 1898 Chattengau e.V.',
    title: 'SG 1898 Chattengau e.V. | Wir bewegen Niedenstein!',
    description: 'Dein Sportverein in Niedenstein mit über 18 Sparten und Kursangeboten.',
    images: [{ url: '/logo.jpeg', width: 400, height: 400, alt: 'SG 1898 Chattengau e.V.' }],
  },
  twitter: {
    card: 'summary',
    title: 'SG 1898 Chattengau e.V.',
    description: 'Wir bewegen Niedenstein!',
  },
  icons: {
    icon: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${openSans.variable} ${archivo.variable}`}>
      <head>
        <link rel="dns-prefetch" href="https://mein.toubiz.de" />
        <link rel="preconnect" href="https://mein.toubiz.de" crossOrigin="anonymous" />
      </head>
      <body className="font-sans text-body text-text-body bg-white min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SportsOrganization',
              name: 'SG 1898 Chattengau e.V.',
              description: 'Sportgemeinschaft 1898 Chattengau e.V. — Dein Sportverein in Niedenstein.',
              url: 'https://sg1898chattengau.de',
              logo: 'https://sg1898chattengau.de/logo.jpeg',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Niedenstein',
                addressCountry: 'DE',
              },
              sameAs: [],
            }),
          }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

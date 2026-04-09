'use client'

import { useState } from 'react'
import Link from 'next/link'

const navLinks = [
  { href: '/', label: 'Startseite' },
  { href: '/angebote', label: 'Sportangebote' },
  { href: '/termine', label: 'Termine' },
  { href: '/aktuelles', label: 'Aktuelles' },
  { href: '/mitmachen', label: 'Mitglied werden' },
  { href: '/belegung-vereinsheim', label: 'Vereinsheim' },
  { href: '/kontakt', label: 'Kontakt' },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="tablet:hidden flex items-center justify-center w-11 h-11"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
        aria-expanded={open}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="tablet:hidden fixed inset-0 top-[64px] z-50 bg-white">
          <nav className="flex flex-col p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 px-4 text-text-body hover:text-primary hover:bg-primary-light
                  rounded-md transition-colors min-h-[44px] flex items-center"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}

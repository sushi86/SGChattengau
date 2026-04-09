'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  role: string
}

const ADMIN_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/antraege', label: 'Mitgliedsanträge' },
  { href: '/admin/sparten', label: 'Sparten' },
  { href: '/admin/beitraege', label: 'Beiträge' },
  { href: '/admin/termine', label: 'Termine' },
  { href: '/admin/kurse', label: 'Kurse' },
  { href: '/admin/buchungen', label: 'Vereinsheim' },
  { href: '/admin/nutzer', label: 'Nutzer' },
]

const LEITER_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/sparten', label: 'Meine Sparte' },
  { href: '/admin/beitraege', label: 'Beiträge' },
  { href: '/admin/termine', label: 'Termine' },
  { href: '/admin/kurse', label: 'Teilnehmer' },
]

export function AdminSidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const items = role === 'ADMIN' ? ADMIN_ITEMS : LEITER_ITEMS

  return (
    <aside className="w-full tablet:w-64 bg-white border-b tablet:border-b-0 tablet:border-r border-border shrink-0">
      <nav className="flex tablet:flex-col p-2 tablet:p-4 gap-1 overflow-x-auto">
        {items.map((item) => {
          const active = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap
                min-h-[44px] transition-colors
                ${active
                  ? 'bg-primary-light text-primary font-medium'
                  : 'text-text-body hover:bg-section-alt hover:text-text-heading'}`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

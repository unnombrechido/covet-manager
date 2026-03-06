'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/houses', label: 'Houses' },
  { href: '/members', label: 'Members' },
  { href: '/rallies', label: 'Rallies' },
  { href: '/mvp', label: 'MVP' },
  { href: '/reports', label: 'Reports' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-purple-700 text-white shadow-lg">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">💎 Covet Manager</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                    ? 'bg-purple-900 text-white'
                    : 'text-purple-100 hover:bg-purple-600 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

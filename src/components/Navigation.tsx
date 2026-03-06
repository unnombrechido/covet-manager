'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

const LOCALE_LABELS: Record<string, string> = {
  en: '🇺🇸 EN',
  es: '🇪🇸 ES',
  pt: '🇧🇷 PT',
}

export default function Navigation() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const navLinks = [
    { href: `/${locale}`, label: t('home'), exact: true },
    { href: `/${locale}/houses`, label: t('houses') },
    { href: `/${locale}/members`, label: t('members') },
    { href: `/${locale}/rallies`, label: t('rallies') },
    { href: `/${locale}/mvp`, label: t('mvp') },
    { href: `/${locale}/reports`, label: t('reports') },
  ]

  const switchLocale = (newLocale: string) => {
    // Replace the current locale prefix in the pathname
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/') || `/${newLocale}`)
  }

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
                  link.exact
                    ? pathname === link.href
                      ? 'bg-purple-900 text-white'
                      : 'text-purple-100 hover:bg-purple-600 hover:text-white'
                    : pathname.startsWith(link.href)
                    ? 'bg-purple-900 text-white'
                    : 'text-purple-100 hover:bg-purple-600 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Language switcher */}
            <div className="relative ml-2 flex items-center gap-1 border-l border-purple-500 pl-3">
              {routing.locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => switchLocale(loc)}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                    locale === loc
                      ? 'bg-purple-900 text-white'
                      : 'text-purple-200 hover:bg-purple-600 hover:text-white'
                  }`}
                  title={t('language')}
                >
                  {LOCALE_LABELS[loc]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

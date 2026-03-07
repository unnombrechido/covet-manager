'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { routing } from '@/i18n/routing'
import { getSupabaseClient } from '@/lib/supabase'

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
  const [userId, setUserId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

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

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signInWithFacebook = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/${locale}`,
      },
    })
  }

  const signOut = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    await supabase.auth.signOut()
    setMenuOpen(false)
    router.push(`/${locale}`)
  }

  const copyUserId = async () => {
    if (!userId) return
    await navigator.clipboard.writeText(userId)
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

            <div className="relative ml-2 border-l border-purple-500 pl-3">
              {userId ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="w-9 h-9 rounded-full bg-purple-900 hover:bg-purple-800 text-white font-semibold"
                    title="Account"
                  >
                    U
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white text-gray-900 rounded-lg shadow-xl border border-gray-200 p-3 z-30">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Auth UUID</p>
                      <p className="text-xs break-all bg-gray-50 border border-gray-200 rounded p-2">{userId}</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={copyUserId}
                          className="flex-1 text-sm px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200"
                        >
                          Copy UUID
                        </button>
                        <button
                          type="button"
                          onClick={signOut}
                          className="flex-1 text-sm px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={signInWithFacebook}
                  className="px-3 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import Navigation from '@/components/Navigation'
import '../globals.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
    </NextIntlClientProvider>
  )
}

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

export default function Home() {
  const t = useTranslations('home')
  const locale = useLocale()

  const features = [
    { href: `/${locale}/houses`, icon: '🏠', titleKey: 'houses' },
    { href: `/${locale}/members`, icon: '👑', titleKey: 'members' },
    { href: `/${locale}/rallies`, icon: '🏆', titleKey: 'rallies' },
    { href: `/${locale}/mvp`, icon: '⭐', titleKey: 'mvp' },
    { href: `/${locale}/reports`, icon: '📊', titleKey: 'reports' },
  ] as const

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          💎 {t('title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400">
              {t(`features.${feature.titleKey}.title`)}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {t(`features.${feature.titleKey}.description`)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

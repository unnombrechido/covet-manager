import Link from 'next/link'

export default function Home() {
  const features = [
    { href: '/houses', icon: '🏠', title: 'Houses', description: 'Manage Covet Fashion houses and track their status' },
    { href: '/members', icon: '👑', title: 'Members', description: 'Add and manage house members with roles' },
    { href: '/rallies', icon: '🏆', title: 'Rallies', description: 'Create monthly rallies and track shows' },
    { href: '/mvp', icon: '⭐', title: 'MVP Rankings', description: 'See top performers for each month' },
    { href: '/reports', icon: '📊', title: 'Reports', description: 'Monthly summaries and statistics' },
  ]

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          💎 Welcome to Covet Manager
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Your all-in-one tool for managing Covet Fashion houses, tracking member performance, and running monthly rallies.
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
              {feature.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{feature.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

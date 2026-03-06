import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Covet Manager',
  description: 'Manage your Covet Fashion houses, members, rallies and scores',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navigation />
          <main className="container mx-auto px-4 py-8 max-w-7xl">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

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
    <html>
      <body className="font-sans">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {children}
        </div>
      </body>
    </html>
  )
}

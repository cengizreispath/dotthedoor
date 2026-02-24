import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dot the Door',
  description: 'Your invitation to a fresh start—where every dot represents a pause, a pivot, and a pathway to undiscovered opportunities.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jakarta'
})

export const metadata: Metadata = {
  title: 'Dot the Door',
  description: 'Your invitation to a fresh start—a place where every dot represents a pause, a pivot, and a pathway to undiscovered opportunities.',
  keywords: ['fresh start', 'new beginnings', 'personal growth', 'life change', 'opportunities'],
  authors: [{ name: 'Dot the Door' }],
  openGraph: {
    title: 'Dot the Door',
    description: 'Your invitation to a fresh start—a place where every dot represents a pause, a pivot, and a pathway to undiscovered opportunities.',
    url: 'https://dotthedoor.com',
    siteName: 'Dot the Door',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dot the Door',
    description: 'Your invitation to a fresh start.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://dotthedoor.com/#website',
      'url': 'https://dotthedoor.com',
      'name': 'Dot the Door',
      'description': 'Your invitation to a fresh start—a place where every dot represents a pause, a pivot, and a pathway to undiscovered opportunities.',
      'publisher': {
        '@id': 'https://dotthedoor.com/#organization'
      }
    },
    {
      '@type': 'Organization',
      '@id': 'https://dotthedoor.com/#organization',
      'name': 'Dot the Door',
      'url': 'https://dotthedoor.com',
      'email': 'info@dotthedoor.com',
      'description': 'A philosophy and platform for fresh starts, new beginnings, and embracing undiscovered opportunities.'
    },
    {
      '@type': 'WebPage',
      '@id': 'https://dotthedoor.com/#webpage',
      'url': 'https://dotthedoor.com',
      'name': 'Dot the Door - Your Invitation to a Fresh Start',
      'isPartOf': {
        '@id': 'https://dotthedoor.com/#website'
      },
      'about': {
        '@id': 'https://dotthedoor.com/#organization'
      },
      'description': 'Step beyond the ordinary, embrace new journeys, and redefine your path.'
    }
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3B6D8247MD"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-3B6D8247MD');
          `}
        </Script>
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${plusJakarta.variable} font-sans`}>{children}</body>
    </html>
  )
}

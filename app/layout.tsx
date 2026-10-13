import type { Metadata, Viewport } from 'next';
import { Nanum_Pen_Script, Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import Nav from '@/components/Nav';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-jakarta',
});
const hand = Nanum_Pen_Script({ subsets: ['latin'], weight: '400', variable: '--font-hand' });

const description = 'Every sentence ends with a dot. Write the one that comes next, keep it, or leave it on the Dot Wall.';

export const metadata: Metadata = {
  metadataBase: new URL('https://dotthedoor.com'),
  title: { default: 'Dot the Door', template: '%s · Dot the Door' },
  description,
  keywords: ['fresh start', 'new beginnings', 'next sentence', 'letting go', 'decisions', 'the Dot Wall'],
  authors: [{ name: 'Dot the Door' }],
  openGraph: { title: 'Dot the Door', description, url: 'https://dotthedoor.com', siteName: 'Dot the Door', locale: 'en_US', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Dot the Door', description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#F5F2EA',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://dotthedoor.com/#website',
      url: 'https://dotthedoor.com',
      name: 'Dot the Door',
      description,
      publisher: { '@id': 'https://dotthedoor.com/#organization' },
    },
    {
      '@type': 'Organization',
      '@id': 'https://dotthedoor.com/#organization',
      name: 'Dot the Door',
      url: 'https://dotthedoor.com',
      email: 'info@dotthedoor.com',
      description: 'A small place to write the sentence that comes next.',
    },
  ],
};

const GA_ID = 'G-3B6D8247MD';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${hand.variable}`}>
      <head>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <a className="skiplink" href="#main">Skip to content</a>
        <Nav />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}

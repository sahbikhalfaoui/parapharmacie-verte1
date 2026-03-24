import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import AnalyticsTracker from '@/components/Analytics'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://biopharma.tn'),
  icons: {
    icon: '/logo-icon_vff.png',
    shortcut: '/logo-icon_vff.png',
    apple: '/logo-icon_vff.png',
  },
  title: {
    default: 'BioPharma - Votre Parapharmacie en Ligne | Produits de Santé & Bien-être',
    template: '%s | BioPharma'
  },
  description: 'BioPharma - Votre partenaire santé de confiance depuis 5 ans. Découvrez nos produits pharmaceutiques, compléments alimentaires, cosmétiques et soins de beauté. Livraison rapide en Tunisie.',
  keywords: ['parapharmacie', 'pharmacie en ligne', 'produits de santé', 'bien-être', 'cosmétiques', 'compléments alimentaires', 'tunisie', 'biopharma', 'santé', 'beauté', 'soins corporels', 'vitamines'],
  authors: [{ name: 'BioPharma' }],
  creator: 'BioPharma',
  publisher: 'BioPharma',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_TN',
    url: 'https://biopharma.tn',
    title: 'BioPharma - Votre Parapharmacie en Ligne',
    description: 'Votre partenaire santé de confiance. Produits pharmaceutiques de qualité, livraison rapide en Tunisie.',
    siteName: 'BioPharma',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BioPharma - Parapharmacie en Ligne',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BioPharma - Votre Parapharmacie en Ligne',
    description: 'Votre partenaire santé de confiance. Produits pharmaceutiques de qualité.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://biopharma.tn',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#16a34a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://biopharma.tn/#organization',
        name: 'BioPharma',
        url: 'https://biopharma.tn',
        logo: {
          '@type': 'ImageObject',
          url: 'https://biopharma.tn/logo-icon_vff.png',
        },
        description: 'Votre parapharmacie en ligne de confiance en Tunisie. Produits pharmaceutiques, compléments alimentaires et cosmétiques.',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'TN',
        },
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://biopharma.tn/#website',
        url: 'https://biopharma.tn',
        name: 'BioPharma',
        publisher: { '@id': 'https://biopharma.tn/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://biopharma.tn/?search={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'WebPage',
        '@id': 'https://biopharma.tn/#webpage',
        url: 'https://biopharma.tn',
        name: 'BioPharma - Votre Parapharmacie en Ligne',
        isPartOf: { '@id': 'https://biopharma.tn/#website' },
        about: { '@id': 'https://biopharma.tn/#organization' },
        description: 'Découvrez nos produits pharmaceutiques, compléments alimentaires, cosmétiques et soins. Livraison rapide en Tunisie.',
      },
    ],
  }

  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/logo-icon_vff.png" type="image/png" />
        <link rel="shortcut icon" href="/logo-icon_vff.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo-icon_vff.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AnalyticsTracker />
        {children}
        <Analytics />
      </body>
    </html>
  )
}

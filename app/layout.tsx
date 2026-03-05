import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import AnalyticsTracker from '@/components/Analytics'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://biopharma.tn'),
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: '#16a34a',
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://biopharma.tn',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AnalyticsTracker />
        {children}
        <Analytics />
      </body>
    </html>
  )
}

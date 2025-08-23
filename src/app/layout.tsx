import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { generateSEOMetadata, generateJSONLD, StructuredData } from '@/components/SEO'
import { getSiteInfo, getSEOConfig, getTheme } from '@/lib/config'

const siteInfo = getSiteInfo()
const seoConfig = getSEOConfig()

export const metadata: Metadata = generateSEOMetadata({
  title: siteInfo.title,
  description: siteInfo.description,
  keywords: seoConfig.defaultKeywords,
  url: siteInfo.url,
  type: 'website'
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = getTheme()
  const jsonLD = generateJSONLD({
    title: siteInfo.title,
    description: siteInfo.description,
    url: siteInfo.url,
    type: 'website'
  })

  return (
    <html lang={theme.language} className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <StructuredData data={jsonLD} />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col antialiased">
        <Header />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
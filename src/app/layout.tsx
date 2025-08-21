import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { generateSEOMetadata, generateJSONLD, StructuredData } from '@/components/SEO'

export const metadata: Metadata = generateSEOMetadata({
  title: 'WebMaker - AI 자동 블로그 시스템',
  description: '키워드 기반 자동 콘텐츠 생성부터 SEO 최적화까지 완전 자동화된 블로그 시스템',
  keywords: ['AI', '블로그', '자동화', 'SEO', 'Next.js', 'GitHub Actions'],
  url: 'https://webmaker-ai-blog.vercel.app',
  type: 'website'
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLD = generateJSONLD({
    title: 'WebMaker - AI 자동 블로그 시스템',
    description: '키워드 기반 자동 콘텐츠 생성부터 SEO 최적화까지 완전 자동화된 블로그 시스템',
    url: 'https://webmaker-ai-blog.vercel.app',
    type: 'website'
  })

  return (
    <html lang="ko" className="scroll-smooth">
      <head>
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
import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'WebMaker - AI 자동 블로그 시스템',
  description: '키워드 기반 자동 콘텐츠 생성부터 SEO 최적화까지 완전 자동화된 블로그 시스템',
  keywords: 'AI, 블로그, 자동화, SEO, Next.js, GitHub Actions',
  authors: [{ name: 'WebMaker Team' }],
  openGraph: {
    title: 'WebMaker - AI 자동 블로그 시스템',
    description: '키워드 기반 자동 콘텐츠 생성부터 SEO 최적화까지',
    type: 'website',
    locale: 'ko_KR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="scroll-smooth">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
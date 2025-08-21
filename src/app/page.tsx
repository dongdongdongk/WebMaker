import { getAllPosts } from '@/lib/posts'
import PostList from '@/components/PostList'
import Link from 'next/link'

export default async function HomePage() {
  const posts = await getAllPosts()
  
  return (
    <div className="space-y-12">
      <section className="text-center py-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          AI 자동 블로그 시스템
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto px-4">
          키워드 기반 자동 콘텐츠 생성부터 SEO 최적화, GitHub Actions 자동 배포까지 
          완전 자동화된 차세대 블로그 플랫폼입니다.
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 mt-12 px-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              자동 키워드 수집
            </h3>
            <p className="text-gray-600 text-sm">
              Google Trends와 News API를 활용한 실시간 트렌드 키워드 자동 수집
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              AI 콘텐츠 생성
            </h3>
            <p className="text-gray-600 text-sm">
              OpenAI GPT를 활용한 고품질 블로그 콘텐츠 자동 생성 및 SEO 최적화
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              자동 배포
            </h3>
            <p className="text-gray-600 text-sm">
              GitHub Actions와 Vercel을 통한 완전 자동화된 배포 및 관리 시스템
            </p>
          </div>
        </div>
        
        <div className="mt-8">
          <Link 
            href="/design-preview" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-block"
          >
            디자인 시스템 보기
          </Link>
        </div>
      </section>
      
      <PostList posts={posts} />
    </div>
  )
}
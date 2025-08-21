import { getAllPosts, getAllTags } from '@/lib/posts'
import Image from 'next/image'
import Link from 'next/link'

export default async function HomePage() {
  const posts = await getAllPosts()
  const tags = await getAllTags()
  const featuredPost = posts[0] // 가장 최신 포스트를 대표 포스트로
  const recentPosts = posts.slice(1, 7) // 나머지 6개 포스트
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section - Blog Header */}
      <section className="text-center py-16 border-b border-gray-200">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
          WebMaker Blog
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          AI가 매일 생성하는 최신 기술 트렌드와 인사이트를 만나보세요
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {tags.slice(0, 6).map(({ tag, count }) => (
            <span
              key={tag}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {tag} ({count})
            </span>
          ))}
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">오늘의 추천 글</h2>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2">
                {featuredPost.image && (
                  <div className="relative h-64 md:h-full">
                    <Image
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="md:w-1/2 p-8">
                <div className="flex items-center mb-4">
                  <time className="text-sm text-gray-500">
                    {new Date(featuredPost.date).toLocaleDateString('ko-KR')}
                  </time>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-sm text-gray-500">{featuredPost.readingTime}분 읽기</span>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  <Link href={`/${featuredPost.slug}`} className="hover:text-blue-600 transition-colors">
                    {featuredPost.title}
                  </Link>
                </h3>
                
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {featuredPost.tags?.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <Link
                    href={`/${featuredPost.slug}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    더 읽기
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Posts Grid */}
      <section className="py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">최신 포스트</h2>
          <div className="text-sm text-gray-500">
            총 {posts.length}개의 글
          </div>
        </div>
        
        {recentPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.map((post) => (
              <article key={post.slug} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {post.image && (
                  <div className="relative h-48">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center mb-3 text-sm text-gray-500">
                    <time>{new Date(post.date).toLocaleDateString('ko-KR')}</time>
                    <span className="mx-2">•</span>
                    <span>{post.readingTime}분</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                    <Link href={`/${post.slug}`} className="hover:text-blue-600 transition-colors">
                      {post.title}
                    </Link>
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {post.tags?.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {post.author && (
                      <div className="text-xs text-gray-500">
                        by {post.author}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              추가 게시물이 없습니다
            </div>
            <p className="text-gray-400 text-sm">
              AI가 곧 새로운 콘텐츠를 생성할 예정입니다
            </p>
          </div>
        )}
      </section>

      {/* Blog Stats */}
      <section className="py-12 border-t border-gray-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">블로그 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-blue-600">{posts.length}</div>
              <div className="text-sm text-gray-600">총 포스트</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{tags.length}</div>
              <div className="text-sm text-gray-600">카테고리</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">24/7</div>
              <div className="text-sm text-gray-600">자동 운영</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">AI</div>
              <div className="text-sm text-gray-600">콘텐츠 생성</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
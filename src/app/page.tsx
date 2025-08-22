import { getAllPosts, getAllTags } from '@/lib/posts'
import Image from 'next/image'
import Link from 'next/link'
import LoadMoreButton from '@/components/LoadMoreButton'
import { getBranding } from '@/lib/config'

export default async function HomePage() {
  const posts = await getAllPosts()
  const tags = await getAllTags()
  const branding = getBranding()
  
  const featuredPost = posts[0] // 가장 최신 포스트를 대표 포스트로
  const recentPosts = posts.slice(1, 7) // 나머지 6개 포스트 (기존 로직 유지)
  const initialPosts = recentPosts.slice(3) // Latest Articles에 처음 보여줄 3개 (인덱스 4-6)
  const hiddenPosts = posts.slice(7) // 더보기로 보여줄 나머지 포스트들 (인덱스 7부터)
  
  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <section className="text-center py-12 mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {branding.siteName}
          </span>
          <span className="text-3xl md:text-4xl font-medium text-gray-700 ml-4">
            {branding.tagline}
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          {branding.subtitle}
        </p>
      </section>

      {/* Main Content Layout */}
      <div className="lg:flex lg:gap-12 mb-20">
        {/* Featured Article - Left Side */}
        <div className="lg:w-2/3">
          {featuredPost && (
            <section className="mb-12">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                {featuredPost.image && (
                  <div className="relative h-80 md:h-96">
                    <Image
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    <div className="absolute top-6 left-6">
                      {featuredPost.tags?.[0] && (
                        <span className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full">
                          {featuredPost.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="p-8 lg:p-10">
                  <div className="flex items-center mb-6 text-sm text-gray-600">
                    <time className="font-medium">
                      {new Date(featuredPost.date).toLocaleDateString('ko-KR')}
                    </time>
                    <span className="mx-3 text-gray-300">•</span>
                    <span className="font-medium">{featuredPost.readingTime}분 읽기</span>
                    <span className="mx-3 text-gray-300">•</span>
                    <span className="text-blue-600 font-semibold">Featured Article</span>
                  </div>
                  
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                    <Link href={`/${featuredPost.slug}`} className="hover:text-blue-600 transition-colors duration-200">
                      {featuredPost.title}
                    </Link>
                  </h2>
                  
                  <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  
                  <Link
                    href={`/${featuredPost.slug}`}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Read More
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar - Right Side */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">
              Staff Picks
            </h3>
            
            <div className="space-y-6">
              {recentPosts.slice(0, 3).map((post, index) => (
                <article key={post.slug} className="group">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-3"></div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                        <Link href={`/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h4>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <time>{new Date(post.date).toLocaleDateString('ko-KR')}</time>
                        <span className="mx-2">•</span>
                        <span>{post.readingTime}분 읽기</span>
                      </div>
                    </div>
                  </div>
                  {index < 2 && <div className="border-b border-gray-100 mt-6"></div>}
                </article>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 6).map(({ tag, count }) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Articles Grid */}
      <section className="mb-20">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Latest Articles</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4"></div>
          <p className="text-gray-600 text-lg">총 {posts.length}개의 인사이트</p>
        </div>
        
        {initialPosts.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {initialPosts.map((post) => (
              <article key={post.slug} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                {post.image && (
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center mb-3 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                    <time className="font-medium">{new Date(post.date).toLocaleDateString('ko-KR')}</time>
                    <span className="mx-2">•</span>
                    <span className="font-medium">{post.readingTime}분</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 leading-tight">
                    <Link href={`/${post.slug}`} className="hover:text-blue-600 transition-colors duration-200">
                      {post.title}
                    </Link>
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {post.tags?.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <Link
                      href={`/${post.slug}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-200 flex items-center"
                    >
                      Read
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
              ))}
            </div>
            
            {/* Load More Button Component */}
            <LoadMoreButton hiddenPosts={hiddenPosts} />
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              추가 게시물이 없습니다
            </div>
            <p className="text-gray-400 text-sm">
              곧 새로운 콘텐츠가 업데이트될 예정입니다
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
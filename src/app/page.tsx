import { getAllPosts, getAllTags } from '@/lib/posts'
import Image from 'next/image'
import Link from 'next/link'
import PostGrid from '@/components/PostGrid'
import { getBranding, getUIText } from '@/lib/config'

export default async function HomePage() {
  const posts = await getAllPosts()
  const tags = await getAllTags()
  const branding = getBranding()
  const uiText = getUIText()
  
  const featuredPost = posts[0] // 가장 최신 포스트를 대표 포스트로
  const recentPosts = posts.slice(1, 4) // Staff Picks용 3개 포스트  
  const articlesForGrid = posts.slice(4) // PostGrid에 표시할 나머지 모든 포스트들
  
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
      <div className="flex flex-col lg:flex-row lg:gap-12 mb-20">
        {/* Featured Article - Left Side */}
        <div className="w-full lg:w-2/3 mb-12 lg:mb-0">
          {featuredPost && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 h-full">
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
                  <span className="text-blue-600 font-semibold">{uiText.featuredArticleLabel}</span>
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
          )}
        </div>

        {/* Staff Picks - Right Side */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-2xl shadow-lg h-full flex flex-col">
            {/* Header */}
            <div className="p-8 pb-6">
              <h3 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-4">
                {uiText.staffPicksTitle}
              </h3>
            </div>
            
            {/* Posts List */}
            <div className="px-8 flex-1">
              <div className="space-y-6">
                {recentPosts.slice(0, 3).map((post, index) => (
                  <article key={post.slug} className="group">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-3"></div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                          <Link href={`/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h4>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <time>{new Date(post.date).toLocaleDateString('ko-KR')}</time>
                        </div>
                      </div>
                    </div>
                    {index < 2 && <div className="border-b border-gray-100 mt-6"></div>}
                  </article>
                ))}
              </div>
            </div>
            
            {/* Tags at bottom */}
            <div className="p-8 pt-6 border-t border-gray-200 mt-auto">
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

      {/* Articles with Search & Pagination */}
      <PostGrid 
        posts={articlesForGrid}
        title={uiText.latestArticlesTitle}
        postsPerPage={9}
        showSearch={true}
      />
    </div>
  )
}
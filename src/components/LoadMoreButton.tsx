'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PostSummary } from '@/lib/posts'

interface LoadMoreButtonProps {
  hiddenPosts: PostSummary[]
}

export default function LoadMoreButton({ hiddenPosts }: LoadMoreButtonProps) {
  const [showMore, setShowMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  if (hiddenPosts.length === 0) {
    return null
  }

  const handleLoadMore = async () => {
    setIsLoading(true)
    
    // 로딩 애니메이션을 위한 짧은 지연
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setShowMore(true)
    setIsLoading(false)
  }

  return (
    <>
      {/* Hidden Posts Grid */}
      {showMore && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {hiddenPosts.map((post, index) => (
            <article 
              key={post.slug} 
              className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-fadeInUp"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
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
      )}

      {/* Load More Button */}
      {!showMore && (
        <div className="text-center mt-12">
          <button 
            onClick={handleLoadMore}
            disabled={isLoading}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                로딩 중...
              </>
            ) : (
              <>
                더 많은 글 보기 ({hiddenPosts.length}개 더)
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </>
  )
}
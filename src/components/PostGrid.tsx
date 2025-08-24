'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PostSummary } from '@/lib/posts'
import SearchBox from './SearchBox'
import Pagination from './Pagination'
import { getRelativeTime } from '@/lib/time-utils'

interface PostGridProps {
  posts: PostSummary[]
  initialDisplayCount?: number
  postsPerPage?: number
  title?: string
  showSearch?: boolean
}

export default function PostGrid({ 
  posts, 
  initialDisplayCount = 3, 
  postsPerPage = 9,
  title = "Latest Articles",
  showSearch = true 
}: PostGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // 검색 필터링
  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts
    
    const query = searchQuery.toLowerCase()
    return posts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }, [posts, searchQuery])

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)
  const currentPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * postsPerPage
    const endIndex = startIndex + postsPerPage
    return filteredPosts.slice(startIndex, endIndex)
  }, [filteredPosts, currentPage, postsPerPage])

  // 검색 핸들러
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // 검색시 첫 페이지로 이동
  }

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // 페이지 변경시 스크롤을 상단으로
    document.querySelector('#articles-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    })
  }

  return (
    <section id="articles-section" className="mb-20">
      {/* 헤더 */}
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-gray-600 text-lg">
            총 {filteredPosts.length}개의 글
            {searchQuery && (
              <span className="ml-2 px-2 py-1 text-sm bg-blue-50 text-blue-600 rounded-full">
                &lsquo;{searchQuery}&rsquo; 검색 결과
              </span>
            )}
          </p>
          
          {/* 검색박스 */}
          {showSearch && (
            <div className="sm:w-80">
              <SearchBox 
                onSearch={handleSearch}
                placeholder="제목, 내용, 태그로 검색..."
              />
            </div>
          )}
        </div>
      </div>

      {/* 검색 결과가 없을 때 */}
      {filteredPosts.length === 0 && searchQuery && (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과를 찾을 수 없습니다</h3>
          <p className="text-gray-500 mb-6">&lsquo;{searchQuery}&rsquo;와 관련된 글이 없습니다. 다른 검색어를 시도해보세요.</p>
          <button
            onClick={() => handleSearch('')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            전체 글 보기
          </button>
        </div>
      )}

      {/* 포스트 그리드 */}
      {currentPosts.length > 0 && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentPosts.map((post, index) => (
              <article 
                key={post.slug} 
                className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  animationDelay: `${index * 50}ms`,
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
                    <time className="font-medium">{getRelativeTime(post.date)}</time>
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
                          className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => handleSearch(tag)}
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

          {/* 페이지네이션 */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* 글이 아예 없을 때 */}
      {posts.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">아직 게시물이 없습니다</h3>
          <p className="text-gray-500">곧 새로운 콘텐츠가 업데이트될 예정입니다.</p>
        </div>
      )}
    </section>
  )
}
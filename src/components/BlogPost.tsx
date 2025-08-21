import Image from 'next/image'
import Link from 'next/link'
import { PostSummary } from '@/lib/posts'

interface BlogPostProps {
  post: PostSummary
  showFullContent?: boolean
}

export default function BlogPost({ post, showFullContent = false }: BlogPostProps) {
  const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {post.image && (
        <div className="relative h-48 w-full">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
          <time dateTime={post.date}>{formattedDate}</time>
          <span>{post.readingTime}분 읽기</span>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
          {showFullContent ? (
            post.title
          ) : (
            <Link href={`/${post.slug}`} className="hover:text-blue-600 transition-colors">
              {post.title}
            </Link>
          )}
        </h2>
        
        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.excerpt}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {post.tags?.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          
          {post.author && (
            <div className="text-sm text-gray-500">
              by {post.author}
            </div>
          )}
        </div>
        
        {!showFullContent && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href={`/${post.slug}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
            >
              더 읽기
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}
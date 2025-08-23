import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug } from '@/lib/posts'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { generateSEOMetadata, generateJSONLD, StructuredData } from '@/components/SEO'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  
  if (!post) {
    return {
      title: '페이지를 찾을 수 없습니다 - WebMaker'
    }
  }

  return generateSEOMetadata({
    title: post.title,
    description: post.excerpt,
    keywords: post.tags || [],
    image: post.image,
    url: `https://webmaker-ai-blog.vercel.app/${slug}`,
    type: 'article',
    publishedTime: post.date,
    author: post.author || 'WebMaker AI',
    tags: post.tags || []
  })
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  
  if (!post) {
    notFound()
  }

  const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const jsonLD = generateJSONLD({
    title: post.title,
    description: post.excerpt,
    url: `https://webmaker-ai-blog.vercel.app/${slug}`,
    image: post.image,
    publishedTime: post.date,
    author: post.author || 'WebMaker AI',
    type: 'article'
  })

  return (
    <>
      <StructuredData data={jsonLD} />
    <article className="w-full mx-auto px-4 sm:px-6 lg:px-8">
      <header className="mb-12">
        {post.image && (
          <div className="relative h-80 md:h-96 w-full mb-12 rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
          </div>
        )}
        
        <div className="space-y-6">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-6 py-3 rounded-full">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <time dateTime={post.date} className="font-medium">{formattedDate}</time>
              <span className="mx-4 text-gray-300">•</span>
              <span className="font-medium">{post.readingTime}분 읽기</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight text-center mb-8">
            {post.title}
          </h1>
          
          <div className="flex items-center justify-center">
            <div className="flex flex-wrap gap-3 justify-center">
              {post.tags?.map(tag => (
                <span
                  key={tag}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-200 hover:from-blue-100 hover:to-purple-100 transition-all duration-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {post.author && (
            <div className="text-center">
              <div className="inline-flex items-center text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mr-3 flex items-center justify-center text-white text-xs font-bold">
                  AI
                </div>
                <span className="font-medium">by {post.author}</span>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <div 
        className="blog-content prose prose-lg lg:prose-xl max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:pl-6 prose-img:rounded-xl prose-img:shadow-lg"
        dangerouslySetInnerHTML={{ __html: post.htmlContent }}
      />
      
      <footer className="mt-16 pt-12">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-3xl border border-blue-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
              AI
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              이 글이 도움이 되셨나요?
            </h3>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              매일 새로운 트렌드와 인사이트를 제공합니다.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-gray-600">
              <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
                <span className="text-xl mr-2">📝</span>
                <span className="font-medium">전문 콘텐츠</span>
              </div>
              <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
                <span className="text-xl mr-2">📅</span>
                <span className="font-medium">매일 업데이트</span>
              </div>
              <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
                <span className="text-xl mr-2">🔄</span>
                <span className="font-medium">자동 배포</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            더 많은 글 보기
          </Link>
        </div>
      </footer>
    </article>
    </>
  )
}
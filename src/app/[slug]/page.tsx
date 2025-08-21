import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug } from '@/lib/posts'
import { Metadata } from 'next'
import Image from 'next/image'

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

  return {
    title: `${post.title} - WebMaker`,
    description: post.excerpt,
    keywords: post.tags?.join(', '),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.image ? [{ url: post.image }] : [],
      type: 'article',
      publishedTime: post.date,
      authors: [post.author || 'AI Assistant'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.image ? [post.image] : [],
    }
  }
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

  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-8">
        {post.image && (
          <div className="relative h-64 md:h-96 w-full mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <time dateTime={post.date}>{formattedDate}</time>
            <span>{post.readingTime}분 읽기</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {post.tags?.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            {post.author && (
              <div className="text-sm text-gray-600">
                by {post.author}
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div 
        className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-code:text-gray-800 prose-pre:bg-gray-50"
        dangerouslySetInnerHTML={{ __html: post.htmlContent }}
      />
      
      <footer className="mt-12 pt-8 border-t border-gray-200">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            이 글이 도움이 되셨나요?
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            AI가 자동으로 생성한 콘텐츠입니다. 매일 새로운 트렌드와 인사이트를 제공합니다.
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>🤖 AI 생성</span>
            <span>📅 매일 업데이트</span>
            <span>🔄 자동 배포</span>
          </div>
        </div>
      </footer>
    </article>
  )
}
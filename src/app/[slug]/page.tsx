import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug } from '@/lib/posts'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { generateSEOMetadata, generateJSONLD, StructuredData } from '@/components/SEO'
import { getBranding, getUIText } from '@/lib/config'

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
    author: post.author || 'Unknown',
    tags: post.tags || []
  })
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  const branding = getBranding()
  const uiText = getUIText()
  
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
    author: post.author || 'Unknown',
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
            
            {/* Header Content Overlay */}
            <div className="absolute inset-0 flex flex-col p-8 md:p-12">
              <div className="flex-1 flex items-center justify-center">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight text-center max-w-4xl">
                  {post.title}
                </h1>
              </div>
              
              <div className="flex items-end justify-center pb-6">
                <div className="flex items-center text-sm text-white/90 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                  <time dateTime={post.date} className="font-medium">{formattedDate}</time>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-6 mt-12">
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
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full mr-3 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <span className="font-medium">by {post.author}</span>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <div 
        className="blog-content prose prose-base lg:prose-lg max-w-3xl mx-auto prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:pl-6 prose-img:rounded-xl prose-img:shadow-lg"
        dangerouslySetInnerHTML={{ __html: post.htmlContent }}
      />
      
      <footer className="mt-16 pt-12">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-3xl border border-blue-100">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {branding.siteName}
              </span>
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              {branding.tagline}
            </p>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              {branding.footerDescription}
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-gray-600">
              <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
                <div className="w-6 h-6 mr-3 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                </div>
                <span className="font-medium">전문 콘텐츠</span>
              </div>
              <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
                <div className="w-6 h-6 mr-3 flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19M16,1V6L18.5,3.5L19.9,4.9L16,8.8L12.1,4.9L13.5,3.5L16,6V1Z" />
                  </svg>
                </div>
                <span className="font-medium">매일 업데이트</span>
              </div>
              <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
                <div className="w-6 h-6 mr-3 flex items-center justify-center bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13,10V3L4,14H11V21L20,10H13Z" />
                  </svg>
                </div>
                <span className="font-medium">빠른 업로드</span>
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
            {uiText.backToHomeText}
          </Link>
        </div>
      </footer>
    </article>
    </>
  )
}
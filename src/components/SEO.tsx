import { Metadata } from 'next'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedTime?: string
  author?: string
  tags?: string[]
}

export function generateSEOMetadata({
  title = 'WebMaker - AI 자동 블로그 시스템',
  description = '키워드 기반 자동 콘텐츠 생성부터 SEO 최적화까지 완전 자동화된 블로그 시스템',
  keywords = ['AI', '블로그', '자동화', 'SEO', 'Next.js', 'GitHub Actions'],
  image = 'https://webmaker-ai-blog.vercel.app/og-image.jpg',
  url = 'https://webmaker-ai-blog.vercel.app',
  type = 'website',
  publishedTime,
  author = 'WebMaker AI',
  tags = [],
}: SEOProps): Metadata {
  const siteName = 'WebMaker AI Blog'
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`
  
  // 모든 키워드 합치기
  const allKeywords = [...keywords, ...tags].join(', ')
  
  return {
    title: fullTitle,
    description,
    keywords: allKeywords,
    authors: [{ name: author }],
    creator: author,
    publisher: siteName,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type,
      locale: 'ko_KR',
      url,
      siteName,
      title: fullTitle,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(type === 'article' && publishedTime && {
        publishedTime,
        authors: [author],
        tags,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      site: '@webmaker_ai',
      creator: '@webmaker_ai',
      title: fullTitle,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
    other: {
      'article:author': author,
      'article:section': 'Technology',
      'article:tag': tags.join(', '),
    },
  }
}

// JSON-LD 구조화 데이터 생성
export function generateJSONLD({
  title,
  description,
  url,
  image,
  publishedTime,
  author = 'WebMaker AI',
  type = 'website',
}: SEOProps) {
  const baseUrl = 'https://webmaker-ai-blog.vercel.app'
  
  if (type === 'article') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      image,
      url,
      datePublished: publishedTime,
      dateModified: publishedTime,
      author: {
        '@type': 'Organization',
        name: author,
        url: baseUrl,
      },
      publisher: {
        '@type': 'Organization',
        name: 'WebMaker AI Blog',
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
    }
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'WebMaker AI Blog',
    description: 'AI가 매일 생성하는 최신 기술 트렌드와 인사이트',
    url: baseUrl,
    publisher: {
      '@type': 'Organization',
      name: 'WebMaker AI',
      url: baseUrl,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

// 구조화 데이터 스크립트 컴포넌트
export function StructuredData({ data }: { data: any }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  )
}
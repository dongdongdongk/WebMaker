import { Metadata } from 'next'
import { getSiteInfo, getBranding, getSocialLinks, getSEOConfig } from '@/lib/config'

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
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  publishedTime,
  author,
  tags = [],
}: SEOProps): Metadata {
  const siteInfo = getSiteInfo()
  const branding = getBranding()
  const social = getSocialLinks()
  const seoConfig = getSEOConfig()
  
  const defaultTitle = title || siteInfo.title
  const defaultDescription = description || siteInfo.description
  const defaultKeywords = keywords || seoConfig.defaultKeywords
  const defaultImage = image || `${siteInfo.url}${seoConfig.ogImage}`
  const defaultUrl = url || siteInfo.url
  const defaultAuthor = author || branding.author
  const siteName = branding.companyName
  const fullTitle = defaultTitle.includes(siteName) ? defaultTitle : `${defaultTitle} | ${siteName}`
  
  // 모든 키워드 합치기
  const allKeywords = [...defaultKeywords, ...tags].join(', ')
  
  return {
    title: fullTitle,
    description: defaultDescription,
    keywords: allKeywords,
    authors: [{ name: defaultAuthor }],
    creator: defaultAuthor,
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
      url: defaultUrl,
      siteName,
      title: fullTitle,
      description: defaultDescription,
      images: [
        {
          url: defaultImage,
          width: 1200,
          height: 630,
          alt: defaultTitle,
        },
      ],
      ...(type === 'article' && publishedTime && {
        publishedTime,
        authors: [defaultAuthor],
        tags,
      }),
    },
    twitter: {
      card: seoConfig.twitterCard as any,
      site: social.twitter,
      creator: social.twitter,
      title: fullTitle,
      description: defaultDescription,
      images: [defaultImage],
    },
    alternates: {
      canonical: defaultUrl,
    },
    other: {
      'article:author': defaultAuthor,
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
  author,
  type = 'website',
}: SEOProps) {
  const siteInfo = getSiteInfo()
  const branding = getBranding()
  const baseUrl = siteInfo.url
  const defaultAuthor = author || branding.author
  
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
        name: defaultAuthor,
        url: baseUrl,
      },
      publisher: {
        '@type': 'Organization',
        name: branding.companyName,
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}${siteInfo.logo}`,
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
    name: branding.companyName,
    description: branding.subtitle,
    url: baseUrl,
    publisher: {
      '@type': 'Organization',
      name: branding.companyName,
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
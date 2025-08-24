/**
 * 사이트 설정 유틸리티
 * 중앙 설정 파일에서 값을 읽어오는 헬퍼 함수들
 */

import siteConfig from '../../config/site.config.js'

// 타입 정의
export interface SiteConfig {
  site: {
    name: string
    title: string
    description: string
    url: string
    logo: string
    favicon: string
  }
  branding: {
    siteName: string
    tagline: string
    subtitle: string
    author: string
    email: string
    companyName: string
    footerDescription: string
  }
  blogTheme: {
    type: string
    primaryColor: {
      50: string
      100: string
      200: string
      500: string
      600: string
      700: string
    }
    secondaryColor: {
      50: string
      100: string
      500: string
      600: string
      700: string
    }
    contentSources: {
      selectedSubreddit: string
      fallbackSubreddits: string[]
      targetAudience: string
      outputLanguage: string
      commentLimits: {
        topComments: number
        newComments: number
        maxTotal: number
      }
      filterSettings: {
        minUpvotes: number
        minCommentLength: number
        excludeDeleted: boolean
        excludeRemoved: boolean
        excludeNSFW: boolean
      }
      aiSettings: {
        promptTemplate: string
        gptModel: string
        includeComments: boolean
        commentAnalysis: boolean
      }
    }
    availableModels: Record<string, {
      name: string
      description: string
      maxTokens: number
      costPerToken: string
      speed: string
    }>
    promptTemplates: Record<string, {
      name: string
      description: string
      blogStyle: string
      tone: string
    }>
    imageKeywords: Record<string, string>
  }
  uiText: {
    featuredArticleLabel: string
    staffPicksTitle: string
    latestArticlesTitle: string
    totalInsightsText: string
    loadMoreButton: string
    noMorePostsTitle: string
    noMorePostsSubtitle: string
    backToHomeText: string
    footerSectionTitle: string
    featureBadges: Array<{
      icon: string
      text: string
    }>
  }
  social: {
    twitter: string
    github?: string
    linkedin?: string
    facebook?: string
    instagram?: string
  }
  theme: {
    primaryColor: string
    accentColor: string
    darkMode: boolean
    fontFamily: string
    language: string
    timezone: string
  }
  content: {
    postsPerPage: number
    excerptLength: number
    showReadingTime: boolean
    showAuthor: boolean
    showTags: boolean
    showDate: boolean
    enableComments: boolean
    enableSearch: boolean
    defaultAuthor: string
  }
  navigation: {
    main: Array<{ name: string; href: string; external?: boolean }>
    footer: Array<{ name: string; href: string }>
  }
  seo: {
    defaultKeywords: string[]
    ogImage: string
    twitterCard: string
    googleAnalytics: string
    googleSearchConsole: string
    robotsTxt: {
      allow: string[]
      disallow: string[]
      sitemap: string
    }
  }
  images: {
    provider: string
    defaultImage: string
    sizes: {
      thumbnail: string
      card: string
      featured: string
      og: string
    }
  }
  footer: {
    sections: Array<{
      title: string | null
      content: 'description' | 'navigation' | 'social' | 'automation' | 'custom'
      customText?: string | null
      customLinks?: Array<{ name: string; href: string }>
    }>
    automation: {
      schedule: string
      technology: string
    }
    copyright: {
      text: string
      showYear: boolean
      showCompany: boolean
    }
  }
  email: {
    from: string
    replyTo: string
    notifications: string[]
    templates: {
      success: string
      failure: string
      partial: string
    }
  }
}

// 전체 설정 가져오기
export function getConfig(): SiteConfig {
  return siteConfig as SiteConfig
}

// 사이트 기본 정보
export function getSiteInfo() {
  return siteConfig.site
}

// 브랜딩 정보
export function getBranding() {
  return siteConfig.branding
}

// 소셜 미디어 링크
export function getSocialLinks() {
  return siteConfig.social
}

// 테마 설정
export function getTheme() {
  return siteConfig.theme
}

// 네비게이션 메뉴
export function getNavigation() {
  return siteConfig.navigation
}

// SEO 설정
export function getSEOConfig() {
  return siteConfig.seo
}

// 콘텐츠 설정
export function getContentConfig() {
  return siteConfig.content
}

// 기본 작가 정보
export function getDefaultAuthor() {
  return siteConfig.content.defaultAuthor
}

// UI 텍스트
export function getUIText() {
  return siteConfig.uiText
}

// 블로그 주제 설정
export function getBlogTheme() {
  return siteConfig.blogTheme
}

// 이미지 설정
export function getImageConfig() {
  return siteConfig.images
}


// 푸터 설정
export function getFooterConfig() {
  return siteConfig.footer
}

// 이메일 설정
export function getEmailConfig() {
  return siteConfig.email
}

// 특정 색상 클래스 생성
export function getColorClasses() {
  const theme = getTheme()
  return {
    primary: `${theme.primaryColor}-600`,
    primaryHover: `${theme.primaryColor}-700`,
    accent: `${theme.accentColor}-600`,
    accentHover: `${theme.accentColor}-700`,
    gradient: `from-${theme.primaryColor}-600 to-${theme.accentColor}-600`,
    gradientHover: `from-${theme.primaryColor}-700 to-${theme.accentColor}-700`
  }
}

// 랜덤 이미지 URL 생성
export function generateImageUrl(width: number = 1200, height: number = 600, seed?: string | number) {
  const config = getImageConfig()
  const randomSeed = seed || Math.floor(Math.random() * 100) + 1
  
  switch (config.provider) {
    case 'picsum':
      return `https://picsum.photos/${width}/${height}?random=${randomSeed}`
    case 'unsplash':
      return `https://source.unsplash.com/${width}x${height}/?random=${randomSeed}`
    default:
      return config.defaultImage
  }
}

// 환경변수와 설정 병합
export function getEnvironmentConfig() {
  const config = getConfig()
  
  return {
    ...config,
    // 환경변수로 덮어쓰기 가능한 설정들
    site: {
      ...config.site,
      url: process.env.NEXT_PUBLIC_SITE_URL || config.site.url
    },
    seo: {
      ...config.seo,
      googleAnalytics: process.env.NEXT_PUBLIC_GA_ID || config.seo.googleAnalytics
    },
    social: {
      ...config.social,
      twitter: process.env.NEXT_PUBLIC_TWITTER || config.social.twitter
    }
  }
}
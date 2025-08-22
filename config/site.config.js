/**
 * 사이트 전체 설정 파일
 * 다른 주제의 블로그로 쉽게 변경할 수 있도록 모든 설정을 중앙화
 */

const siteConfig = {
  // === 사이트 기본 정보 ===
  site: {
    name: "WebMaker",
    title: "WebMaker - 스마트 블로그 시스템",
    description: "키워드 기반 콘텐츠 큐레이션부터 SEO 최적화까지 스마트한 블로그 시스템",
    url: "https://webmaker-ai-blog.vercel.app",
    logo: "/logo.png",
    favicon: "/favicon.ico"
  },

  // === 브랜딩 ===
  branding: {
    siteName: "WebMaker",
    tagline: "AI Blog",
    subtitle: "매일 업데이트되는 최신 기술 트렌드와 인사이트",
    author: "WebMaker AI",
    email: "admin@webmaker.ai",
    companyName: "WebMaker AI Blog"
  },

  // === 소셜 미디어 ===
  social: {
    twitter: "@webmaker_ai",
    github: "https://github.com/webmaker-ai",
    linkedin: "https://linkedin.com/company/webmaker-ai",
    facebook: "https://facebook.com/webmaker-ai",
    instagram: "https://instagram.com/webmaker_ai"
  },

  // === 테마 설정 ===
  theme: {
    primaryColor: "blue", // blue, purple, green, red, yellow, pink, indigo
    accentColor: "purple",
    darkMode: true,
    fontFamily: "IBM Plex Sans", // "Inter", "Roboto", "Open Sans", "Poppins"
    language: "ko", // ko, en, ja, zh
    timezone: "Asia/Seoul"
  },

  // === 콘텐츠 설정 ===
  content: {
    postsPerPage: 6,
    excerptLength: 150,
    showReadingTime: true,
    showAuthor: true,
    showTags: true,
    showDate: true,
    enableComments: false,
    enableSearch: false
  },

  // === 메뉴 구성 ===
  navigation: {
    main: [
      { name: "홈", href: "/", external: false },
      { name: "디자인", href: "/design-preview", external: false }
    ],
    footer: [
      { name: "홈", href: "/" },
      { name: "디자인 시스템", href: "/design-preview" }
    ]
  },

  // === SEO 설정 ===
  seo: {
    defaultKeywords: ["AI", "블로그", "자동화", "SEO", "Next.js", "GitHub Actions"],
    ogImage: "/og-image.jpg",
    twitterCard: "summary_large_image",
    googleAnalytics: "", // GA4 측정 ID
    googleSearchConsole: "", // 소유권 확인 메타 태그
    robotsTxt: {
      allow: ["/"],
      disallow: ["/admin", "/api"],
      sitemap: "/sitemap.xml"
    }
  },

  // === 이미지 설정 ===
  images: {
    provider: "picsum", // "unsplash", "picsum", "local"
    defaultImage: "https://picsum.photos/1200/600?random=1",
    sizes: {
      thumbnail: "300x200",
      card: "600x400", 
      featured: "1200x600",
      og: "1200x630"
    }
  },

  // === 자동화 설정 ===
  automation: {
    enabled: true,
    schedule: "0 2 * * *", // 매일 오전 2시 (UTC)
    postsPerDay: 1,
    categories: ["기술", "웹개발", "AI/ML", "트렌드"],
    targetAudience: "developers",
    contentLanguage: "korean"
  },

  // === 이메일 설정 ===
  email: {
    from: "WebMaker AI <noreply@webmaker.ai>",
    replyTo: "contact@webmaker.ai",
    notifications: ["admin@webmaker.ai"],
    templates: {
      success: "자동화 성공 알림",
      failure: "자동화 실패 알림",
      partial: "부분 성공 알림"
    }
  },

  // === API 설정 ===
  apis: {
    openai: {
      model: "gpt-4",
      maxTokens: 2000,
      temperature: 0.7
    },
    keywords: {
      provider: "google-trends", // "google-trends", "news-api", "manual"
      regions: ["KR", "US"],
      categories: ["technology", "webdev", "mobile", "design", "business", "trends"]
    }
  },

  // === 배포 설정 ===
  deployment: {
    platform: "vercel", // "vercel", "netlify", "github-pages"
    domain: "webmaker-ai-blog.vercel.app",
    branch: "main",
    buildCommand: "npm run build",
    outputDirectory: "out"
  }
}

module.exports = siteConfig
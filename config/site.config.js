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

  // === 브랜딩 (UI에서 직접 사용되는 텍스트) ===
  branding: {
    siteName: "WebMaker", // 메인 페이지 헤더, 상세 페이지 하단에 표시
    tagline: "TECH Blog", // 메인 페이지 헤더 우측에 표시  
    subtitle: "매일 업데이트되는 최신 기술 트렌드와 인사이트", // 메인 페이지 헤더 설명문
    author: "WebMaker",
    email: "admin@webmaker.ai", 
    companyName: "WebMaker",
    // 하단 섹션 설명문 (상세 페이지)
    footerDescription: "매일 새로운 트렌드와 인사이트를 제공합니다."
  },

  // === 블로그 주제 설정 (새 블로그 만들 때 이 부분만 변경) ===
  blogTheme: {
    // 블로그 주제: 'tech', 'food', 'travel', 'fashion', 'lifestyle', 'business', 'health'
    type: 'tech',
    
    // 메인 색상 (UI 전체에서 blue-600, from-blue-600 등으로 사용)
    primaryColor: {
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      500: '#3b82f6',
      600: '#2563eb', // 메인 컬러
      700: '#1d4ed8'
    },
    
    // 보조 색상 (purple-600, to-purple-600 등으로 사용)  
    secondaryColor: {
      50: '#faf5ff',
      100: '#f3e8ff',
      500: '#8b5cf6', 
      600: '#9333ea', // 보조 컬러
      700: '#7c3aed'
    },
    
    // Reddit 서브레딧 설정 (기존 reddit-config.json 통합)
    contentSources: {
      selectedSubreddit: "technology", // 메인 서브레딧
      fallbackSubreddits: ["programming", "webdev", "artificial"], // 대체 서브레딧들
      targetAudience: "general", // 'general', 'expert', 'beginner'
      outputLanguage: "korean", // 'korean', 'english', 'japanese'
      
      // 댓글 수집 제한
      commentLimits: {
        topComments: 15,
        newComments: 30,
        maxTotal: 50
      },
      
      // 필터링 설정
      filterSettings: {
        minUpvotes: 3,
        minCommentLength: 10,
        excludeDeleted: true,
        excludeRemoved: true,
        excludeNSFW: true
      },
      
      // AI 글쓰기 설정
      aiSettings: {
        promptTemplate: "engaging", // 'informative', 'engaging', 'analytical', 'technical', 'casual'
        gptModel: "gpt-4-turbo", // 'gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'  
        includeComments: true,
        commentAnalysis: true
      }
    },
    
    // AI 모델 정의 (기존 reddit-config.json에서 이동)
    availableModels: {
      "gpt-3.5-turbo": {
        name: "GPT-3.5 Turbo",
        description: "빠른 속도, 저렴한 비용, 일반적인 블로그 작성에 적합",
        maxTokens: 4096,
        costPerToken: "낮음",
        speed: "빠름"
      },
      "gpt-4": {
        name: "GPT-4",
        description: "높은 품질, 정확성, 복잡한 주제 분석에 적합",
        maxTokens: 8192,
        costPerToken: "높음", 
        speed: "보통"
      },
      "gpt-4-turbo": {
        name: "GPT-4 Turbo",
        description: "GPT-4의 성능과 빠른 속도, 긴 글 작성에 최적화",
        maxTokens: 128000,
        costPerToken: "중간",
        speed: "빠름"
      }
    },
    
    // 글쓰기 스타일 템플릿 (기존 reddit-config.json에서 이동)
    promptTemplates: {
      informative: {
        name: "정보 전달형",
        description: "정확한 정보 전달에 중점을 둔 체계적이고 논리적인 글쓰기 스타일",
        blogStyle: "informative",
        tone: "professional"
      },
      engaging: {
        name: "흥미 유발형",
        description: "독자의 흥미를 끄는 스토리텔링과 감정적 연결에 중점을 둔 글쓰기 스타일", 
        blogStyle: "engaging",
        tone: "conversational"
      },
      analytical: {
        name: "분석형",
        description: "데이터와 근거를 바탕으로 한 깊이 있는 분석과 인사이트 제공에 중점을 둔 글쓰기 스타일",
        blogStyle: "analytical",
        tone: "academic"
      },
      technical: {
        name: "기술형", 
        description: "기술적 세부사항과 전문적인 내용 전달에 중점을 둔 글쓰기 스타일",
        blogStyle: "technical",
        tone: "expert"
      },
      casual: {
        name: "캐주얼형",
        description: "친근하고 편안한 대화체로 쉽게 읽을 수 있는 글쓰기 스타일",
        blogStyle: "casual", 
        tone: "friendly"
      }
    },
    
    // 이미지 키워드 매핑 (현재 image-keywords.json에 있음)
    imageKeywords: {
      "기술": "technology",
      "AI": "artificial intelligence", 
      "프로그래밍": "programming",
      "웹": "web development",
      "앱": "application"
      // 다른 주제로 바꿀 때 여기만 수정: 요리 -> "요리": "cooking", "레시피": "recipe"
    }
  },

  // === UI 텍스트 (새 블로그 주제에 맞게 변경) ===
  uiText: {
    // 메인 페이지
    featuredArticleLabel: "Featured Article",
    staffPicksTitle: "Staff Picks", 
    latestArticlesTitle: "Latest Articles",
    totalInsightsText: "개의 인사이트", // "총 {count}개의 인사이트"에서 사용
    loadMoreButton: "더 많은 글 보기",
    noMorePostsTitle: "추가 게시물이 없습니다",
    noMorePostsSubtitle: "곧 새로운 콘텐츠가 업데이트될 예정입니다",
    
    // 상세 페이지  
    backToHomeText: "더 많은 글 보기",
    footerSectionTitle: "이 글이 도움이 되셨나요?", // 현재 사용 안 함 (브랜딩으로 대체됨)
    
    // 기능 배지 텍스트
    featureBadges: [
      { icon: "document", text: "전문 콘텐츠" },
      { icon: "calendar", text: "매일 업데이트" }, 
      { icon: "lightning", text: "빠른 업로드" }
    ]
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
    enableSearch: false,
    defaultAuthor: 'WebMaker Team'
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


  // === 푸터 설정 ===
  footer: {
    // 푸터 섹션들 (3개 컬럼)
    sections: [
      {
        title: "사이트 정보", // 첫 번째 컬럼 제목 (branding.siteName 사용시 null)
        content: "custom", // "description" | "custom" | "branding"
        customText: "사이트 정보 입니다" // content가 "custom"일 때만 사용
      },
      {
        title: "링크", // 두 번째 컬럼 제목
        content: "custom", // "navigation" | "social" | "custom"
        customLinks: [{name:"home",href:"/"}] // content가 "custom"일 때만 사용: [{ name: "링크명", href: "/url" }]
      },
      {
        title: "자동화 정보", // 세 번째 컬럼 제목
        content: "automation", // "automation" | "social" | "custom"
        customText: null
      }
    ],
    
    // 자동화 정보 섹션 텍스트 (세 번째 컬럼에서 사용)
    automation: {
      schedule: "매일 새벽 2시(UTC) 자동 콘텐츠 생성",
      technology: "GitHub Actions + OpenAI 기반"
    },
    
    // 하단 저작권 텍스트
    copyright: {
      text: "모든 권리 보유", // "{year} {companyName}. {text}"로 조합됨
      showYear: true,
      showCompany: true
    }
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

}

module.exports = siteConfig
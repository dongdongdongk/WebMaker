# 🎨 블로그 주제 변경 가이드

이 템플릿으로 다른 주제의 블로그를 쉽게 만들 수 있습니다. `config/site.config.js` 파일만 수정하면 됩니다!

## 📝 설정 변경 예시

### 1. 🍳 요리 블로그로 변경

```javascript
// config/site.config.js
const siteConfig = {
  branding: {
    siteName: "CookingMaster",
    tagline: "FOOD Blog", 
    subtitle: "매일 새로운 레시피와 요리 팁",
    footerDescription: "맛있는 레시피와 요리 노하우를 제공합니다."
  },
  
  blogTheme: {
    type: 'food',
    contentSources: {
      selectedSubreddit: "Cooking", // 요리 관련 서브레딧
      fallbackSubreddits: ["recipes", "FoodPorn", "MealPrepSunday"],
      aiSettings: {
        promptTemplate: "engaging", // 요리는 흥미 유발형이 좋음
        gptModel: "gpt-4-turbo"
      }
    },
    imageKeywords: {
      "요리": "cooking",
      "레시피": "recipe", 
      "음식": "delicious food",
      "디저트": "dessert",
      "한식": "korean cuisine"
    }
  },
  
  uiText: {
    featuredArticleLabel: "오늘의 레시피",
    staffPicksTitle: "인기 요리", 
    latestArticlesTitle: "최신 레시피",
    totalInsightsText: "개의 레시피",
    featureBadges: [
      { icon: "document", text: "검증된 레시피" },
      { icon: "calendar", text: "매일 새 요리" }, 
      { icon: "lightning", text: "간편 조리법" }
    ]
  },
  
  // 푸터 설정
  footer: {
    sections: [
      {
        title: null, // siteName 사용
        content: "description"
      },
      {
        title: "요리 링크",
        content: "navigation"
      },
      {
        title: "레시피 정보", 
        content: "custom",
        customText: "매일 새로운 레시피를 발견하고 요리 실력을 향상시켜보세요."
      }
    ],
    automation: {
      schedule: "매일 새벽 2시 새로운 레시피 업데이트",
      technology: "AI 기반 레시피 추천"
    },
    copyright: {
      text: "맛있는 요리를 위한 모든 권리 보유",
      showYear: true,
      showCompany: true
    }
  }
}
```

### 2. ✈️ 여행 블로그로 변경

```javascript
const siteConfig = {
  branding: {
    siteName: "TravelGuide",
    tagline: "TRAVEL Blog",
    subtitle: "세계 각지의 여행 정보와 팁", 
    footerDescription: "특별한 여행 경험과 정보를 공유합니다."
  },
  
  blogTheme: {
    type: 'travel',
    contentSources: {
      selectedSubreddit: "travel",
      fallbackSubreddits: ["solotravel", "backpacking", "digitalnomad"],
      aiSettings: {
        promptTemplate: "engaging", // 여행도 스토리텔링이 중요
        gptModel: "gpt-4-turbo"
      }
    },
    imageKeywords: {
      "여행": "travel destination",
      "호텔": "luxury hotel",
      "맛집": "local restaurant", 
      "관광지": "tourist attraction",
      "배낭여행": "backpacking"
    }
  },
  
  uiText: {
    featuredArticleLabel: "추천 여행지",
    staffPicksTitle: "인기 코스",
    latestArticlesTitle: "최신 여행 정보", 
    totalInsightsText: "개의 여행 팁",
    featureBadges: [
      { icon: "document", text: "검증된 정보" },
      { icon: "calendar", text: "실시간 업데이트" },
      { icon: "lightning", text: "빠른 예약" }
    ]
  },
  
  // 푸터 설정  
  footer: {
    sections: [
      {
        title: null, // siteName 사용
        content: "description"
      },
      {
        title: "여행 정보",
        content: "navigation" 
      },
      {
        title: "소셜 미디어",
        content: "social"
      }
    ],
    automation: {
      schedule: "매일 새벽 2시 여행 정보 업데이트", 
      technology: "여행 전문가 + AI 큐레이션"
    },
    copyright: {
      text: "모든 여행 정보에 대한 권리 보유",
      showYear: true,
      showCompany: true
    }
  }
}
```

### 3. 💼 비즈니스 블로그로 변경

```javascript
const siteConfig = {
  branding: {
    siteName: "BusinessInsight", 
    tagline: "BUSINESS Blog",
    subtitle: "최신 비즈니스 트렌드와 인사이트",
    footerDescription: "성공적인 비즈니스를 위한 전략과 정보를 제공합니다."
  },
  
  blogTheme: {
    type: 'business',
    contentSources: {
      selectedSubreddit: "business",
      fallbackSubreddits: ["entrepreneur", "startups", "investing"],
      aiSettings: {
        promptTemplate: "analytical", // 비즈니스는 분석적 접근
        gptModel: "gpt-4-turbo"
      }
    },
    imageKeywords: {
      "비즈니스": "business strategy",
      "창업": "startup",
      "투자": "investment", 
      "마케팅": "digital marketing",
      "경영": "management"
    }
  },
  
  uiText: {
    featuredArticleLabel: "주요 트렌드",
    staffPicksTitle: "전문가 추천",
    latestArticlesTitle: "비즈니스 뉴스",
    totalInsightsText: "개의 인사이트", 
    featureBadges: [
      { icon: "document", text: "전문 분석" },
      { icon: "calendar", text: "시장 동향" },
      { icon: "lightning", text: "즉시 적용" }
    ]
  },
  
  // 푸터 설정
  footer: {
    sections: [
      {
        title: "비즈니스 인사이트", 
        content: "custom",
        customText: "전문가가 엄선한 비즈니스 트렌드와 전략을 매일 제공합니다."
      },
      {
        title: "서비스",
        content: "custom",
        customLinks: [
          { name: "비즈니스 분석", href: "/analysis" },
          { name: "투자 가이드", href: "/investment" }, 
          { name: "스타트업 뉴스", href: "/startup" }
        ]
      },
      {
        title: "문의하기",
        content: "custom",
        customText: "비즈니스 컨설팅 문의: business@example.com"
      }
    ],
    automation: {
      schedule: "매일 새벽 2시 비즈니스 트렌드 분석",
      technology: "Bloomberg API + GPT-4 분석"
    },
    copyright: {
      text: "비즈니스 인사이트에 대한 모든 권리 보유",
      showYear: true, 
      showCompany: true
    }
  }
}
```

## 🚀 변경 후 할 일

1. **설정 파일 수정**: `config/site.config.js` 편집 (이제 이 파일 하나만!)
2. **빌드 및 배포**: 
   ```bash
   npm run build
   npm run start
   ```
3. **Reddit 설정 확인**: 선택한 서브레딧이 활성화되어 있는지 확인
4. **이미지 키워드 테스트**: 새로운 키워드로 이미지가 잘 검색되는지 확인

## 🗂️ 통합된 설정들

이제 다음 파일들이 모두 `site.config.js`로 **완전히 통합**되었습니다:
- ✅ ~~`reddit-config.json`~~ → `blogTheme.contentSources`, `availableModels`, `promptTemplates`
- 🔄 ~~`image-keywords.json`~~ → `blogTheme.imageKeywords` (예정)
- ✅ 각종 UI 텍스트들 → `uiText.*`
- ✅ 사용되지 않던 `apis`, `deployment` 설정 제거

### 📋 이제 site.config.js에서 설정 가능한 모든 항목:
```javascript
blogTheme: {
  // Reddit 데이터 소스
  contentSources: { selectedSubreddit, aiSettings, ... },
  
  // AI 모델 정의 (GPT-3.5, GPT-4, GPT-4-Turbo)
  availableModels: { ... },
  
  // 글쓰기 스타일 (informative, engaging, analytical, ...)
  promptTemplates: { ... },
  
  // 이미지 검색 키워드
  imageKeywords: { ... }
}

// 푸터 완전 제어
footer: {
  // 3개 컬럼 설정
  sections: [
    { content: "description" | "navigation" | "social" | "automation" | "custom" },
    { content: "...", customText: "...", customLinks: [...] }
  ],
  
  // 자동화 정보 텍스트
  automation: { schedule, technology },
  
  // 저작권 표시
  copyright: { text, showYear, showCompany }
}
```

## 🧹 정리된 부분들

**제거된 사용되지 않는 설정:**
- ~~`apis.openai`~~ - openai-reddit-generator.js에서 자체 설정 사용
- ~~`apis.keywords`~~ - Google Trends 사용하지 않음
- ~~`deployment`~~ - 실제 배포와 무관한 설정들

## 💡 팁

- **서브레딧 선택**: 해당 주제의 활발한 커뮤니티를 선택하세요
- **이미지 키워드**: 영어 키워드가 더 다양한 이미지를 제공합니다
- **UI 텍스트**: 주제에 맞는 친숙한 용어를 사용하세요
- **색상**: 각 주제에 어울리는 색상으로 변경 가능합니다
- **푸터 설정**: 3개 컬럼을 자유롭게 구성할 수 있습니다:
  - `description`: 사이트 설명 표시
  - `navigation`: 푸터 메뉴 링크 표시  
  - `social`: 소셜 미디어 링크 표시
  - `automation`: 자동화 정보 표시
  - `custom`: 사용자 정의 텍스트나 링크 표시

이제 **site.config.js 한 파일만 수정**하면 완전히 다른 주제의 블로그가 됩니다! 🎉
/**
 * openai-generator.js
 * OpenAI API 기반 콘텐츠 생성 모듈
 */

const OpenAI = require('openai');

class OpenAIGenerator {
  constructor(logger, rateLimiter) {
    this.logger = logger;
    this.rateLimiter = rateLimiter;
    this.apiName = 'openai';
    
    // OpenAI 클라이언트 초기화
    this.client = null;
    this.initializeClient();
    
    // 생성 설정
    this.defaultConfig = {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
      frequencyPenalty: 0.3,
      presencePenalty: 0.3
    };

    // 프롬프트 템플릿
    this.promptTemplates = {
      tutorial: {
        system: "당신은 전문적인 기술 블로거입니다. 개발자들에게 유용한 실습 위주의 튜토리얼을 작성합니다.",
        structure: ["소개", "기본 개념", "실습 예제", "고급 활용", "결론 및 다음 단계"],
        tone: "친근하면서도 전문적인",
        length: "2000-3000단어"
      },
      trend: {
        system: "당신은 기술 트렌드 분석가입니다. 최신 기술 동향을 분석하고 미래 전망을 제시합니다.",
        structure: ["현재 상황", "주요 트렌드", "시장 영향", "예상되는 변화", "결론"],
        tone: "분석적이고 통찰력 있는",
        length: "1500-2500단어"
      },
      review: {
        system: "당신은 기술 리뷰 전문가입니다. 기술, 도구, 프레임워크에 대한 객관적인 리뷰를 작성합니다.",
        structure: ["개요", "주요 특징", "장단점 분석", "사용 사례", "결론 및 추천"],
        tone: "객관적이고 균형 잡힌",
        length: "1500-2000단어"
      },
      guide: {
        system: "당신은 개발 가이드 작성자입니다. 복잡한 기술적 문제를 단계별로 해결하는 가이드를 작성합니다.",
        structure: ["문제 정의", "해결 방법 개요", "단계별 구현", "주의사항", "마무리"],
        tone: "실용적이고 단계적인",
        length: "2000-2500단어"
      },
      news: {
        system: "당신은 기술 뉴스 에디터입니다. 최신 기술 뉴스를 종합하여 인사이트가 있는 아티클을 작성합니다.",
        structure: ["뉴스 요약", "배경 분석", "업계 반응", "향후 전망", "결론"],
        tone: "정보전달 중심의 분석적인",
        length: "1000-1500단어"
      }
    };
  }

  /**
   * OpenAI 클라이언트 초기화
   */
  initializeClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      this.logger.warning('OpenAI API 키가 설정되지 않음 - 시뮬레이션 모드로 실행');
      this.client = null;
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: apiKey
      });
      this.logger.info('OpenAI 클라이언트 초기화 완료');
    } catch (error) {
      this.logger.error('OpenAI 클라이언트 초기화 실패', { error: error.message });
      this.client = null;
    }
  }

  /**
   * 블로그 포스트 생성
   */
  async generateBlogPost(prompt, type = 'tutorial', customConfig = {}) {
    await this.logger.info('블로그 포스트 생성 시작', { type, promptLength: prompt.length });

    const config = { ...this.defaultConfig, ...customConfig };
    const template = this.promptTemplates[type] || this.promptTemplates.tutorial;

    if (!this.client) {
      return await this.simulateGeneration(prompt, type, template);
    }

    if (!await this.rateLimiter?.checkLimit(this.apiName)) {
      throw new Error('OpenAI API 레이트 리미트 초과');
    }

    try {
      const messages = [
        {
          role: "system",
          content: this.buildSystemPrompt(template)
        },
        {
          role: "user",
          content: prompt
        }
      ];

      const completion = await this.client.chat.completions.create({
        model: config.model,
        messages: messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty
      });

      const generatedContent = completion.choices[0]?.message?.content;
      
      if (!generatedContent) {
        throw new Error('OpenAI 응답에서 콘텐츠를 찾을 수 없음');
      }

      const result = {
        content: generatedContent,
        metadata: {
          model: config.model,
          type: type,
          template: template.structure,
          tokensUsed: completion.usage?.total_tokens || 0,
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          finishReason: completion.choices[0]?.finish_reason,
          generatedAt: new Date().toISOString()
        }
      };

      await this.logger.info('블로그 포스트 생성 완료', {
        type,
        tokensUsed: result.metadata.tokensUsed,
        contentLength: generatedContent.length
      });

      return result;

    } catch (error) {
      await this.logger.error('OpenAI API 호출 실패', { error: error.message });
      
      // API 실패 시 시뮬레이션으로 폴백
      return await this.simulateGeneration(prompt, type, template);
    }
  }

  /**
   * 시스템 프롬프트 구성
   */
  buildSystemPrompt(template) {
    return `${template.system}

**글 구조:**
${template.structure.map((section, index) => `${index + 1}. ${section}`).join('\n')}

**작성 요구사항:**
- 톤: ${template.tone}
- 길이: ${template.length}
- 마크다운 형식으로 작성
- 실용적이고 구체적인 정보 포함
- 코드 예제 포함 (해당하는 경우)
- 외부 링크는 포함하지 마세요
- SEO에 최적화된 구조로 작성
- 한국어로 작성`;
  }

  /**
   * OpenAI API 시뮬레이션 (API 키가 없거나 실패 시)
   */
  async simulateGeneration(prompt, type, template) {
    await this.logger.info('OpenAI API 시뮬레이션 모드로 실행');

    // 타입별 시뮬레이션 콘텐츠
    const simulatedContent = this.getSimulatedContent(type, template);

    const result = {
      content: simulatedContent,
      metadata: {
        model: 'simulation',
        type: type,
        template: template.structure,
        tokensUsed: 0,
        promptTokens: 0,
        completionTokens: 0,
        finishReason: 'simulated',
        generatedAt: new Date().toISOString(),
        isSimulation: true
      }
    };

    await this.logger.info('시뮬레이션 블로그 포스트 생성 완료', {
      type,
      contentLength: simulatedContent.length
    });

    return result;
  }

  /**
   * 타입별 시뮬레이션 콘텐츠
   */
  getSimulatedContent(type, template) {
    const contentMap = {
      tutorial: `# Next.js 14 새로운 기능 완벽 가이드

## 소개

Next.js 14가 출시되면서 개발자들에게 많은 새로운 기능과 개선사항을 제공합니다. 이번 버전에서는 성능 최적화, 개발자 경험 향상, 그리고 새로운 기능들이 대폭 추가되었습니다.

## 기본 개념

### App Router의 개선
Next.js 14에서는 App Router가 더욱 안정화되었으며, 서버 컴포넌트와 클라이언트 컴포넌트의 구분이 더욱 명확해졌습니다.

### Turbo Pack 통합
Webpack을 대체하는 Turbo Pack이 더욱 성숙해져서 개발 속도가 크게 향상되었습니다.

## 실습 예제

### 1. Server Actions 활용

\`\`\`javascript
'use server'

export async function createPost(formData) {
  const title = formData.get('title')
  const content = formData.get('content')
  
  // 데이터베이스 저장 로직
  await db.post.create({
    data: { title, content }
  })
  
  redirect('/posts')
}
\`\`\`

### 2. 새로운 Image 컴포넌트

\`\`\`javascript
import Image from 'next/image'

export default function OptimizedImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero image"
      width={800}
      height={600}
      priority
      placeholder="blur"
    />
  )
}
\`\`\`

## 고급 활용

### Partial Prerendering (실험적 기능)
Next.js 14에서는 부분 사전 렌더링 기능을 실험적으로 제공합니다.

### 향상된 메타데이터 API
메타데이터 생성이 더욱 간편해졌습니다.

## 결론 및 다음 단계

Next.js 14는 성능과 개발자 경험 모든 면에서 큰 발전을 이뤘습니다. 새로운 프로젝트를 시작할 때는 이러한 새 기능들을 적극 활용해보시기 바랍니다.

**다음 단계:**
- 실제 프로젝트에 적용해보기
- 성능 비교 측정하기
- 팀 내 지식 공유하기`,

      trend: `# 2025년 웹 개발 트렌드: 무엇이 달라질까?

## 현재 상황

웹 개발 생태계는 빠르게 변화하고 있습니다. 2024년을 돌아보면 React, Next.js, TypeScript의 안정화와 함께 새로운 패러다임들이 등장했습니다.

## 주요 트렌드

### 1. 서버 사이드 르네상스
- Server Components의 mainstream 도입
- Edge Computing의 확산
- Streaming SSR의 일반화

### 2. 타입 안전성의 진화
- TypeScript 5.x의 새로운 기능들
- Runtime 타입 체크의 표준화
- End-to-end 타입 안전성

### 3. 개발자 경험(DX)의 혁신
- Zero-config 도구들의 발전
- AI 기반 코드 생성 도구의 보편화
- 향상된 디버깅 도구들

## 시장 영향

이러한 변화들은 개발 프로세스를 근본적으로 변화시키고 있습니다. 특히 중소기업들도 엔터프라이즈급 개발 경험을 누릴 수 있게 되었습니다.

## 예상되는 변화

### 단기적 (6개월 이내)
- Component 기반 개발의 더욱 세분화
- Micro-frontend 아키텍처의 확산

### 장기적 (1-2년)
- WebAssembly의 보편화
- No-code/Low-code 플랫폼과의 통합

## 결론

2025년은 웹 개발이 더욱 접근 가능해지면서도 동시에 더욱 강력해지는 해가 될 것입니다. 개발자들은 이러한 변화에 적응하여 더 나은 사용자 경험을 제공할 수 있을 것입니다.`,

      review: `# React vs Vue.js 2025: 종합 비교 리뷰

## 개요

React와 Vue.js는 모던 웹 개발에서 가장 인기 있는 프론트엔드 프레임워크입니다. 2025년 현재 두 프레임워크의 현황을 객관적으로 비교해보겠습니다.

## 주요 특징

### React의 강점
- 거대한 생태계와 커뮤니티
- 컴포넌트 재사용성
- React Hooks의 강력함
- Next.js와의 완벽한 통합

### Vue.js의 강점
- 학습 곡선이 완만함
- 뛰어난 개발자 경험
- Composition API의 직관성
- 내장된 상태 관리 (Vuex/Pinia)

## 장단점 분석

### React
**장점:**
- 더 넓은 채용 시장
- 풍부한 라이브러리 생태계
- 페이스북의 지속적인 지원

**단점:**
- 높은 학습 곡선
- 빠른 생태계 변화로 인한 피로감
- 보일러플레이트 코드의 복잡성

### Vue.js
**장점:**
- 빠른 학습과 적용
- 우수한 문서화
- 점진적 도입 가능

**단점:**
- 상대적으로 작은 생태계
- 대규모 기업에서의 제한적 사용

## 사용 사례

### React가 적합한 경우
- 대규모 애플리케이션
- 복잡한 상태 관리가 필요한 경우
- 모바일 앱 개발 (React Native)

### Vue.js가 적합한 경우
- 중소규모 프로젝트
- 빠른 프로토타이핑
- 기존 프로젝트에 점진적 도입

## 결론 및 추천

두 프레임워크 모두 훌륭한 선택입니다. 프로젝트의 규모, 팀의 경험, 장기적인 계획을 고려하여 선택하는 것이 중요합니다.

**추천사항:**
- 대규모 프로젝트나 모바일 앱까지 고려한다면 React
- 빠른 개발과 학습을 원한다면 Vue.js
- 팀의 기존 경험을 최우선으로 고려하세요`,

      guide: `# TypeScript 마이그레이션 완벽 가이드

## 문제 정의

기존 JavaScript 프로젝트를 TypeScript로 마이그레이션하는 것은 많은 개발팀이 직면하는 과제입니다. 안전하고 효율적인 마이그레이션 방법을 알아보겠습니다.

## 해결 방법 개요

단계적 마이그레이션을 통해 기존 코드의 동작을 보장하면서 점진적으로 타입 안전성을 확보하는 방법을 제시합니다.

## 단계별 구현

### 1단계: 환경 설정
\`\`\`json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "allowJs": true,
    "noEmit": true,
    "strict": false
  }
}
\`\`\`

### 2단계: 점진적 파일 변환
\`\`\`bash
# .js 파일을 .ts로 점진적으로 변환
mv utils.js utils.ts
\`\`\`

### 3단계: 타입 정의 추가
\`\`\`typescript
// Before
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// After
interface Item {
  price: number;
  name: string;
}

function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
\`\`\`

### 4단계: Strict 모드 활성화
점진적으로 strict 옵션들을 활성화합니다.

## 주의사항

### 피해야 할 실수들
- 한 번에 모든 파일을 변환하려고 하지 마세요
- \`any\` 타입을 남용하지 마세요
- 기존 테스트를 먼저 TypeScript로 마이그레이션하세요

### 성능 고려사항
- 빌드 시간 모니터링
- 타입 체크 최적화
- IDE 성능 관리

## 마무리

TypeScript 마이그레이션은 시간이 걸리는 과정이지만, 장기적으로 코드 품질과 개발 생산성을 크게 향상시킵니다. 단계적으로 접근하여 안전하게 진행하시기 바랍니다.`,

      news: `# AI 코딩 어시스턴트의 현재와 미래

## 뉴스 요약

최근 GitHub Copilot, ChatGPT, Claude 등 AI 기반 코딩 어시스턴트들이 급속도로 발전하면서 개발 패러다임이 변화하고 있습니다.

## 배경 분석

### 기술적 배경
- Large Language Model (LLM)의 발전
- 코드 생성 정확도의 향상
- IDE와의 원활한 통합

### 시장 상황
- Microsoft의 GitHub Copilot 성공
- Google, Amazon 등 빅테크의 경쟁 가세
- 오픈소스 대안들의 등장

## 업계 반응

### 긍정적 반응
- 개발 생산성 향상
- 반복 작업 자동화
- 학습 도구로서의 가치

### 우려사항
- 코드 품질에 대한 의문
- 저작권 및 라이선스 문제
- 개발자 역량 의존성

## 향후 전망

### 단기 전망 (1년 이내)
- 더 정확한 코드 생성
- 특화된 도메인별 모델 출현
- 비용 효율성 개선

### 장기 전망 (3-5년)
- 완전 자동화된 코딩 파이프라인
- 자연어 기반 소프트웨어 개발
- 개발자 역할의 변화

## 결론

AI 코딩 어시스턴트는 이미 개발 생태계의 필수 요소가 되어가고 있습니다. 개발자들은 이러한 도구들을 효과적으로 활용하는 방법을 배워야 할 시점입니다.`
    };

    return contentMap[type] || contentMap.tutorial;
  }

  /**
   * 콘텐츠 후처리
   */
  async postProcessContent(generatedContent, options = {}) {
    await this.logger.info('생성된 콘텐츠 후처리 시작');

    let processedContent = generatedContent;

    // 1. 제목 추출 및 정제
    const title = this.extractTitle(processedContent);
    
    // 2. 메타데이터 생성
    const metadata = this.generateMetadata(processedContent, options);
    
    // 3. SEO 최적화
    if (options.seoOptimize) {
      processedContent = this.optimizeForSEO(processedContent, options.keyword);
    }
    
    // 4. 마크다운 정제
    processedContent = this.cleanMarkdown(processedContent);
    
    // 5. 읽기 시간 계산
    const readingTime = this.calculateReadingTime(processedContent);
    
    // 6. 요약 생성
    const excerpt = this.generateExcerpt(processedContent);

    const result = {
      title: title || options.title || '제목 없음',
      content: processedContent,
      excerpt,
      metadata: {
        ...metadata,
        readingTime,
        wordCount: this.countWords(processedContent),
        processingDate: new Date().toISOString()
      }
    };

    await this.logger.info('콘텐츠 후처리 완료', {
      title: result.title,
      wordCount: result.metadata.wordCount,
      readingTime: result.metadata.readingTime
    });

    return result;
  }

  /**
   * 제목 추출
   */
  extractTitle(content) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  /**
   * 메타데이터 생성
   */
  generateMetadata(content, options) {
    return {
      tags: this.extractTags(content),
      category: options.category || this.suggestCategory(content),
      difficulty: this.assessDifficulty(content),
      topics: this.extractTopics(content)
    };
  }

  /**
   * SEO 최적화
   */
  optimizeForSEO(content, keyword) {
    if (!keyword) return content;

    // 키워드 밀도 체크 및 조정
    const keywordDensity = this.calculateKeywordDensity(content, keyword);
    
    if (keywordDensity < 0.01) {
      // 키워드 밀도가 너무 낮으면 자연스럽게 추가
      content = this.addKeywordNaturally(content, keyword);
    }

    return content;
  }

  /**
   * 마크다운 정제
   */
  cleanMarkdown(content) {
    return content
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        // 코드 블록 정제
        const cleanCode = code.trim();
        return `\`\`\`${lang || ''}\n${cleanCode}\n\`\`\``;
      })
      .replace(/\n{3,}/g, '\n\n') // 과도한 줄바꿈 제거
      .trim();
  }

  /**
   * 읽기 시간 계산 (분)
   */
  calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const wordCount = this.countWords(content);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * 단어 수 계산
   */
  countWords(content) {
    // 마크다운 문법 제거 후 단어 수 계산
    const cleanContent = content
      .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
      .replace(/`[^`]+`/g, '')        // 인라인 코드 제거
      .replace(/[#*\-_>]/g, '')       // 마크다운 문법 제거
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // 링크 텍스트만 남기기
    
    return cleanContent.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * 요약 생성
   */
  generateExcerpt(content, maxLength = 150) {
    // 첫 번째 문단 또는 첫 번째 ## 섹션 이후의 텍스트 사용
    const firstParagraph = content
      .replace(/^#[^#\n]*\n/, '') // 제목 제거
      .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
      .split(/\n\s*\n/)[0] // 첫 번째 문단
      .replace(/[#*\-_`]/g, '') // 마크다운 문법 제거
      .trim();

    return firstParagraph.length > maxLength 
      ? firstParagraph.substring(0, maxLength) + '...'
      : firstParagraph;
  }

  /**
   * 태그 추출
   */
  extractTags(content) {
    const techTerms = [
      'javascript', 'typescript', 'react', 'vue', 'angular', 'node.js',
      'python', 'java', 'go', 'rust', 'php', 'ruby',
      'ai', 'machine learning', 'blockchain', 'cloud', 'docker', 'kubernetes',
      'frontend', 'backend', 'fullstack', 'mobile', 'web development'
    ];

    const contentLower = content.toLowerCase();
    const foundTags = techTerms.filter(term => 
      contentLower.includes(term.toLowerCase())
    );

    return foundTags.slice(0, 5); // 최대 5개
  }

  /**
   * 카테고리 제안
   */
  suggestCategory(content) {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('tutorial') || contentLower.includes('가이드')) return 'tutorial';
    if (contentLower.includes('trend') || contentLower.includes('트렌드')) return 'trend';
    if (contentLower.includes('review') || contentLower.includes('리뷰')) return 'review';
    if (contentLower.includes('news') || contentLower.includes('뉴스')) return 'news';
    
    return 'article';
  }

  /**
   * 난이도 평가
   */
  assessDifficulty(content) {
    const contentLower = content.toLowerCase();
    const complexTerms = ['advanced', '고급', 'complex', 'architecture', '아키텍처'];
    const beginnerTerms = ['basic', '기본', 'introduction', '소개', 'getting started'];
    
    const complexCount = complexTerms.reduce((count, term) => 
      count + (contentLower.match(new RegExp(term, 'g')) || []).length, 0
    );
    const beginnerCount = beginnerTerms.reduce((count, term) => 
      count + (contentLower.match(new RegExp(term, 'g')) || []).length, 0
    );
    
    if (complexCount > beginnerCount) return 'advanced';
    if (beginnerCount > 0) return 'beginner';
    return 'intermediate';
  }

  /**
   * 키워드 밀도 계산
   */
  calculateKeywordDensity(content, keyword) {
    const keywordMatches = (content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
    const totalWords = this.countWords(content);
    return totalWords > 0 ? keywordMatches / totalWords : 0;
  }

  /**
   * 키워드 자연스럽게 추가
   */
  addKeywordNaturally(content, keyword) {
    // 간단한 구현: 첫 번째 문단에 키워드 추가
    const paragraphs = content.split('\n\n');
    if (paragraphs.length > 1) {
      paragraphs[1] += ` ${keyword}는 현재 많은 개발자들이 관심을 갖고 있는 주제입니다.`;
    }
    return paragraphs.join('\n\n');
  }

  /**
   * 주제 추출
   */
  extractTopics(content) {
    const topics = [];
    
    // ## 헤딩들을 주제로 추출
    const headings = content.match(/^##\s+(.+)$/gm) || [];
    topics.push(...headings.map(h => h.replace(/^##\s+/, '').trim()));
    
    return topics.slice(0, 3); // 최대 3개
  }
}

module.exports = OpenAIGenerator;
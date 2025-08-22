/**
 * generate-post.js
 * OpenAI API를 활용하여 AI 블로그 포스트를 생성합니다.
 * 실행 시간: 약 15분
 */

const Logger = require('./utils/logger');
const FileUtils = require('./utils/file-utils');
const DateUtils = require('./utils/date-utils');
const StringUtils = require('./utils/string-utils');
const path = require('path');

// 사이트 설정 로드
const siteConfig = require('../config/site.config.js');

class PostGenerator {
  constructor() {
    this.logger = new Logger('generate-post');
    this.contentDataPath = path.join(__dirname, '../config/content-data.json');
    this.configPath = path.join(__dirname, '../config/generation-config.json');
    this.outputDir = path.join(__dirname, '../content/posts');
    
    // AI 생성 템플릿
    this.postTemplates = {
      tutorial: {
        sections: ['소개', '기본 개념', '실습 예제', '고급 활용', '결론'],
        tone: 'educational',
        length: 'long'
      },
      trend: {
        sections: ['현재 상황', '주요 트렌드', '예상 영향', '대응 방안', '전망'],
        tone: 'analytical',
        length: 'medium'
      },
      review: {
        sections: ['개요', '주요 특징', '장단점 분석', '사용 사례', '결론'],
        tone: 'balanced',
        length: 'medium'
      },
      guide: {
        sections: ['문제 정의', '해결 방법', '단계별 가이드', '주의사항', '마무리'],
        tone: 'practical',
        length: 'long'
      }
    };
  }

  /**
   * 생성 설정 로드
   */
  async loadConfig() {
    try {
      const config = await FileUtils.readJson(this.configPath);
      if (config) {
        await this.logger.info('생성 설정 파일 로드 완료');
        return config;
      }
    } catch (error) {
      await this.logger.warning('설정 파일 로드 실패, 기본 설정 사용');
    }

    // 기본 설정 생성
    const defaultConfig = {
      openai: {
        model: 'gpt-4',
        maxTokens: 2000,
        temperature: 0.7,
        presencePenalty: 0.1,
        frequencyPenalty: 0.1
      },
      generation: {
        postsPerDay: 3,
        minWordCount: 800,
        maxWordCount: 2000,
        language: 'korean',
        targetAudience: 'developers'
      },
      content: {
        includeImages: true,
        includeCodeExamples: true,
        includeLinks: false, // 외부 링크는 제외
        seoOptimized: true
      },
      lastUpdated: DateUtils.getNow()
    };

    await FileUtils.writeJson(this.configPath, defaultConfig);
    await this.logger.info('기본 생성 설정 생성 완료');
    return defaultConfig;
  }

  /**
   * 크롤링된 콘텐츠 데이터 로드
   */
  async loadContentData() {
    try {
      const contentData = await FileUtils.readJson(this.contentDataPath);
      if (!contentData || !contentData.qualityContent) {
        throw new Error('콘텐츠 데이터를 찾을 수 없습니다. crawl-content.js를 먼저 실행하세요.');
      }
      
      await this.logger.info(`${contentData.qualityContent.length}개 크롤링 콘텐츠 로드 완료`);
      return contentData;
      
    } catch (error) {
      await this.logger.error('콘텐츠 데이터 로드 실패', { error: error.message });
      throw error;
    }
  }

  /**
   * 포스트 주제 및 타입 결정
   */
  selectPostTopic(contentData) {
    const qualityContent = contentData.qualityContent;
    const keywords = contentData.keywordsProcessed;
    
    // 가장 품질 높은 콘텐츠 선택
    const topContent = qualityContent
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, 5);

    // 포스트 타입 랜덤 선택
    const templateTypes = Object.keys(this.postTemplates);
    const selectedType = templateTypes[Math.floor(Math.random() * templateTypes.length)];
    
    // 메인 키워드 선택 (상위 3개 중 랜덤)
    const mainKeyword = keywords[Math.floor(Math.random() * Math.min(3, keywords.length))];
    
    return {
      type: selectedType,
      template: this.postTemplates[selectedType],
      mainKeyword: mainKeyword,
      sourceContent: topContent,
      relatedKeywords: keywords.slice(0, 5)
    };
  }

  /**
   * OpenAI 프롬프트 생성
   */
  generatePrompt(topic, config) {
    const { type, template, mainKeyword, sourceContent, relatedKeywords } = topic;
    
    // 소스 콘텐츠에서 핵심 정보 추출
    const contentSummary = sourceContent
      .map(content => `- ${content.title}: ${content.excerpt}`)
      .join('\n');

    const prompt = `
당신은 한국의 전문 기술 블로거입니다. 다음 조건에 맞는 고품질 블로그 포스트를 작성해주세요.

**주제:** ${mainKeyword}
**포스트 타입:** ${type}
**톤:** ${template.tone}
**길이:** ${template.length}

**참고 자료:**
${contentSummary}

**구성 섹션:**
${template.sections.map((section, index) => `${index + 1}. ${section}`).join('\n')}

**관련 키워드:** ${relatedKeywords.join(', ')}

**작성 요구사항:**
1. ${siteConfig.automation.contentLanguage === 'korean' ? '한국어' : siteConfig.automation.contentLanguage}로 작성
2. ${siteConfig.automation.targetAudience}를 대상으로 하는 전문적이면서도 이해하기 쉬운 내용
3. 실용적이고 구체적인 정보 포함
4. SEO에 최적화된 구조
5. ${config.generation.minWordCount}-${config.generation.maxWordCount} 단어 분량
6. 마크다운 형식으로 작성
7. 코드 예제 포함 (해당하는 경우)

**출력 형식:**
제목과 본문을 포함한 완전한 마크다운 블로그 포스트를 작성해주세요.
외부 링크는 포함하지 마세요.
`;

    return prompt;
  }

  /**
   * OpenAI API 호출 시뮬레이션
   */
  async callOpenAI(prompt, config) {
    await this.logger.info('OpenAI API 호출 중...');
    
    // TODO: 실제 OpenAI API 연동
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // const response = await openai.chat.completions.create({
    //   model: config.openai.model,
    //   messages: [{ role: 'user', content: prompt }],
    //   max_tokens: config.openai.maxTokens,
    //   temperature: config.openai.temperature
    // });
    
    // 시뮬레이션 응답
    const simulatedResponse = `# 2025년 AI 기술 트렌드: 생성형 AI의 새로운 전환점

## 소개

인공지능 기술은 2025년 들어 전례 없는 발전을 보이고 있습니다. 특히 생성형 AI 분야에서는 기존의 한계를 뛰어넘는 혁신적인 기술들이 등장하고 있어 주목받고 있습니다.

## 현재 상황

현재 AI 업계는 다음과 같은 주요 변화를 겪고 있습니다:

- **대규모 언어 모델의 효율성 향상**: 더 적은 자원으로 더 나은 성능을 달성
- **멀티모달 AI의 발전**: 텍스트, 이미지, 음성을 통합적으로 처리
- **실시간 처리 능력 강화**: 지연 시간 최소화와 실시간 상호작용

## 주요 트렌드

### 1. 개인화된 AI 어시스턴트

사용자의 개별적인 니즈에 맞춘 맞춤형 AI 어시스턴트가 주목받고 있습니다.

### 2. AI 기반 코드 생성

개발자들을 위한 AI 코딩 도구들이 더욱 정교해지고 있습니다.

\`\`\`javascript
// AI가 생성한 코드 예시
function optimizePerformance(data) {
  return data
    .filter(item => item.isValid)
    .map(item => ({
      ...item,
      optimized: true
    }));
}
\`\`\`

### 3. 엣지 AI의 확산

클라우드가 아닌 로컬 디바이스에서 AI를 실행하는 기술이 발전하고 있습니다.

## 예상 영향

이러한 트렌드들은 다음과 같은 영향을 미칠 것으로 예상됩니다:

1. **개발 생산성 향상**: AI 도구를 활용한 개발 속도 증가
2. **새로운 비즈니스 모델**: AI 기반 서비스의 다양화
3. **일자리 변화**: 기존 직무의 변화와 새로운 직군 창출

## 대응 방안

### 개발자를 위한 권장사항

- AI 도구 활용 능력 향상
- 새로운 프레임워크 학습
- 윤리적 AI 개발 고려

### 기업을 위한 전략

- AI 도입 로드맵 수립
- 인력 재교육 프로그램 운영
- 데이터 품질 관리 강화

## 전망

2025년 하반기에는 AI 기술이 더욱 일반화되어 일상생활 곳곳에 스며들 것으로 예상됩니다. 특히 한국은 AI 분야에서 선도적인 역할을 할 수 있는 기회를 맞고 있습니다.

개발자들은 이러한 변화에 적극적으로 대응하여 새로운 기회를 포착해야 할 때입니다.`;

    await this.logger.info('OpenAI 응답 생성 완료 (시뮬레이션)');
    return simulatedResponse;
  }

  /**
   * 마크다운 포스트 메타데이터 생성
   */
  generatePostMetadata(title, topic, config) {
    const slug = StringUtils.titleToSlug(title);
    const today = DateUtils.getToday();
    const readingTime = DateUtils.calculateReadingTimeKorean(topic.mainKeyword);
    const imageNumber = DateUtils.getRandomImageNumber();

    return {
      title: title.replace(/^# /, ''), // 마크다운 헤딩 제거
      date: today,
      slug: slug,
      excerpt: `${topic.mainKeyword} 관련 최신 동향과 전문가 인사이트를 제공합니다.`,
      image: `https://picsum.photos/1200/600?random=${imageNumber}`,
      tags: topic.relatedKeywords.slice(0, 5),
      author: 'WebMaker AI',
      readingTime: readingTime,
      category: topic.type
    };
  }

  /**
   * 완전한 마크다운 포스트 생성
   */
  createMarkdownPost(content, metadata) {
    const frontmatter = `---
title: "${metadata.title}"
date: "${metadata.date}"
slug: "${metadata.slug}"
excerpt: "${metadata.excerpt}"
image: "${metadata.image}"
tags:
${metadata.tags.map(tag => `  - "${tag}"`).join('\n')}
author: "${metadata.author}"
readingTime: ${metadata.readingTime}
category: "${metadata.category}"
---

`;

    return frontmatter + content;
  }

  /**
   * 포스트 파일 저장
   */
  async savePost(markdownContent, metadata) {
    await FileUtils.ensureDir(this.outputDir);
    
    const filename = `${metadata.slug}.md`;
    const filepath = path.join(this.outputDir, filename);
    
    // 기존 파일 백업
    if (await FileUtils.exists(filepath)) {
      await FileUtils.backup(filepath);
      await this.logger.info(`기존 파일 백업: ${filename}`);
    }
    
    await FileUtils.writeText(filepath, markdownContent);
    await this.logger.info(`포스트 저장 완료: ${filepath}`);
    
    return {
      filename,
      filepath,
      metadata
    };
  }

  /**
   * 메인 실행 함수
   */
  async execute() {
    try {
      await this.logger.info('블로그 포스트 생성 작업 시작');
      
      // 1. 설정 및 데이터 로드
      const config = await this.loadConfig();
      const contentData = await this.loadContentData();
      
      // 2. 포스트 주제 선택
      const topic = this.selectPostTopic(contentData);
      await this.logger.info(`선택된 주제: ${topic.mainKeyword} (${topic.type})`);
      
      // 3. AI 프롬프트 생성
      const prompt = this.generatePrompt(topic, config);
      
      // 4. OpenAI를 통한 콘텐츠 생성
      const generatedContent = await this.callOpenAI(prompt, config);
      
      // 5. 제목 추출
      const titleMatch = generatedContent.match(/^# (.+)$/m);
      const title = titleMatch ? titleMatch[1] : `${topic.mainKeyword} 완전 가이드`;
      
      // 6. 메타데이터 생성
      const metadata = this.generatePostMetadata(title, topic, config);
      
      // 7. 완전한 마크다운 포스트 생성
      const markdownPost = this.createMarkdownPost(generatedContent, metadata);
      
      // 8. 파일 저장
      const savedPost = await this.savePost(markdownPost, metadata);
      
      // 9. 결과 정리
      const result = {
        success: true,
        post: savedPost,
        topic: topic,
        metadata: {
          generatedBy: 'generate-post.js',
          version: '1.0.0',
          generatedAt: DateUtils.getNow(),
          wordCount: StringUtils.stripMarkdown(generatedContent).split(/\s+/).length,
          config: {
            model: config.openai.model,
            temperature: config.openai.temperature
          }
        }
      };

      await this.logger.success('블로그 포스트 생성 완료', {
        title: metadata.title,
        slug: metadata.slug,
        wordCount: result.metadata.wordCount,
        file: savedPost.filepath
      });

      return result;

    } catch (error) {
      await this.logger.error('블로그 포스트 생성 실패', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }
}

// 직접 실행시
if (require.main === module) {
  const generator = new PostGenerator();
  generator.execute()
    .then(result => {
      console.log('포스트 생성 성공:', result.post.filename);
      process.exit(0);
    })
    .catch(error => {
      console.error('포스트 생성 실패:', error.message);
      process.exit(1);
    });
}

module.exports = PostGenerator;
/**
 * generate-post.js (Refactored)
 * 모듈화된 OpenAI API를 사용하여 블로그 포스트를 생성합니다.
 * 실행 시간: 약 15분
 */

// 환경변수 로드
require('dotenv').config();

const Logger = require('./utils/logger');
const FileUtils = require('./utils/file-utils');
const DateUtils = require('./utils/date-utils');
const StringUtils = require('./utils/string-utils');
const path = require('path');

// 모듈화된 생성 클래스들
const OpenAIGenerator = require('./apis/openai-generator');
const RateLimiter = require('./apis/rate-limiter');

// 사이트 설정 로드
const siteConfig = require('../config/site.config.js');

class BlogPostGenerator {
  constructor() {
    this.logger = new Logger('generate-post');
    this.contentDataPath = path.join(__dirname, '../config/content-data.json');
    this.keywordsPath = path.join(__dirname, '../config/keywords-today.json');
    this.configPath = path.join(__dirname, '../config/generation-config.json');
    this.outputDir = path.join(__dirname, '../content/posts');
    
    // 생성 모듈들 초기화
    this.rateLimiter = new RateLimiter(this.logger);
    this.openaiGenerator = new OpenAIGenerator(this.logger, this.rateLimiter);
    
    // 포스트 타입별 확률 (가중치)
    this.postTypeWeights = {
      tutorial: 0.3,    // 튜토리얼 30%
      trend: 0.25,      // 트렌드 분석 25%
      review: 0.2,      // 리뷰 20%
      guide: 0.15,      // 가이드 15%
      news: 0.1         // 뉴스 10%
    };
  }

  /**
   * 생성 설정 로드
   */
  async loadConfig() {
    try {
      const config = await FileUtils.readJson(this.configPath);
      if (config) {
        await this.logger.info('생성 설정 파일 로드 완료', { configFile: this.configPath });
        return config;
      }
    } catch (error) {
      await this.logger.warning('설정 파일 로드 실패, 기본 설정 사용', { error: error.message });
    }

    // 기본 설정 생성 (사이트 설정 기반)
    const defaultConfig = {
      generation: {
        model: siteConfig.apis.openai.model,
        maxTokens: siteConfig.apis.openai.maxTokens,
        temperature: siteConfig.apis.openai.temperature,
        minWordCount: 800,
        maxWordCount: 2500,
        targetAudience: siteConfig.automation.targetAudience,
        contentLanguage: siteConfig.automation.contentLanguage
      },
      output: {
        useRandomImages: true,
        generateExcerpt: true,
        addReadingTime: true,
        includeMetadata: true
      },
      quality: {
        minKeywordDensity: 0.01,
        maxKeywordDensity: 0.05,
        requireCodeExamples: false,
        seoOptimize: true
      },
      postTypes: {
        enabled: ['tutorial', 'trend', 'review', 'guide', 'news'],
        weights: this.postTypeWeights
      },
      lastUpdated: DateUtils.getNow()
    };

    await FileUtils.writeJson(this.configPath, defaultConfig);
    await this.logger.info('기본 생성 설정 생성 완료');
    return defaultConfig;
  }

  /**
   * 콘텐츠 데이터 로드
   */
  async loadContentData() {
    try {
      const contentData = await FileUtils.readJson(this.contentDataPath);
      if (!contentData || !contentData.processedContent) {
        throw new Error('처리된 콘텐츠 데이터가 없음');
      }

      await this.logger.info('콘텐츠 데이터 로드 완료', {
        contentCount: contentData.processedContent.length,
        avgQuality: contentData.summary.avgQuality
      });

      return contentData;
    } catch (error) {
      await this.logger.warning('콘텐츠 데이터 로드 실패, 폴백 데이터 사용', { error: error.message });
      
      // 폴백 데이터 생성
      return this.generateFallbackContentData();
    }
  }

  /**
   * 키워드 데이터 로드
   */
  async loadKeywords() {
    try {
      const keywordData = await FileUtils.readJson(this.keywordsPath);
      if (!keywordData || !keywordData.finalKeywords) {
        throw new Error('키워드 데이터가 없음');
      }

      return keywordData.finalKeywords;
    } catch (error) {
      await this.logger.warning('키워드 데이터 로드 실패, 기본 키워드 사용', { error: error.message });
      
      // 기본 키워드 반환
      return siteConfig.automation.categories.map((category, index) => ({
        keyword: category,
        score: 70 - index * 5,
        category: 'default',
        source: 'config'
      }));
    }
  }

  /**
   * 폴백 콘텐츠 데이터 생성
   */
  generateFallbackContentData() {
    return {
      processedContent: [
        {
          title: '기술 트렌드 분석',
          content: '최신 기술 트렌드에 대한 심층 분석',
          summary: '2025년 주요 기술 트렌드를 살펴봅니다',
          quality: { score: 75 },
          finalScore: 75,
          url: 'https://example.com/tech-trends'
        }
      ],
      summary: { avgQuality: 75 }
    };
  }

  /**
   * 포스트 타입 선택
   */
  selectPostType(config) {
    if (!config.postTypes || !config.postTypes.enabled) {
      return 'tutorial'; // 기본값
    }
    
    const enabledTypes = config.postTypes.enabled;
    const weights = config.postTypes.weights || {};
    
    // 가중치 기반 랜덤 선택
    const random = Math.random();
    let cumulativeWeight = 0;
    let totalWeight = 0;
    
    // 총 가중치 계산
    for (const type of enabledTypes) {
      totalWeight += weights[type] || 0;
    }
    
    if (totalWeight === 0) {
      // 가중치가 없으면 균등 선택
      return enabledTypes[Math.floor(Math.random() * enabledTypes.length)];
    }
    
    // 정규화된 가중치로 선택
    for (const type of enabledTypes) {
      cumulativeWeight += (weights[type] || 0) / totalWeight;
      if (random <= cumulativeWeight) {
        return type;
      }
    }
    
    // 폴백
    return enabledTypes[0] || 'tutorial';
  }

  /**
   * 최적 키워드 선택
   */
  selectOptimalKeyword(keywords, contentData) {
    // 점수가 높고 관련 콘텐츠가 많은 키워드 우선 선택
    const keywordScores = keywords.map(kw => {
      const relatedContent = contentData.processedContent.filter(content => 
        content.content.toLowerCase().includes(kw.keyword.toLowerCase()) ||
        content.title.toLowerCase().includes(kw.keyword.toLowerCase())
      );
      
      return {
        ...kw,
        contentCount: relatedContent.length,
        totalScore: kw.score + relatedContent.length * 10
      };
    });

    // 총점 기준으로 정렬하여 상위 키워드 선택
    const topKeywords = keywordScores
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3);

    // 상위 3개 중 랜덤 선택
    return topKeywords[Math.floor(Math.random() * topKeywords.length)];
  }

  /**
   * 프롬프트 생성
   */
  generatePrompt(keyword, postType, contentData, config) {
    const relevantContent = this.findRelevantContent(keyword.keyword, contentData);
    const contentSummary = this.createContentSummary(relevantContent);
    const relatedKeywords = this.extractRelatedKeywords(keyword, contentData);

    const prompt = `다음 정보를 바탕으로 "${keyword.keyword}"에 대한 ${postType} 형식의 블로그 포스트를 작성해주세요.

**주제:** ${keyword.keyword}
**포스트 타입:** ${postType}
**대상 독자:** ${config.generation?.targetAudience || 'developers'}
**언어:** ${config.generation?.language === 'korean' ? '한국어' : (config.generation?.language || '한국어')}

**참고 자료:**
${contentSummary}

**관련 키워드:** ${relatedKeywords.join(', ')}

**작성 요구사항:**
1. ${config.generation?.minWordCount || 800}-${config.generation?.maxWordCount || 2000} 단어 분량
2. 실용적이고 구체적인 정보 포함
3. SEO에 최적화된 구조
4. 마크다운 형식으로 작성
5. ${config.content?.includeCodeExamples || config.quality?.requireCodeExamples ? '코드 예제 필수 포함' : '필요시 코드 예제 포함'}
6. 외부 링크는 포함하지 마세요

**출력 형식:**
완전한 마크다운 블로그 포스트를 작성해주세요. 제목(# )부터 시작하여 체계적인 구조로 작성해주세요.`;

    return prompt;
  }

  /**
   * 관련 콘텐츠 찾기
   */
  findRelevantContent(keyword, contentData) {
    const keywordLower = keyword.toLowerCase();
    
    return contentData.processedContent
      .filter(content => {
        const contentText = `${content.title} ${content.content}`.toLowerCase();
        return contentText.includes(keywordLower);
      })
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 3); // 상위 3개만 사용
  }

  /**
   * 콘텐츠 요약 생성
   */
  createContentSummary(relevantContent) {
    if (!relevantContent.length) {
      return '관련 콘텐츠가 없습니다. 일반적인 지식을 바탕으로 작성해주세요.';
    }

    return relevantContent.map((content, index) => 
      `${index + 1}. ${content.title}\n   요약: ${content.summary || content.content.substring(0, 200) + '...'}`
    ).join('\n\n');
  }

  /**
   * 관련 키워드 추출
   */
  extractRelatedKeywords(mainKeyword, contentData) {
    const allKeywords = new Set();
    
    // 관련 콘텐츠에서 키워드 추출
    const relevantContent = this.findRelevantContent(mainKeyword.keyword, contentData);
    relevantContent.forEach(content => {
      if (content.extractedTags) {
        content.extractedTags.forEach(tag => allKeywords.add(tag));
      }
    });

    // 메인 키워드와 유사한 키워드 추가
    const similarKeywords = this.generateSimilarKeywords(mainKeyword.keyword);
    similarKeywords.forEach(kw => allKeywords.add(kw));

    return Array.from(allKeywords).slice(0, 5); // 최대 5개
  }

  /**
   * 유사 키워드 생성
   */
  generateSimilarKeywords(keyword) {
    const keywordMap = {
      'JavaScript': ['JS', 'ECMAScript', 'Node.js', 'React', 'Vue.js'],
      'React': ['리액트', 'JSX', 'Next.js', 'JavaScript', 'Frontend'],
      'AI': ['인공지능', 'Machine Learning', '머신러닝', 'Deep Learning', 'ChatGPT'],
      '인공지능': ['AI', 'Artificial Intelligence', '머신러닝', '딥러닝', 'ML'],
      'Python': ['파이썬', 'Django', 'Flask', 'FastAPI', 'NumPy'],
      'TypeScript': ['TS', 'JavaScript', 'Type Safety', '타입스크립트']
    };

    return keywordMap[keyword] || [];
  }

  /**
   * 마크다운 프론트매터 생성
   */
  generateFrontmatter(postData, config) {
    const now = new Date();
    const tags = Array.isArray(postData.metadata.tags) ? postData.metadata.tags : [];
    
    return {
      title: postData.title,
      date: DateUtils.getToday(),
      slug: StringUtils.titleToSlug(postData.title),
      excerpt: postData.excerpt,
      image: config.content?.includeImages || config.output?.useRandomImages ? this.generateImageUrl() : null,
      author: siteConfig.branding.author,
      tags,
      category: postData.metadata.category || 'general',
      readingTime: postData.metadata.readingTime,
      difficulty: postData.metadata.difficulty || 'intermediate',
      lastModified: now.toISOString(),
      seo: {
        keywords: tags,
        description: postData.excerpt
      }
    };
  }

  /**
   * 랜덤 이미지 URL 생성
   */
  generateImageUrl() {
    const imageConfig = siteConfig.images;
    const randomSeed = Math.floor(Math.random() * 1000) + 1;
    
    if (imageConfig.provider === 'picsum') {
      return `https://picsum.photos/1200/600?random=${randomSeed}`;
    } else if (imageConfig.provider === 'unsplash') {
      return `https://source.unsplash.com/1200x600/?technology,coding&${randomSeed}`;
    }
    
    return imageConfig.defaultImage;
  }

  /**
   * 마크다운 파일 생성
   */
  async createMarkdownFile(postData, frontmatter) {
    const filename = `${frontmatter.slug}.md`;
    const filePath = path.join(this.outputDir, filename);
    
    // 프론트매터를 YAML 형식으로 변환
    const yamlFrontmatter = this.convertToYAML(frontmatter);
    
    const markdownContent = `---
${yamlFrontmatter}
---

${postData.content}`;

    await FileUtils.writeText(filePath, markdownContent);
    
    await this.logger.info('마크다운 파일 생성 완료', {
      filename,
      filePath,
      wordCount: postData.metadata.wordCount,
      readingTime: postData.metadata.readingTime
    });

    return {
      filename,
      filePath,
      slug: frontmatter.slug,
      title: frontmatter.title
    };
  }

  /**
   * 객체를 YAML 형식으로 변환
   */
  convertToYAML(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      
      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          yaml += `${spaces}  - "${item}"\n`;
        });
      } else if (typeof value === 'object') {
        yaml += `${spaces}${key}:\n`;
        yaml += this.convertToYAML(value, indent + 1);
      } else if (typeof value === 'string') {
        // 따옴표가 필요한 문자열인지 확인
        const needsQuotes = value.includes(':') || value.includes('\n') || value.includes('"');
        yaml += `${spaces}${key}: ${needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value}\n`;
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return yaml;
  }

  /**
   * 메인 실행 함수
   */
  async execute() {
    const startTime = Date.now();

    try {
      await this.logger.info('블로그 포스트 생성 작업 시작');

      // 1. 설정 및 데이터 로드
      const config = await this.loadConfig();
      const contentData = await this.loadContentData();
      const keywords = await this.loadKeywords();

      // 2. 포스트 타입 선택
      const postType = this.selectPostType(config);
      await this.logger.info('포스트 타입 선택됨', { postType });

      // 3. 최적 키워드 선택
      const selectedKeyword = this.selectOptimalKeyword(keywords, contentData);
      await this.logger.info('키워드 선택됨', { 
        keyword: selectedKeyword.keyword,
        score: selectedKeyword.score,
        contentCount: selectedKeyword.contentCount 
      });

      // 4. 프롬프트 생성
      const prompt = this.generatePrompt(selectedKeyword, postType, contentData, config);
      await this.logger.info('프롬프트 생성 완료', { promptLength: prompt.length });

      // 5. OpenAI를 통한 콘텐츠 생성
      const generationResult = await this.openaiGenerator.generateBlogPost(prompt, postType, {
        model: config.openai?.model || config.generation?.model || 'gpt-4',
        temperature: config.openai?.temperature || config.generation?.temperature || 0.7,
        maxTokens: config.openai?.maxTokens || config.generation?.maxTokens || 2000
      });

      // 6. 콘텐츠 후처리
      const processedPost = await this.openaiGenerator.postProcessContent(
        generationResult.content,
        {
          keyword: selectedKeyword.keyword,
          category: selectedKeyword.category,
          seoOptimize: config.content?.seoOptimized || config.quality?.seoOptimize || true,
          title: selectedKeyword.keyword
        }
      );

      // 7. 프론트매터 생성
      const frontmatter = this.generateFrontmatter(processedPost, config);

      // 8. 마크다운 파일 생성
      const fileInfo = await this.createMarkdownFile(processedPost, frontmatter);

      // 9. 최종 결과
      const result = {
        date: DateUtils.getToday(),
        timestamp: DateUtils.getNow(),
        executionTimeMs: Date.now() - startTime,
        generatedPost: {
          ...fileInfo,
          keyword: selectedKeyword.keyword,
          postType,
          wordCount: processedPost.metadata.wordCount,
          readingTime: processedPost.metadata.readingTime,
          qualityScore: selectedKeyword.totalScore
        },
        generationMetadata: {
          ...generationResult.metadata,
          configUsed: {
            model: config.openai?.model || config.generation?.model || 'gpt-4',
            temperature: config.openai?.temperature || config.generation?.temperature || 0.7,
            maxTokens: config.openai?.maxTokens || config.generation?.maxTokens || 2000
          }
        },
        processing: {
          keywordsAnalyzed: keywords.length,
          contentSourcesUsed: contentData.processedContent.length,
          selectedKeyword: selectedKeyword.keyword,
          postType
        },
        metadata: {
          generatedBy: 'generate-post.js',
          version: '2.0.0',
          openaiVersion: generationResult.metadata.model
        }
      };

      await this.logger.success('블로그 포스트 생성 작업 완료', {
        title: fileInfo.title,
        filename: fileInfo.filename,
        wordCount: processedPost.metadata.wordCount,
        executionTimeMs: result.executionTimeMs,
        tokensUsed: generationResult.metadata.tokensUsed
      });

      return result;

    } catch (error) {
      await this.logger.error('블로그 포스트 생성 작업 실패', {
        error: error.message,
        stack: error.stack,
        executionTimeMs: Date.now() - startTime
      });
      throw error;
    }
  }
}

// 직접 실행 시
if (require.main === module) {
  const generator = new BlogPostGenerator();
  generator.execute()
    .then(result => {
      console.log('✅ 블로그 포스트 생성 완료:', {
        title: result.generatedPost.title,
        wordCount: result.generatedPost.wordCount,
        time: `${result.executionTimeMs}ms`,
        tokens: result.generationMetadata.tokensUsed || 0
      });
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 블로그 포스트 생성 실패:', error.message);
      process.exit(1);
    });
}

module.exports = BlogPostGenerator;
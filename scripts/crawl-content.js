/**
 * crawl-content.js
 * Puppeteer를 활용하여 웹에서 키워드 관련 콘텐츠를 크롤링합니다.
 * 실행 시간: 약 7분
 */

const Logger = require('./utils/logger');
const FileUtils = require('./utils/file-utils');
const DateUtils = require('./utils/date-utils');
const StringUtils = require('./utils/string-utils');
const path = require('path');

class ContentCrawler {
  constructor() {
    this.logger = new Logger('crawl-content');
    this.keywordsPath = path.join(__dirname, '../config/keywords-today.json');
    this.outputPath = path.join(__dirname, '../config/content-data.json');
    this.configPath = path.join(__dirname, '../config/crawl-config.json');
    
    // 기본 크롤링 소스
    this.defaultSources = {
      tech: [
        'https://news.ycombinator.com',
        'https://dev.to',
        'https://medium.com/topic/programming'
      ],
      korean: [
        'https://blog.naver.com',
        'https://velog.io',
        'https://tistory.com'
      ]
    };
  }

  /**
   * 크롤링 설정 로드
   */
  async loadConfig() {
    try {
      const config = await FileUtils.readJson(this.configPath);
      if (config) {
        await this.logger.info('크롤링 설정 파일 로드 완료');
        return config;
      }
    } catch (error) {
      await this.logger.warning('설정 파일 로드 실패, 기본 설정 사용');
    }

    // 기본 설정 생성
    const defaultConfig = {
      sources: this.defaultSources,
      maxPagesPerSource: 5,
      crawlDelay: 2000, // 2초 간격
      timeout: 30000, // 30초 타임아웃
      userAgent: 'WebMaker-Bot/1.0',
      respectRobotsTxt: true,
      maxConcurrency: 3,
      lastUpdated: DateUtils.getNow()
    };

    await FileUtils.writeJson(this.configPath, defaultConfig);
    await this.logger.info('기본 크롤링 설정 생성 완료');
    return defaultConfig;
  }

  /**
   * 오늘의 키워드 로드
   */
  async loadKeywords() {
    try {
      const keywordData = await FileUtils.readJson(this.keywordsPath);
      if (!keywordData || !keywordData.finalKeywords) {
        throw new Error('키워드 데이터를 찾을 수 없습니다. collect-keywords.js를 먼저 실행하세요.');
      }
      
      await this.logger.info(`${keywordData.finalKeywords.length}개 키워드 로드 완료`);
      return keywordData.finalKeywords;
      
    } catch (error) {
      await this.logger.error('키워드 로드 실패', { error: error.message });
      throw error;
    }
  }

  /**
   * Puppeteer 초기화 (실제 구현은 Step 4-6에서)
   */
  async initBrowser() {
    await this.logger.info('브라우저 초기화 중...');
    
    // TODO: 실제 Puppeteer 초기화
    // const puppeteer = require('puppeteer');
    // this.browser = await puppeteer.launch({ headless: true });
    
    // 시뮬레이션용
    this.browser = { simulated: true };
    await this.logger.info('브라우저 초기화 완료 (시뮬레이션 모드)');
  }

  /**
   * 웹페이지 크롤링 시뮬레이션
   */
  async crawlPage(url, keywords) {
    await this.logger.info(`페이지 크롤링 중: ${url}`);
    
    // TODO: 실제 Puppeteer 크롤링 구현
    // const page = await this.browser.newPage();
    // await page.goto(url);
    // const content = await page.evaluate(() => document.body.innerText);
    
    // 시뮬레이션 데이터
    const simulatedContent = {
      url,
      title: `${keywords[0]} 관련 최신 기술 동향`,
      content: `${keywords[0]}는 현재 가장 주목받는 기술 중 하나입니다. 
                최근 연구에 따르면 ${keywords[0]} 기술의 발전으로 인해 
                업계에 큰 변화가 예상됩니다. 특히 ${keywords[1] || '관련 기술'}과의 
                융합을 통해 새로운 가능성이 열리고 있습니다.`,
      publishDate: DateUtils.getToday(),
      author: 'Tech Writer',
      tags: keywords.slice(0, 3),
      relevanceScore: Math.floor(Math.random() * 40) + 60, // 60-100
      crawledAt: DateUtils.getNow()
    };

    await this.logger.info(`크롤링 완료: ${simulatedContent.title}`);
    return simulatedContent;
  }

  /**
   * 키워드별 콘텐츠 검색
   */
  async searchKeywordContent(keyword, sources, maxPages = 3) {
    await this.logger.info(`키워드 "${keyword}" 관련 콘텐츠 검색 중`);
    
    const results = [];
    
    for (const source of sources.slice(0, 2)) { // 소스당 최대 2개
      try {
        // 검색 시뮬레이션
        const searchResults = await this.simulateSearch(keyword, source);
        
        for (const result of searchResults.slice(0, maxPages)) {
          const content = await this.crawlPage(result.url, [keyword]);
          results.push(content);
          
          // 크롤링 간격
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        await this.logger.warning(`소스 크롤링 실패: ${source}`, { error: error.message });
      }
    }

    await this.logger.info(`키워드 "${keyword}"에서 ${results.length}개 콘텐츠 수집`);
    return results;
  }

  /**
   * 검색 결과 시뮬레이션
   */
  async simulateSearch(keyword, source) {
    // TODO: 실제 검색 API 또는 페이지 검색 구현
    return [
      { url: `${source}/search?q=${encodeURIComponent(keyword)}&page=1` },
      { url: `${source}/search?q=${encodeURIComponent(keyword)}&page=2` },
      { url: `${source}/search?q=${encodeURIComponent(keyword)}&page=3` }
    ];
  }

  /**
   * 콘텐츠 품질 평가
   */
  evaluateContentQuality(content) {
    let score = 0;
    
    // 콘텐츠 길이 평가
    if (content.content.length > 500) score += 20;
    if (content.content.length > 1000) score += 10;
    
    // 제목 품질 평가
    if (content.title && content.title.length > 10) score += 15;
    
    // 태그 개수 평가
    if (content.tags && content.tags.length > 0) score += 10;
    
    // 발행일 최신성 평가
    const daysSincePublish = DateUtils.getDaysBetween(content.publishDate, DateUtils.getToday());
    if (daysSincePublish <= 7) score += 20;
    else if (daysSincePublish <= 30) score += 10;
    
    // 관련성 점수 반영
    score += content.relevanceScore * 0.3;
    
    return Math.min(100, score);
  }

  /**
   * 콘텐츠 필터링 및 정제
   */
  filterAndCleanContent(allContent) {
    return allContent
      .map(content => ({
        ...content,
        qualityScore: this.evaluateContentQuality(content),
        excerpt: StringUtils.extractExcerpt(content.content, 2),
        cleanContent: StringUtils.cleanText(content.content)
      }))
      .filter(content => content.qualityScore > 40) // 품질 점수 40 이상만
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, 20); // 상위 20개만 선택
  }

  /**
   * 브라우저 정리
   */
  async cleanup() {
    if (this.browser && this.browser.close) {
      await this.browser.close();
    }
    await this.logger.info('브라우저 정리 완료');
  }

  /**
   * 메인 실행 함수
   */
  async execute() {
    try {
      await this.logger.info('콘텐츠 크롤링 작업 시작');
      
      // 1. 설정 및 키워드 로드
      const config = await this.loadConfig();
      const keywords = await this.loadKeywords();
      
      // 2. 브라우저 초기화
      await this.initBrowser();
      
      // 3. 키워드별 콘텐츠 수집
      const allContent = [];
      const topKeywords = keywords.slice(0, 10); // 상위 10개 키워드만
      
      for (const keywordData of topKeywords) {
        const keyword = keywordData.keyword;
        const sources = [...config.sources.tech, ...config.sources.korean];
        
        const keywordContent = await this.searchKeywordContent(
          keyword, 
          sources, 
          config.maxPagesPerSource
        );
        
        allContent.push(...keywordContent);
        
        // 키워드 간 간격
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // 4. 콘텐츠 품질 평가 및 필터링
      const qualityContent = this.filterAndCleanContent(allContent);

      // 5. 결과 저장
      const result = {
        date: DateUtils.getToday(),
        timestamp: DateUtils.getNow(),
        totalCrawled: allContent.length,
        qualityContent: qualityContent,
        keywordsProcessed: topKeywords.map(k => k.keyword),
        sources: Object.values(config.sources).flat(),
        metadata: {
          generatedBy: 'crawl-content.js',
          version: '1.0.0',
          executionTime: Date.now(),
          config: {
            maxPagesPerSource: config.maxPagesPerSource,
            crawlDelay: config.crawlDelay
          }
        }
      };

      await FileUtils.writeJson(this.outputPath, result);
      
      await this.logger.success('콘텐츠 크롤링 완료', {
        total: allContent.length,
        quality: qualityContent.length,
        keywords: topKeywords.length,
        outputFile: this.outputPath
      });

      return result;

    } catch (error) {
      await this.logger.error('콘텐츠 크롤링 실패', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// 직접 실행시
if (require.main === module) {
  const crawler = new ContentCrawler();
  crawler.execute()
    .then(result => {
      console.log('콘텐츠 크롤링 성공:', result.qualityContent.length, '개');
      process.exit(0);
    })
    .catch(error => {
      console.error('콘텐츠 크롤링 실패:', error.message);
      process.exit(1);
    });
}

module.exports = ContentCrawler;
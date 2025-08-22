/**
 * crawl-content.js (Refactored)
 * 모듈화된 웹 크롤러를 사용하여 콘텐츠를 수집합니다.
 * 실행 시간: 약 7분
 */

// 환경변수 로드
require('dotenv').config();

const Logger = require('./utils/logger');
const FileUtils = require('./utils/file-utils');
const DateUtils = require('./utils/date-utils');
const path = require('path');

// 모듈화된 크롤링 클래스들
const WebCrawler = require('./apis/web-crawler');
const ContentProcessor = require('./apis/content-processor');

// 사이트 설정 로드
const siteConfig = require('../config/site.config.js');

class ContentCrawler {
  constructor() {
    this.logger = new Logger('crawl-content');
    this.keywordsPath = path.join(__dirname, '../config/keywords-today.json');
    this.outputPath = path.join(__dirname, '../config/content-data.json');
    this.configPath = path.join(__dirname, '../config/crawl-config.json');
    
    // 크롤링 모듈들 초기화
    this.webCrawler = new WebCrawler(this.logger);
    this.contentProcessor = new ContentProcessor(this.logger);
    
    // 기본 URL 소스들
    this.urlSources = {
      search: {
        google: 'https://www.google.com/search?q={keyword}',
        bing: 'https://www.bing.com/search?q={keyword}'
      },
      blogs: [
        'https://medium.com',
        'https://dev.to',
        'https://blog.naver.com',
        'https://velog.io'
      ],
      tech: [
        'https://techcrunch.com',
        'https://stackoverflow.blog',
        'https://github.blog',
        'https://css-tricks.com'
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
        await this.logger.info('크롤링 설정 파일 로드 완료', { configFile: this.configPath });
        return config;
      }
    } catch (error) {
      await this.logger.warning('설정 파일 로드 실패, 기본 설정 사용', { error: error.message });
    }

    // 기본 설정 생성
    const defaultConfig = {
      maxUrlsPerKeyword: 5,
      maxConcurrentCrawls: 3,
      crawlTimeout: 30000,
      minQualityScore: 40,
      enableImageExtraction: true,
      sources: {
        googleSearch: true,
        bingSearch: false, // Bing은 기본적으로 비활성화
        directBlogs: true,
        techSites: true,
        socialMedia: false // 소셜미디어는 별도 API 필요
      },
      filters: {
        languages: ['ko', 'en'],
        minWordCount: 100,
        maxDuplicateThreshold: 0.8,
        blacklistDomains: ['facebook.com', 'twitter.com', 'instagram.com']
      },
      lastUpdated: DateUtils.getNow()
    };

    await FileUtils.writeJson(this.configPath, defaultConfig);
    await this.logger.info('기본 크롤링 설정 생성 완료');
    return defaultConfig;
  }

  /**
   * 키워드 데이터 로드
   */
  async loadKeywords() {
    try {
      const keywordData = await FileUtils.readJson(this.keywordsPath);
      if (!keywordData || !keywordData.finalKeywords) {
        throw new Error('키워드 데이터가 없거나 형식이 잘못됨');
      }

      await this.logger.info('키워드 데이터 로드 완료', {
        keywordCount: keywordData.finalKeywords.length,
        date: keywordData.date
      });

      return keywordData.finalKeywords;
    } catch (error) {
      await this.logger.error('키워드 데이터 로드 실패', { error: error.message });
      
      // 폴백 키워드 사용
      const fallbackKeywords = siteConfig.automation.categories.map(category => ({
        keyword: category,
        score: 50,
        category: 'fallback',
        source: 'config'
      }));

      await this.logger.warning('폴백 키워드 사용', { count: fallbackKeywords.length });
      return fallbackKeywords;
    }
  }

  /**
   * 키워드별 URL 검색
   */
  async searchUrlsForKeyword(keyword, config) {
    const urls = new Set();
    const searchKeyword = encodeURIComponent(keyword);

    await this.logger.info(`키워드 "${keyword}"에 대한 URL 검색 시작`);

    // Google 검색 시뮬레이션 (실제로는 검색 API 필요)
    if (config.sources.googleSearch) {
      const searchUrls = await this.simulateGoogleSearch(keyword);
      searchUrls.forEach(url => urls.add(url));
    }

    // 직접 블로그 사이트 검색
    if (config.sources.directBlogs) {
      const blogUrls = await this.searchDirectBlogs(keyword);
      blogUrls.forEach(url => urls.add(url));
    }

    // 기술 사이트 검색
    if (config.sources.techSites) {
      const techUrls = await this.searchTechSites(keyword);
      techUrls.forEach(url => urls.add(url));
    }

    // 블랙리스트 도메인 필터링
    const filteredUrls = Array.from(urls).filter(url => {
      try {
        const domain = new URL(url).hostname;
        return !config.filters.blacklistDomains.some(blacklistDomain => 
          domain.includes(blacklistDomain)
        );
      } catch {
        return false; // 유효하지 않은 URL 제외
      }
    });

    // 최대 URL 수 제한
    const limitedUrls = filteredUrls.slice(0, config.maxUrlsPerKeyword);

    await this.logger.info(`키워드 "${keyword}" URL 검색 완료`, {
      found: urls.size,
      filtered: filteredUrls.length,
      selected: limitedUrls.length
    });

    return limitedUrls;
  }

  /**
   * Google 검색 시뮬레이션
   */
  async simulateGoogleSearch(keyword) {
    // 실제 환경에서는 Google Custom Search API 또는 SerpAPI 사용
    // 현재는 시뮬레이션된 결과 반환
    
    const simulatedUrls = [
      `https://medium.com/search?q=${encodeURIComponent(keyword)}`,
      `https://dev.to/search?q=${encodeURIComponent(keyword)}`,
      `https://stackoverflow.com/questions/tagged/${keyword.toLowerCase().replace(/\s+/g, '-')}`,
      `https://github.com/topics/${keyword.toLowerCase().replace(/\s+/g, '-')}`
    ];

    // 키워드별 특화 URL 추가
    const keywordSpecificUrls = this.getKeywordSpecificUrls(keyword);
    
    return [...simulatedUrls, ...keywordSpecificUrls].slice(0, 3);
  }

  /**
   * 키워드별 특화 URL 반환
   */
  getKeywordSpecificUrls(keyword) {
    const keywordLower = keyword.toLowerCase();
    const specificUrls = {
      'javascript': [
        'https://javascript.info',
        'https://developer.mozilla.org/en-US/docs/Web/JavaScript'
      ],
      'react': [
        'https://reactjs.org/blog',
        'https://react-redux.js.org'
      ],
      'ai': [
        'https://openai.com/blog',
        'https://ai.googleblog.com'
      ],
      '인공지능': [
        'https://www.kakaobrain.com/blog',
        'https://engineering.linecorp.com/ko/blog'
      ]
    };

    return specificUrls[keywordLower] || [];
  }

  /**
   * 직접 블로그 사이트 검색
   */
  async searchDirectBlogs(keyword) {
    const urls = [];
    
    // Medium 검색
    urls.push(`https://medium.com/search?q=${encodeURIComponent(keyword)}`);
    
    // Dev.to 검색
    urls.push(`https://dev.to/search?q=${encodeURIComponent(keyword)}`);
    
    // Velog 검색 (한국어 키워드인 경우)
    if (/[가-힣]/.test(keyword)) {
      urls.push(`https://velog.io/search?q=${encodeURIComponent(keyword)}`);
    }

    return urls;
  }

  /**
   * 기술 사이트 검색
   */
  async searchTechSites(keyword) {
    const keywordLower = keyword.toLowerCase();
    const urls = [];

    // 기술별 특화 사이트
    if (keywordLower.includes('javascript') || keywordLower.includes('js')) {
      urls.push('https://javascript.info', 'https://v8.dev');
    }
    
    if (keywordLower.includes('css')) {
      urls.push('https://css-tricks.com', 'https://developer.mozilla.org/en-US/docs/Web/CSS');
    }
    
    if (keywordLower.includes('ai') || keywordLower.includes('인공지능')) {
      urls.push('https://openai.com/blog', 'https://deepmind.com/blog');
    }

    return urls;
  }

  /**
   * 메인 실행 함수
   */
  async execute() {
    const startTime = Date.now();

    try {
      await this.logger.info('콘텐츠 크롤링 작업 시작');

      // 1. 설정 로드
      const config = await this.loadConfig();

      // 2. 키워드 데이터 로드
      const keywords = await this.loadKeywords();
      const topKeywords = keywords.slice(0, 5); // 상위 5개 키워드만 처리

      // 3. 키워드별 URL 수집
      const allUrls = [];
      const keywordUrlMap = {};

      for (const keywordData of topKeywords) {
        const keyword = keywordData.keyword;
        const urls = await this.searchUrlsForKeyword(keyword, config);
        keywordUrlMap[keyword] = urls;
        allUrls.push(...urls.map(url => ({ url, keyword })));
        
        // 키워드 간 간격
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await this.logger.info('URL 수집 완료', {
        totalUrls: allUrls.length,
        keywordCount: topKeywords.length
      });

      // 4. 웹 크롤링 실행
      const crawlPromises = allUrls.map(({ url, keyword }) => 
        this.webCrawler.crawlPage(url, keyword).catch(error => {
          this.logger.warning(`크롤링 실패: ${url}`, { error: error.message });
          return null;
        })
      );

      const crawlResults = (await Promise.allSettled(crawlPromises))
        .map(result => result.status === 'fulfilled' ? result.value : null)
        .filter(result => result !== null);

      await this.logger.info('웹 크롤링 완료', {
        attempted: allUrls.length,
        successful: crawlResults.length,
        failed: allUrls.length - crawlResults.length
      });

      // 5. 콘텐츠 처리 및 품질 평가
      const processedData = await this.contentProcessor.processResults(
        crawlResults, 
        topKeywords.map(k => k.keyword).join(', ')
      );

      // 6. 결과 저장
      const finalResult = {
        date: DateUtils.getToday(),
        timestamp: DateUtils.getNow(),
        executionTimeMs: Date.now() - startTime,
        keywords: topKeywords,
        urlSources: keywordUrlMap,
        crawlResults: {
          total: allUrls.length,
          successful: crawlResults.length,
          processed: processedData.processed.length
        },
        processedContent: processedData.processed,
        summary: processedData.summary,
        processingDetails: this.contentProcessor.generateProcessingSummary(processedData),
        config: {
          maxUrlsPerKeyword: config.maxUrlsPerKeyword,
          minQualityScore: config.minQualityScore,
          sources: config.sources
        },
        metadata: {
          generatedBy: 'crawl-content.js',
          version: '2.0.0',
          crawlerConfig: this.webCrawler.config
        }
      };

      await FileUtils.writeJson(this.outputPath, finalResult);

      // 7. 브라우저 정리
      await this.webCrawler.closeBrowser();

      await this.logger.success('콘텐츠 크롤링 작업 완료', {
        executionTimeMs: finalResult.executionTimeMs,
        processedContent: finalResult.processedContent.length,
        avgQuality: finalResult.summary.avgQuality,
        outputFile: this.outputPath
      });

      return finalResult;

    } catch (error) {
      // 브라우저 정리
      await this.webCrawler.closeBrowser();
      
      await this.logger.error('콘텐츠 크롤링 작업 실패', {
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
  const crawler = new ContentCrawler();
  crawler.execute()
    .then(result => {
      console.log('✅ 콘텐츠 크롤링 완료:', {
        processed: result.processedContent.length,
        avgQuality: result.summary.avgQuality,
        time: `${result.executionTimeMs}ms`
      });
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 콘텐츠 크롤링 실패:', error.message);
      process.exit(1);
    });
}

module.exports = ContentCrawler;
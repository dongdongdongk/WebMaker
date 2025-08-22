/**
 * web-crawler.js
 * Puppeteer 기반 웹 크롤링 모듈
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { URL } = require('url');

// Stealth plugin 추가 (봇 탐지 회피)
puppeteer.use(StealthPlugin());

class WebCrawler {
  constructor(logger, rateLimiter) {
    this.logger = logger;
    this.rateLimiter = rateLimiter;
    this.browser = null;
    this.page = null;
    
    // 크롤링 설정
    this.config = {
      headless: true,
      timeout: 30000,
      waitForSelector: 3000,
      maxConcurrent: 3,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
    
    // 품질 점수 기준
    this.qualityThresholds = {
      minWordCount: 100,
      minSentences: 5,
      maxAdvertisements: 3,
      minReadability: 0.3
    };
  }

  /**
   * 브라우저 초기화
   */
  async initBrowser() {
    if (this.browser) return;
    
    await this.logger.info('Puppeteer 브라우저 시작 중');
    
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    this.page = await this.browser.newPage();
    await this.page.setUserAgent(this.config.userAgent);
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // 불필요한 리소스 차단 (성능 향상)
    await this.page.setRequestInterception(true);
    this.page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    await this.logger.info('Puppeteer 브라우저 초기화 완료');
  }

  /**
   * 브라우저 종료
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      await this.logger.info('Puppeteer 브라우저 종료');
    }
  }

  /**
   * 웹페이지 크롤링
   */
  async crawlPage(url, keyword = '') {
    await this.logger.info(`웹페이지 크롤링 시작`, { url, keyword });
    
    try {
      if (!this.browser) await this.initBrowser();
      
      // 페이지 로드
      const response = await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout
      });
      
      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
      }
      
      // 페이지 로딩 대기
      await this.page.waitForTimeout(this.config.waitForSelector);
      
      // 콘텐츠 추출
      const content = await this.extractContent();
      
      // 메타데이터 추출
      const metadata = await this.extractMetadata();
      
      // 이미지 추출
      const images = await this.extractImages();
      
      // 품질 평가
      const quality = this.evaluateContentQuality(content, keyword);
      
      const result = {
        url,
        keyword,
        title: content.title || metadata.title || 'Unknown Title',
        content: content.text,
        summary: this.generateSummary(content.text),
        images,
        metadata,
        quality,
        crawledAt: new Date().toISOString(),
        wordCount: content.text.split(/\s+/).length,
        readingTime: Math.ceil(content.text.split(/\s+/).length / 200) // 분당 200단어
      };
      
      await this.logger.info(`웹페이지 크롤링 완료`, {
        url,
        wordCount: result.wordCount,
        qualityScore: quality.score,
        readingTime: result.readingTime
      });
      
      return result;
      
    } catch (error) {
      await this.logger.error(`웹페이지 크롤링 실패: ${url}`, { error: error.message });
      return null;
    }
  }

  /**
   * 메인 콘텐츠 추출
   */
  async extractContent() {
    const content = await this.page.evaluate(() => {
      // 메인 콘텐츠 선택자들 (우선순위 순)
      const contentSelectors = [
        'article',
        '[role="main"]',
        '.content',
        '.post-content',
        '.entry-content',
        '.article-content',
        'main',
        '#content',
        '.main-content'
      ];
      
      let mainContent = null;
      
      // 가장 적절한 콘텐츠 영역 찾기
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim().length > 200) {
          mainContent = element;
          break;
        }
      }
      
      // 폴백: body에서 직접 추출
      if (!mainContent) {
        mainContent = document.body;
      }
      
      // 불필요한 요소 제거
      const unwantedSelectors = [
        'script', 'style', 'nav', 'header', 'footer',
        '.advertisement', '.ad', '.sidebar', '.related',
        '.comments', '.social-share', '.newsletter'
      ];
      
      const cleanContent = mainContent.cloneNode(true);
      unwantedSelectors.forEach(selector => {
        const elements = cleanContent.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });
      
      return {
        title: document.title || document.querySelector('h1')?.textContent || '',
        text: cleanContent.textContent.trim(),
        html: cleanContent.innerHTML
      };
    });
    
    return content;
  }

  /**
   * 메타데이터 추출
   */
  async extractMetadata() {
    const metadata = await this.page.evaluate(() => {
      const getMetaContent = (name) => {
        const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return meta ? meta.getAttribute('content') : '';
      };
      
      return {
        title: document.title,
        description: getMetaContent('description') || getMetaContent('og:description'),
        keywords: getMetaContent('keywords'),
        author: getMetaContent('author') || getMetaContent('article:author'),
        publishDate: getMetaContent('article:published_time') || getMetaContent('datePublished'),
        modifiedDate: getMetaContent('article:modified_time') || getMetaContent('dateModified'),
        canonical: document.querySelector('link[rel="canonical"]')?.href || '',
        language: document.documentElement.lang || 'ko',
        siteName: getMetaContent('og:site_name'),
        type: getMetaContent('og:type') || 'article'
      };
    });
    
    return metadata;
  }

  /**
   * 이미지 추출
   */
  async extractImages() {
    const images = await this.page.evaluate(() => {
      const imageElements = document.querySelectorAll('img');
      const imageData = [];
      
      imageElements.forEach((img, index) => {
        if (index >= 10) return; // 최대 10개만
        
        const src = img.src || img.getAttribute('data-src');
        if (src && src.startsWith('http')) {
          imageData.push({
            src,
            alt: img.alt || '',
            title: img.title || '',
            width: img.naturalWidth || 0,
            height: img.naturalHeight || 0
          });
        }
      });
      
      return imageData;
    });
    
    return images.filter(img => img.width >= 200 && img.height >= 200); // 최소 크기 필터
  }

  /**
   * 콘텐츠 품질 평가
   */
  evaluateContentQuality(content, keyword = '') {
    const text = content.text || '';
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let score = 0;
    const factors = {};
    
    // 1. 단어 수 점수 (0-30점)
    const wordCount = words.length;
    if (wordCount >= 500) factors.wordCount = 30;
    else if (wordCount >= 300) factors.wordCount = 20;
    else if (wordCount >= this.qualityThresholds.minWordCount) factors.wordCount = 10;
    else factors.wordCount = 0;
    
    // 2. 문장 구조 점수 (0-20점)
    const sentenceCount = sentences.length;
    if (sentenceCount >= 20) factors.structure = 20;
    else if (sentenceCount >= 10) factors.structure = 15;
    else if (sentenceCount >= this.qualityThresholds.minSentences) factors.structure = 10;
    else factors.structure = 0;
    
    // 3. 키워드 관련성 점수 (0-25점)
    if (keyword) {
      const keywordRegex = new RegExp(keyword, 'gi');
      const matches = text.match(keywordRegex) || [];
      const density = matches.length / words.length;
      
      if (density >= 0.02 && density <= 0.05) factors.keyword = 25; // 적절한 밀도
      else if (density >= 0.01) factors.keyword = 15;
      else if (matches.length > 0) factors.keyword = 5;
      else factors.keyword = 0;
    } else {
      factors.keyword = 15; // 키워드 없으면 기본 점수
    }
    
    // 4. 가독성 점수 (0-15점)
    const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);
    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) factors.readability = 15;
    else if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 30) factors.readability = 10;
    else factors.readability = 5;
    
    // 5. 콘텐츠 다양성 점수 (0-10점)
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const diversity = uniqueWords.size / Math.max(wordCount, 1);
    factors.diversity = Math.round(diversity * 20); // 0-10점으로 스케일링
    
    // 총점 계산
    score = Object.values(factors).reduce((sum, val) => sum + val, 0);
    
    return {
      score: Math.min(score, 100),
      factors,
      wordCount,
      sentenceCount,
      avgWordsPerSentence: Math.round(avgWordsPerSentence),
      keywordDensity: keyword ? ((text.match(new RegExp(keyword, 'gi')) || []).length / wordCount * 100).toFixed(2) + '%' : 'N/A',
      recommendation: this.getQualityRecommendation(score)
    };
  }

  /**
   * 품질 점수 기반 추천사항
   */
  getQualityRecommendation(score) {
    if (score >= 80) return 'Excellent - 우수한 품질의 콘텐츠';
    if (score >= 60) return 'Good - 양호한 품질, 약간의 개선 가능';
    if (score >= 40) return 'Fair - 보통 품질, 추가 콘텐츠 필요';
    if (score >= 20) return 'Poor - 낮은 품질, 많은 개선 필요';
    return 'Very Poor - 사용 불가능한 품질';
  }

  /**
   * 텍스트 요약 생성 (간단한 추출식 요약)
   */
  generateSummary(text, maxSentences = 3) {
    if (!text) return '';
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length <= maxSentences) return text;
    
    // 문장 길이와 위치를 고려한 중요도 점수
    const scoredSentences = sentences.map((sentence, index) => {
      const words = sentence.trim().split(/\s+/);
      let score = 0;
      
      // 길이 점수 (10-30단어가 적절)
      if (words.length >= 10 && words.length <= 30) score += 2;
      else if (words.length >= 5) score += 1;
      
      // 위치 점수 (첫 문장과 마지막 문장 중요)
      if (index === 0) score += 3;
      else if (index === sentences.length - 1) score += 1;
      else if (index < sentences.length * 0.3) score += 2; // 첫 30%
      
      return { sentence: sentence.trim(), score, index };
    });
    
    // 상위 문장들 선택 후 원래 순서로 정렬
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .sort((a, b) => a.index - b.index);
    
    return topSentences.map(item => item.sentence).join('. ') + '.';
  }

  /**
   * 여러 URL 동시 크롤링
   */
  async crawlMultipleUrls(urls, keyword = '') {
    await this.logger.info(`${urls.length}개 URL 병렬 크롤링 시작`);
    
    const results = [];
    const chunks = this.chunkArray(urls, this.config.maxConcurrent);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(url => this.crawlPage(url, keyword));
      const chunkResults = await Promise.allSettled(chunkPromises);
      
      for (const result of chunkResults) {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      }
      
      // 청크 간 대기
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    await this.logger.info(`병렬 크롤링 완료`, {
      total: urls.length,
      successful: results.length,
      failed: urls.length - results.length
    });
    
    return results;
  }

  /**
   * 배열을 청크로 나누기
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * URL 유효성 검사
   */
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * 사이트별 크롤링 전략 반환
   */
  getSiteStrategy(url) {
    const domain = new URL(url).hostname.toLowerCase();
    
    const strategies = {
      'medium.com': {
        contentSelector: 'article',
        titleSelector: 'h1',
        waitTime: 5000
      },
      'blog.naver.com': {
        contentSelector: '.se-main-container',
        titleSelector: '.se-title-text',
        waitTime: 3000
      },
      'tistory.com': {
        contentSelector: '.entry-content',
        titleSelector: '.entry-title',
        waitTime: 2000
      },
      'default': {
        contentSelector: 'article',
        titleSelector: 'h1',
        waitTime: 3000
      }
    };
    
    for (const [siteDomain, strategy] of Object.entries(strategies)) {
      if (domain.includes(siteDomain)) {
        return strategy;
      }
    }
    
    return strategies.default;
  }
}

module.exports = WebCrawler;
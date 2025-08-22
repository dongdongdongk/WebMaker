/**
 * collect-keywords.js
 * Google Trends API와 News API를 활용하여 인기 키워드를 수집합니다.
 * 실행 시간: 약 3분
 */

const Logger = require('./utils/logger');
const FileUtils = require('./utils/file-utils');
const DateUtils = require('./utils/date-utils');
const StringUtils = require('./utils/string-utils');
const path = require('path');

// API 라이브러리
const googleTrends = require('google-trends-api');
const axios = require('axios');
const Parser = require('rss-parser');

// 사이트 설정 로드
const siteConfig = require('../config/site.config.js');

class KeywordCollector {
  constructor() {
    this.logger = new Logger('collect-keywords');
    this.outputPath = path.join(__dirname, '../config/keywords-today.json');
    this.configPath = path.join(__dirname, '../config/keyword-config.json');
    
    // 사이트 설정에서 카테고리 가져오기
    this.categories = siteConfig.apis.keywords.categories;
    this.regions = siteConfig.apis.keywords.regions;
    
    // RSS 파서 초기화
    this.rssParser = new Parser({
      customFields: {
        item: ['pubDate', 'description']
      }
    });
    
    // API 레이트 리미팅
    this.rateLimits = {
      googleTrends: { calls: 0, maxCalls: 100, resetTime: Date.now() + 3600000 }, // 1시간당 100회
      newsApi: { calls: 0, maxCalls: 500, resetTime: Date.now() + 86400000 }, // 1일당 500회
      reddit: { calls: 0, maxCalls: 60, resetTime: Date.now() + 60000 } // 1분당 60회
    };
  }

  /**
   * 키워드 수집 설정 로드
   */
  async loadConfig() {
    try {
      const config = await FileUtils.readJson(this.configPath);
      if (config) {
        await this.logger.info('키워드 설정 파일 로드 완료', { configFile: this.configPath });
        return config;
      }
    } catch (error) {
      await this.logger.warning('설정 파일 로드 실패, 기본 설정 사용', { error: error.message });
    }

    // 기본 설정 생성
    const defaultConfig = {
      categories: this.defaultCategories,
      maxKeywordsPerCategory: 10,
      trendingPeriod: '7d', // 7일간의 트렌드
      regions: ['KR', 'US'],
      lastUpdated: DateUtils.getNow()
    };

    await FileUtils.writeJson(this.configPath, defaultConfig);
    await this.logger.info('기본 키워드 설정 생성 완료');
    return defaultConfig;
  }

  /**
   * API 레이트 리미트 확인
   */
  async checkRateLimit(apiName) {
    const limit = this.rateLimits[apiName];
    if (!limit) return true;
    
    if (Date.now() > limit.resetTime) {
      limit.calls = 0;
      limit.resetTime = Date.now() + (apiName === 'newsApi' ? 86400000 : 3600000);
    }
    
    if (limit.calls >= limit.maxCalls) {
      await this.logger.warning(`${apiName} API 레이트 리미트 도달`, { 
        calls: limit.calls, 
        maxCalls: limit.maxCalls 
      });
      return false;
    }
    
    limit.calls++;
    return true;
  }

  /**
   * Google Trends API 실제 통합
   */
  async fetchTrendingKeywords(category, keywords) {
    await this.logger.info(`${category} 카테고리 Google Trends 조회 중`, { keywords: keywords.slice(0, 3) });
    
    if (!await this.checkRateLimit('googleTrends')) {
      return this.getFallbackKeywords(category, keywords);
    }

    try {
      // Google Trends 일일 트렌드 조회
      const trendsData = await googleTrends.dailyTrends({
        trendDate: new Date(),
        geo: this.regions[0] // 기본적으로 첫 번째 지역 사용
      });

      const trends = JSON.parse(trendsData);
      const trendingKeywords = [];

      // 트렌드 데이터에서 키워드 추출
      if (trends.default && trends.default.trendingSearchesDays) {
        const todayTrends = trends.default.trendingSearchesDays[0];
        if (todayTrends && todayTrends.trendingSearches) {
          for (const trend of todayTrends.trendingSearches.slice(0, 10)) {
            if (trend.title && trend.title.query) {
              trendingKeywords.push({
                keyword: trend.title.query,
                score: parseInt(trend.formattedTraffic?.replace(/[,+]/g, '') || '50'),
                growth: Math.floor(Math.random() * 20) - 10,
                category,
                source: 'google-trends',
                articles: trend.articles?.length || 0
              });
            }
          }
        }
      }

      // 기본 키워드들도 포함 (관련성 검증)
      for (const keyword of keywords.slice(0, 5)) {
        try {
          const interestData = await googleTrends.interestOverTime({
            keyword,
            startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7일 전
            endTime: new Date(),
            geo: this.regions[0]
          });

          const interest = JSON.parse(interestData);
          if (interest.default && interest.default.timelineData) {
            const latestData = interest.default.timelineData.slice(-1)[0];
            if (latestData && latestData.value && latestData.value[0] > 0) {
              trendingKeywords.push({
                keyword,
                score: latestData.value[0],
                growth: this.calculateGrowth(interest.default.timelineData),
                category,
                source: 'google-trends-interest'
              });
            }
          }

          // API 호출 간격
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          await this.logger.warning(`키워드 "${keyword}" 관심도 조회 실패`, { error: error.message });
        }
      }

      await this.logger.info(`${category} 카테고리에서 ${trendingKeywords.length}개 키워드 수집`);
      return trendingKeywords;

    } catch (error) {
      await this.logger.error('Google Trends API 호출 실패', { error: error.message });
      return this.getFallbackKeywords(category, keywords);
    }
  }

  /**
   * Google Trends 성장률 계산
   */
  calculateGrowth(timelineData) {
    if (!timelineData || timelineData.length < 2) return 0;
    
    const recent = timelineData.slice(-3).map(d => d.value[0]).reduce((a, b) => a + b, 0) / 3;
    const older = timelineData.slice(0, 3).map(d => d.value[0]).reduce((a, b) => a + b, 0) / 3;
    
    return older > 0 ? Math.round(((recent - older) / older) * 100) : 0;
  }

  /**
   * 폴백 키워드 (API 실패 시)
   */
  getFallbackKeywords(category, keywords) {
    return keywords.map((keyword, index) => ({
      keyword,
      score: Math.floor(Math.random() * 50) + 50,
      growth: Math.floor(Math.random() * 20) - 10,
      category,
      source: 'fallback'
    }));
  }

  /**
   * Google News RSS 피드 통합
   */
  async fetchGoogleNewsKeywords() {
    await this.logger.info('Google News RSS 피드 조회 중');
    
    try {
      const newsKeywords = [];
      const categories = ['technology', 'science', 'business'];
      
      for (const category of categories) {
        const rssUrl = `https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko`;
        
        try {
          const feed = await this.rssParser.parseURL(rssUrl);
          
          for (const item of feed.items.slice(0, 10)) {
            const keywords = this.extractKeywordsFromText(item.title + ' ' + (item.contentSnippet || ''));
            
            for (const keyword of keywords.slice(0, 3)) {
              newsKeywords.push({
                keyword,
                score: Math.floor(Math.random() * 30) + 40, // 40-70 점수
                growth: Math.floor(Math.random() * 20) - 10,
                category: `news-${category}`,
                source: 'google-news-rss',
                publishedDate: item.pubDate,
                link: item.link
              });
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000)); // RSS 요청 간격
        } catch (error) {
          await this.logger.warning(`Google News RSS (${category}) 조회 실패`, { error: error.message });
        }
      }
      
      await this.logger.info(`Google News RSS에서 ${newsKeywords.length}개 키워드 수집`);
      return newsKeywords;
      
    } catch (error) {
      await this.logger.error('Google News RSS 전체 조회 실패', { error: error.message });
      return [];
    }
  }

  /**
   * NewsAPI.org 통합
   */
  async fetchNewsAPIKeywords() {
    await this.logger.info('NewsAPI.org 조회 중');
    
    if (!await this.checkRateLimit('newsApi')) {
      return [];
    }

    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      await this.logger.warning('NEWS_API_KEY 환경변수가 설정되지 않음');
      return [];
    }

    try {
      const newsKeywords = [];
      const categories = ['technology', 'business', 'science'];
      
      for (const category of categories) {
        const url = `https://newsapi.org/v2/top-headlines?category=${category}&country=kr&apiKey=${apiKey}`;
        
        try {
          const response = await axios.get(url);
          const articles = response.data.articles || [];
          
          for (const article of articles.slice(0, 10)) {
            const keywords = this.extractKeywordsFromText(article.title + ' ' + (article.description || ''));
            
            for (const keyword of keywords.slice(0, 2)) {
              newsKeywords.push({
                keyword,
                score: Math.floor(Math.random() * 40) + 30, // 30-70 점수
                growth: Math.floor(Math.random() * 20) - 10,
                category: `newsapi-${category}`,
                source: 'newsapi-org',
                publishedAt: article.publishedAt,
                sourceName: article.source?.name
              });
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000)); // API 요청 간격
        } catch (error) {
          await this.logger.warning(`NewsAPI (${category}) 조회 실패`, { error: error.message });
        }
      }
      
      await this.logger.info(`NewsAPI.org에서 ${newsKeywords.length}개 키워드 수집`);
      return newsKeywords;
      
    } catch (error) {
      await this.logger.error('NewsAPI.org 전체 조회 실패', { error: error.message });
      return [];
    }
  }

  /**
   * GNews API 통합 (백업 뉴스 소스)
   */
  async fetchGNewsKeywords() {
    await this.logger.info('GNews API 조회 중');
    
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) {
      await this.logger.warning('GNEWS_API_KEY 환경변수가 설정되지 않음');
      return [];
    }

    try {
      const newsKeywords = [];
      const queries = ['기술', '인공지능', '스타트업', '프로그래밍'];
      
      for (const query of queries) {
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=ko&country=kr&max=10&apikey=${apiKey}`;
        
        try {
          const response = await axios.get(url);
          const articles = response.data.articles || [];
          
          for (const article of articles) {
            const keywords = this.extractKeywordsFromText(article.title + ' ' + (article.description || ''));
            
            for (const keyword of keywords.slice(0, 2)) {
              newsKeywords.push({
                keyword,
                score: Math.floor(Math.random() * 35) + 25, // 25-60 점수
                growth: Math.floor(Math.random() * 20) - 10,
                category: `gnews-${query}`,
                source: 'gnews-api',
                publishedAt: article.publishedAt,
                sourceName: article.source?.name
              });
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000)); // GNews API 요청 간격
        } catch (error) {
          await this.logger.warning(`GNews (${query}) 조회 실패`, { error: error.message });
        }
      }
      
      await this.logger.info(`GNews API에서 ${newsKeywords.length}개 키워드 수집`);
      return newsKeywords;
      
    } catch (error) {
      await this.logger.error('GNews API 전체 조회 실패', { error: error.message });
      return [];
    }
  }

  /**
   * 텍스트에서 키워드 추출
   */
  extractKeywordsFromText(text) {
    if (!text) return [];
    
    // 한국어와 영어 키워드 추출 정규식
    const koreanWords = text.match(/[가-힣]{2,}/g) || [];
    const englishWords = text.match(/[A-Za-z]{3,}/g) || [];
    
    // 불용어 제거
    const stopWords = ['그리고', '하지만', '그러나', '또한', '이를', '이와', 'and', 'the', 'for', 'with'];
    const keywords = [...koreanWords, ...englishWords]
      .filter(word => !stopWords.includes(word.toLowerCase()))
      .filter(word => word.length >= 2)
      .slice(0, 5);
    
    return [...new Set(keywords)]; // 중복 제거
  }

  /**
   * 키워드 점수 계산 및 순위 매기기
   */
  calculateKeywordScores(keywords) {
    return keywords
      .map(item => ({
        ...item,
        finalScore: item.score + (item.growth || 0) * 0.3,
        timestamp: DateUtils.getNow()
      }))
      .sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * 키워드 필터링 및 정제
   */
  filterKeywords(keywords, maxCount = 50) {
    const filtered = keywords
      .filter(item => item.finalScore > 20) // 최소 점수 필터
      .filter(item => StringUtils.normalizeKeywords([item.keyword]).length > 0)
      .slice(0, maxCount);

    return StringUtils.normalizeKeywords(filtered.map(item => item.keyword))
      .map(keyword => {
        const original = filtered.find(item => 
          StringUtils.normalizeKeywords([item.keyword])[0] === keyword
        );
        return {
          keyword,
          score: original?.finalScore || 0,
          category: original?.category || 'general',
          source: original?.source || 'unknown'
        };
      });
  }

  /**
   * 메인 실행 함수
   */
  async execute() {
    try {
      await this.logger.info('키워드 수집 작업 시작');
      
      // 1. 설정 로드
      const config = await this.loadConfig();
      
      // 2. 각 카테고리별 키워드 수집
      let allKeywords = [];
      
      for (const [category, keywords] of Object.entries(config.categories)) {
        const trendingKeywords = await this.fetchTrendingKeywords(category, keywords);
        allKeywords = allKeywords.concat(trendingKeywords);
        
        // API 호출 간격 (rate limit 방지)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 3. 뉴스 키워드 수집
      const newsKeywords = await this.fetchNewsKeywords();
      allKeywords = allKeywords.concat(newsKeywords);

      // 4. 키워드 점수 계산 및 정렬
      const scoredKeywords = this.calculateKeywordScores(allKeywords);
      
      // 5. 상위 키워드 필터링
      const topKeywords = this.filterKeywords(scoredKeywords, 30);

      // 6. 결과 저장
      const result = {
        date: DateUtils.getToday(),
        timestamp: DateUtils.getNow(),
        totalCollected: allKeywords.length,
        finalKeywords: topKeywords,
        categories: Object.keys(config.categories),
        metadata: {
          generatedBy: 'collect-keywords.js',
          version: '1.0.0',
          executionTime: Date.now()
        }
      };

      await FileUtils.writeJson(this.outputPath, result);
      
      await this.logger.success('키워드 수집 완료', {
        total: allKeywords.length,
        selected: topKeywords.length,
        outputFile: this.outputPath
      });

      return result;

    } catch (error) {
      await this.logger.error('키워드 수집 실패', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }
}

// 직접 실행시
if (require.main === module) {
  const collector = new KeywordCollector();
  collector.execute()
    .then(result => {
      console.log('키워드 수집 성공:', result.finalKeywords.length, '개');
      process.exit(0);
    })
    .catch(error => {
      console.error('키워드 수집 실패:', error.message);
      process.exit(1);
    });
}

module.exports = KeywordCollector;
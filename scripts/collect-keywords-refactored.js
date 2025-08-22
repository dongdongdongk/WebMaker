/**
 * collect-keywords.js (Refactored)
 * 모듈화된 API를 사용하여 키워드를 수집합니다.
 * 실행 시간: 약 3분
 */

// 환경변수 로드
require('dotenv').config();

const Logger = require('./utils/logger');
const FileUtils = require('./utils/file-utils');
const DateUtils = require('./utils/date-utils');
const StringUtils = require('./utils/string-utils');
const path = require('path');

// 모듈화된 API 클래스들
const GoogleTrendsAPI = require('./apis/google-trends');
const NewsFeedsAPI = require('./apis/news-feeds');
const RedditAPI = require('./apis/reddit');
const RateLimiter = require('./apis/rate-limiter');

// 사이트 설정 로드
const siteConfig = require('../config/site.config.js');

class KeywordCollector {
  constructor() {
    this.logger = new Logger('collect-keywords');
    this.outputPath = path.join(__dirname, '../config/keywords-today.json');
    this.configPath = path.join(__dirname, '../config/keyword-config.json');
    
    // 레이트 리미터 초기화
    this.rateLimiter = new RateLimiter(this.logger);
    
    // API 모듈들 초기화
    this.googleTrends = new GoogleTrendsAPI(this.logger, this.rateLimiter);
    this.newsFeeds = new NewsFeedsAPI(this.logger, this.rateLimiter);
    this.reddit = new RedditAPI(this.logger, this.rateLimiter);
    
    // 사이트 설정에서 카테고리 가져오기
    this.categories = siteConfig.apis.keywords.categories;
    this.regions = siteConfig.apis.keywords.regions;
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

    // 기본 설정 생성 (사이트 설정 기반)
    const defaultConfig = {
      categories: this.categories.reduce((acc, category) => {
        acc[category] = this.getDefaultKeywordsForCategory(category);
        return acc;
      }, {}),
      maxKeywordsPerCategory: 10,
      trendingPeriod: '7d',
      regions: this.regions,
      sources: {
        googleTrends: true,
        googleNews: true,
        newsApi: true,
        gnews: true,
        reddit: true
      },
      lastUpdated: DateUtils.getNow()
    };

    await FileUtils.writeJson(this.configPath, defaultConfig);
    await this.logger.info('기본 키워드 설정 생성 완료');
    return defaultConfig;
  }

  /**
   * 카테고리별 기본 키워드 반환
   */
  getDefaultKeywordsForCategory(category) {
    const keywordMap = {
      'technology': ['AI', '인공지능', '머신러닝', '블록체인', '클라우드', 'IoT', '사이버보안'],
      'webdev': ['JavaScript', 'React', 'Next.js', 'Vue.js', 'TypeScript', 'Node.js', 'Python'],
      'mobile': ['React Native', 'Flutter', 'iOS', 'Android', '모바일앱', 'Swift', 'Kotlin'],
      'design': ['UI/UX', '웹디자인', '사용자경험', '디자인시스템', 'Figma', 'Adobe'],
      'business': ['스타트업', '디지털마케팅', '이커머스', '원격근무', '투자', '경영'],
      'trends': ['2025트렌드', '기술동향', '산업전망', '미래기술', '혁신', '디지털전환']
    };
    
    return keywordMap[category] || ['일반', '키워드', '기본'];
  }

  /**
   * Google Trends에서 키워드 수집
   */
  async collectFromGoogleTrends(config) {
    await this.logger.info('Google Trends에서 키워드 수집 시작');
    
    try {
      const allKeywords = [];
      
      // 일일 트렌딩 키워드 수집
      for (const region of this.regions) {
        try {
          const trendingKeywords = await this.googleTrends.getDailyTrends(region);
          
          for (const trend of trendingKeywords) {
            allKeywords.push({
              ...trend,
              category: 'trending',
              region
            });
          }
          
          await this.rateLimiter.smartDelay('googleTrends');
        } catch (error) {
          await this.logger.warning(`Google Trends (${region}) 조회 실패`, { error: error.message });
        }
      }
      
      // 설정된 키워드들의 관심도 조회
      for (const [category, keywords] of Object.entries(config.categories)) {
        for (const keyword of keywords.slice(0, 5)) { // 카테고리당 최대 5개
          try {
            const interestData = await this.googleTrends.getInterestOverTime(keyword, this.regions[0]);
            
            if (interestData) {
              allKeywords.push({
                keyword,
                score: interestData.score,
                growth: interestData.growth,
                category,
                source: interestData.source,
                region: this.regions[0]
              });
            }
            
            await this.rateLimiter.smartDelay('googleTrends');
          } catch (error) {
            await this.logger.warning(`키워드 "${keyword}" 관심도 조회 실패`, { error: error.message });
          }
        }
      }
      
      await this.logger.info(`Google Trends에서 ${allKeywords.length}개 키워드 수집 완료`);
      return allKeywords;
      
    } catch (error) {
      await this.logger.error('Google Trends 키워드 수집 실패', { error: error.message });
      return [];
    }
  }

  /**
   * 뉴스 소스에서 키워드 수집
   */
  async collectFromNewsSources(config) {
    await this.logger.info('뉴스 소스에서 키워드 수집 시작');
    
    const allNewsKeywords = [];
    
    // Google News RSS
    if (config.sources.googleNews) {
      try {
        const googleNewsKeywords = await this.newsFeeds.getGoogleNewsKeywords();
        allNewsKeywords.push(...googleNewsKeywords);
      } catch (error) {
        await this.logger.warning('Google News RSS 수집 실패', { error: error.message });
      }
    }
    
    // NewsAPI.org
    if (config.sources.newsApi) {
      try {
        const newsApiKeywords = await this.newsFeeds.getNewsAPIKeywords();
        allNewsKeywords.push(...newsApiKeywords);
      } catch (error) {
        await this.logger.warning('NewsAPI.org 수집 실패', { error: error.message });
      }
    }
    
    // GNews API
    if (config.sources.gnews) {
      try {
        const gNewsKeywords = await this.newsFeeds.getGNewsKeywords();
        allNewsKeywords.push(...gNewsKeywords);
      } catch (error) {
        await this.logger.warning('GNews API 수집 실패', { error: error.message });
      }
    }
    
    await this.logger.info(`뉴스 소스에서 ${allNewsKeywords.length}개 키워드 수집 완료`);
    return allNewsKeywords;
  }

  /**
   * Reddit에서 키워드 수집
   */
  async collectFromReddit(config) {
    await this.logger.info('Reddit에서 키워드 수집 시작');
    
    if (!config.sources.reddit) {
      await this.logger.info('Reddit 수집이 비활성화됨');
      return [];
    }
    
    try {
      const redditKeywords = await this.reddit.getRedditKeywords();
      await this.logger.info(`Reddit에서 ${redditKeywords.length}개 키워드 수집 완료`);
      return redditKeywords;
    } catch (error) {
      await this.logger.error('Reddit 키워드 수집 실패', { error: error.message });
      return [];
    }
  }

  /**
   * 키워드 점수 계산 및 순위 매기기
   */
  calculateKeywordScores(keywords) {
    return keywords
      .map(item => ({
        ...item,
        finalScore: this.calculateFinalScore(item),
        timestamp: DateUtils.getNow()
      }))
      .sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * 최종 점수 계산
   */
  calculateFinalScore(item) {
    let score = item.score || 50;
    
    // 성장률 보너스
    if (item.growth > 0) {
      score += item.growth * 0.3;
    }
    
    // 소스별 가중치
    const sourceWeights = {
      'google-trends': 1.2,
      'google-trends-interest': 1.0,
      'google-news-rss': 0.8,
      'newsapi-org': 0.9,
      'gnews-api': 0.7,
      'reddit': 0.6,
      'fallback': 0.3
    };
    
    score *= (sourceWeights[item.source] || 1.0);
    
    // 최신성 보너스 (뉴스의 경우)
    if (item.publishedAt || item.publishedDate) {
      const publishedTime = new Date(item.publishedAt || item.publishedDate).getTime();
      const hoursOld = (Date.now() - publishedTime) / (1000 * 60 * 60);
      if (hoursOld < 24) {
        score += (24 - hoursOld) * 0.5; // 24시간 이내 보너스
      }
    }
    
    return Math.round(score);
  }

  /**
   * 키워드 필터링 및 정제
   */
  filterKeywords(keywords, maxCount = 50) {
    const filtered = keywords
      .filter(item => item.finalScore > 20) // 최소 점수 필터
      .filter(item => item.keyword && item.keyword.length >= 2)
      .filter(item => !this.isStopWord(item.keyword));

    // 중복 키워드 제거 (대소문자 무시)
    const uniqueKeywords = [];
    const seenKeywords = new Set();
    
    for (const item of filtered) {
      const normalizedKeyword = item.keyword.toLowerCase().trim();
      if (!seenKeywords.has(normalizedKeyword)) {
        seenKeywords.add(normalizedKeyword);
        uniqueKeywords.push(item);
      }
    }

    return uniqueKeywords.slice(0, maxCount);
  }

  /**
   * 불용어 확인
   */
  isStopWord(keyword) {
    const stopWords = [
      '기자', '뉴스', '보도', '발표', '한국', '서울', '오늘', '어제', '내일',
      'news', 'today', 'yesterday', 'report', 'said', 'says'
    ];
    
    return stopWords.includes(keyword.toLowerCase());
  }

  /**
   * 메인 실행 함수
   */
  async execute() {
    const startTime = Date.now();
    
    try {
      await this.logger.info('키워드 수집 작업 시작');
      
      // 1. 설정 로드
      const config = await this.loadConfig();
      
      // 2. API 상태 확인
      const apiStatus = this.rateLimiter.getAllStatus();
      await this.logger.info('API 레이트 리미트 상태', { status: apiStatus });
      
      // 3. 각 소스에서 키워드 수집
      const [
        trendsKeywords,
        newsKeywords,
        redditKeywords
      ] = await Promise.allSettled([
        this.collectFromGoogleTrends(config),
        this.collectFromNewsSources(config),
        this.collectFromReddit(config)
      ]);

      // 결과 합치기
      let allKeywords = [];
      
      if (trendsKeywords.status === 'fulfilled') {
        allKeywords = allKeywords.concat(trendsKeywords.value);
      }
      if (newsKeywords.status === 'fulfilled') {
        allKeywords = allKeywords.concat(newsKeywords.value);
      }
      if (redditKeywords.status === 'fulfilled') {
        allKeywords = allKeywords.concat(redditKeywords.value);
      }

      // 4. 키워드 점수 계산 및 정렬
      const scoredKeywords = this.calculateKeywordScores(allKeywords);
      
      // 5. 상위 키워드 필터링
      const topKeywords = this.filterKeywords(scoredKeywords, 30);

      // 6. 결과 저장
      const result = {
        date: DateUtils.getToday(),
        timestamp: DateUtils.getNow(),
        executionTimeMs: Date.now() - startTime,
        totalCollected: allKeywords.length,
        finalKeywords: topKeywords,
        categories: Object.keys(config.categories || {}),
        sources: Object.keys(config.sources || {}).filter(key => config.sources[key]),
        apiStatus: this.rateLimiter.getAllStatus(),
        metadata: {
          generatedBy: 'collect-keywords.js',
          version: '2.0.0',
          configPath: this.configPath
        }
      };

      await FileUtils.writeJson(this.outputPath, result);
      
      await this.logger.success('키워드 수집 작업 완료', {
        totalCollected: allKeywords.length,
        finalCount: topKeywords.length,
        executionTimeMs: result.executionTimeMs,
        outputFile: this.outputPath
      });

      return result;

    } catch (error) {
      await this.logger.error('키워드 수집 작업 실패', { 
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
  const collector = new KeywordCollector();
  collector.execute()
    .then(result => {
      console.log('✅ 키워드 수집 완료:', {
        total: result.totalCollected,
        final: result.finalKeywords.length,
        time: `${result.executionTimeMs}ms`
      });
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 키워드 수집 실패:', error.message);
      process.exit(1);
    });
}

module.exports = KeywordCollector;
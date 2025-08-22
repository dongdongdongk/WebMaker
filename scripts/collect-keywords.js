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

class KeywordCollector {
  constructor() {
    this.logger = new Logger('collect-keywords');
    this.outputPath = path.join(__dirname, '../config/keywords-today.json');
    this.configPath = path.join(__dirname, '../config/keyword-config.json');
    
    // 기본 키워드 카테고리
    this.defaultCategories = {
      technology: ['AI', '인공지능', '머신러닝', '블록체인', '클라우드', 'IoT'],
      webdev: ['JavaScript', 'React', 'Next.js', 'Vue.js', 'TypeScript', 'Node.js'],
      mobile: ['React Native', 'Flutter', 'iOS', 'Android', '모바일앱'],
      design: ['UI/UX', '웹디자인', '사용자경험', '디자인시스템'],
      business: ['스타트업', '디지털마케팅', '이커머스', '원격근무'],
      trends: ['2025트렌드', '기술동향', '산업전망', '미래기술']
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
   * Google Trends API 시뮬레이션 (실제 API 연동은 Step 4-6에서)
   */
  async fetchTrendingKeywords(category, keywords) {
    await this.logger.info(`트렌딩 키워드 조회 중: ${category}`);
    
    // TODO: 실제 Google Trends API 연동
    // 현재는 시뮬레이션 데이터 반환
    const simulatedTrends = keywords.map(keyword => ({
      keyword,
      score: Math.floor(Math.random() * 100) + 1,
      growth: (Math.random() - 0.5) * 200, // -100% ~ +100%
      category,
      source: 'google-trends'
    }));

    await this.logger.info(`${category} 카테고리에서 ${simulatedTrends.length}개 키워드 수집`);
    return simulatedTrends;
  }

  /**
   * News API 시뮬레이션
   */
  async fetchNewsKeywords() {
    await this.logger.info('뉴스 키워드 조회 중');
    
    // TODO: 실제 News API 연동
    // 시뮬레이션 데이터
    const newsKeywords = [
      { keyword: 'ChatGPT', score: 95, category: 'ai-news', source: 'news-api' },
      { keyword: '메타버스', score: 78, category: 'tech-news', source: 'news-api' },
      { keyword: '웹3.0', score: 65, category: 'blockchain-news', source: 'news-api' },
      { keyword: '양자컴퓨팅', score: 52, category: 'future-tech', source: 'news-api' }
    ];

    await this.logger.info(`뉴스에서 ${newsKeywords.length}개 키워드 수집`);
    return newsKeywords;
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
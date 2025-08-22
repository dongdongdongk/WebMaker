/**
 * google-trends.js
 * Google Trends API 통합 모듈
 */

const googleTrends = require('google-trends-api');

class GoogleTrendsAPI {
  constructor(logger, rateLimiter) {
    this.logger = logger;
    this.rateLimiter = rateLimiter;
    this.apiName = 'googleTrends';
  }

  /**
   * 일일 트렌딩 키워드 조회
   */
  async getDailyTrends(region = 'KR') {
    if (!await this.rateLimiter.checkLimit(this.apiName)) {
      throw new Error('Rate limit exceeded');
    }

    try {
      const trendsData = await googleTrends.dailyTrends({
        trendDate: new Date(),
        geo: region
      });

      return this.parseTrendsData(JSON.parse(trendsData));
    } catch (error) {
      await this.logger.error('Google Trends dailyTrends API 호출 실패', { error: error.message });
      throw error;
    }
  }

  /**
   * 키워드 관심도 조회
   */
  async getInterestOverTime(keyword, region = 'KR', days = 7) {
    if (!await this.rateLimiter.checkLimit(this.apiName)) {
      return null;
    }

    try {
      const interestData = await googleTrends.interestOverTime({
        keyword,
        startTime: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        endTime: new Date(),
        geo: region
      });

      return this.parseInterestData(JSON.parse(interestData));
    } catch (error) {
      await this.logger.warning(`키워드 "${keyword}" 관심도 조회 실패`, { error: error.message });
      return null;
    }
  }

  /**
   * 트렌드 데이터 파싱
   */
  parseTrendsData(trends) {
    const keywords = [];

    if (trends.default && trends.default.trendingSearchesDays) {
      const todayTrends = trends.default.trendingSearchesDays[0];
      if (todayTrends && todayTrends.trendingSearches) {
        for (const trend of todayTrends.trendingSearches.slice(0, 20)) {
          if (trend.title && trend.title.query) {
            keywords.push({
              keyword: trend.title.query,
              score: parseInt(trend.formattedTraffic?.replace(/[,+]/g, '') || '50'),
              articles: trend.articles?.length || 0,
              source: 'google-trends'
            });
          }
        }
      }
    }

    return keywords;
  }

  /**
   * 관심도 데이터 파싱
   */
  parseInterestData(interest) {
    if (!interest.default || !interest.default.timelineData) {
      return null;
    }

    const timelineData = interest.default.timelineData;
    const latestData = timelineData.slice(-1)[0];
    
    if (!latestData || !latestData.value || latestData.value[0] <= 0) {
      return null;
    }

    return {
      score: latestData.value[0],
      growth: this.calculateGrowth(timelineData),
      source: 'google-trends-interest'
    };
  }

  /**
   * 성장률 계산
   */
  calculateGrowth(timelineData) {
    if (!timelineData || timelineData.length < 2) return 0;
    
    const recent = timelineData.slice(-3).map(d => d.value[0]).reduce((a, b) => a + b, 0) / 3;
    const older = timelineData.slice(0, 3).map(d => d.value[0]).reduce((a, b) => a + b, 0) / 3;
    
    return older > 0 ? Math.round(((recent - older) / older) * 100) : 0;
  }
}

module.exports = GoogleTrendsAPI;
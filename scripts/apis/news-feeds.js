/**
 * news-feeds.js
 * 뉴스 피드 API 통합 모듈 (Google News RSS, NewsAPI, GNews)
 */

const axios = require('axios');
const Parser = require('rss-parser');

class NewsFeedsAPI {
  constructor(logger, rateLimiter) {
    this.logger = logger;
    this.rateLimiter = rateLimiter;
    this.rssParser = new Parser({
      customFields: {
        item: ['pubDate', 'description']
      }
    });
  }

  /**
   * Google News RSS 피드 조회
   */
  async getGoogleNewsKeywords() {
    await this.logger.info('Google News RSS 피드 조회 중');
    
    try {
      const newsKeywords = [];
      const categories = [
        { name: 'technology', url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko' },
        { name: 'science', url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko' },
        { name: 'business', url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko' }
      ];
      
      for (const category of categories) {
        try {
          const feed = await this.rssParser.parseURL(category.url);
          
          for (const item of feed.items.slice(0, 10)) {
            const keywords = this.extractKeywordsFromText(item.title + ' ' + (item.contentSnippet || ''));
            
            for (const keyword of keywords.slice(0, 3)) {
              newsKeywords.push({
                keyword,
                score: Math.floor(Math.random() * 30) + 40, // 40-70 점수
                growth: Math.floor(Math.random() * 20) - 10,
                category: `news-${category.name}`,
                source: 'google-news-rss',
                publishedDate: item.pubDate,
                link: item.link
              });
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000)); // RSS 요청 간격
        } catch (error) {
          await this.logger.warning(`Google News RSS (${category.name}) 조회 실패`, { error: error.message });
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
   * NewsAPI.org 조회
   */
  async getNewsAPIKeywords() {
    await this.logger.info('NewsAPI.org 조회 중');
    
    if (!await this.rateLimiter.checkLimit('newsApi')) {
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
   * GNews API 조회
   */
  async getGNewsKeywords() {
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
    const stopWords = ['그리고', '하지만', '그러나', '또한', '이를', '이와', 'and', 'the', 'for', 'with', '기자', '뉴스', '보도', '발표'];
    const keywords = [...koreanWords, ...englishWords]
      .filter(word => !stopWords.includes(word.toLowerCase()))
      .filter(word => word.length >= 2)
      .slice(0, 5);
    
    return [...new Set(keywords)]; // 중복 제거
  }
}

module.exports = NewsFeedsAPI;
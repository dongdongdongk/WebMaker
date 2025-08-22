/**
 * reddit.js
 * Reddit API 통합 모듈
 */

const axios = require('axios');

class RedditAPI {
  constructor(logger, rateLimiter) {
    this.logger = logger;
    this.rateLimiter = rateLimiter;
    this.apiName = 'reddit';
    this.baseURL = 'https://www.reddit.com';
    
    // 기술 관련 서브레딧 목록
    this.subreddits = [
      'programming',
      'webdev',
      'javascript',
      'reactjs',
      'MachineLearning',
      'artificial',
      'technology',
      'startups',
      'korea'
    ];
  }

  /**
   * Reddit 인기 포스트에서 키워드 수집
   */
  async getRedditKeywords() {
    await this.logger.info('Reddit API 조회 중');
    
    if (!await this.rateLimiter.checkLimit(this.apiName)) {
      return [];
    }

    try {
      const redditKeywords = [];
      
      for (const subreddit of this.subreddits.slice(0, 5)) { // 처음 5개만
        try {
          const posts = await this.getSubredditPosts(subreddit);
          
          for (const post of posts.slice(0, 10)) {
            const keywords = this.extractKeywordsFromText(post.title + ' ' + (post.selftext || ''));
            
            for (const keyword of keywords.slice(0, 2)) {
              redditKeywords.push({
                keyword,
                score: this.calculateRedditScore(post),
                growth: Math.floor(Math.random() * 20) - 10,
                category: `reddit-${subreddit}`,
                source: 'reddit',
                upvotes: post.ups,
                comments: post.num_comments,
                subreddit: post.subreddit,
                created: new Date(post.created_utc * 1000).toISOString()
              });
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000)); // Reddit API 요청 간격
        } catch (error) {
          await this.logger.warning(`Reddit r/${subreddit} 조회 실패`, { error: error.message });
        }
      }
      
      await this.logger.info(`Reddit에서 ${redditKeywords.length}개 키워드 수집`);
      return redditKeywords;
      
    } catch (error) {
      await this.logger.error('Reddit API 전체 조회 실패', { error: error.message });
      return [];
    }
  }

  /**
   * 서브레딧 포스트 조회
   */
  async getSubredditPosts(subreddit, sort = 'hot', limit = 25) {
    const url = `${this.baseURL}/r/${subreddit}/${sort}.json?limit=${limit}`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'WebMaker-Bot/1.0 (by /u/webmaker)'
        },
        timeout: 10000
      });
      
      if (response.data && response.data.data && response.data.data.children) {
        return response.data.data.children.map(child => child.data);
      }
      
      return [];
    } catch (error) {
      throw new Error(`서브레딧 r/${subreddit} 조회 실패: ${error.message}`);
    }
  }

  /**
   * Reddit 포스트 점수 계산
   */
  calculateRedditScore(post) {
    const upvotes = post.ups || 0;
    const comments = post.num_comments || 0;
    const hoursOld = (Date.now() - (post.created_utc * 1000)) / (1000 * 60 * 60);
    
    // 업보트, 댓글 수, 시간 경과를 고려한 점수
    let score = Math.log10(Math.max(upvotes, 1)) * 10;
    score += Math.log10(Math.max(comments, 1)) * 5;
    score = score / Math.max(hoursOld / 24, 0.1); // 최신 게시물에 가산점
    
    return Math.min(Math.max(Math.round(score), 10), 100); // 10-100 범위로 제한
  }

  /**
   * 텍스트에서 키워드 추출
   */
  extractKeywordsFromText(text) {
    if (!text) return [];
    
    // 영어 단어와 기술 용어 추출
    const techWords = text.match(/[A-Za-z]{3,}/g) || [];
    const koreanWords = text.match(/[가-힣]{2,}/g) || [];
    
    // 불용어 제거
    const stopWords = [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use',
      'reddit', 'post', 'comment', 'upvote', 'downvote'
    ];
    
    const keywords = [...techWords, ...koreanWords]
      .filter(word => !stopWords.includes(word.toLowerCase()))
      .filter(word => word.length >= 3)
      .filter(word => !/^\d+$/.test(word)) // 숫자만 있는 단어 제외
      .slice(0, 5);
    
    return [...new Set(keywords)]; // 중복 제거
  }

  /**
   * 특정 키워드의 Reddit 인기도 조회
   */
  async searchKeyword(keyword) {
    if (!await this.rateLimiter.checkLimit(this.apiName)) {
      return null;
    }

    try {
      const url = `${this.baseURL}/search.json?q=${encodeURIComponent(keyword)}&sort=relevance&limit=10`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'WebMaker-Bot/1.0 (by /u/webmaker)'
        },
        timeout: 10000
      });
      
      if (response.data && response.data.data && response.data.data.children) {
        const posts = response.data.data.children.map(child => child.data);
        const totalScore = posts.reduce((sum, post) => sum + this.calculateRedditScore(post), 0);
        
        return {
          keyword,
          score: Math.round(totalScore / Math.max(posts.length, 1)),
          postCount: posts.length,
          source: 'reddit-search'
        };
      }
      
      return null;
    } catch (error) {
      await this.logger.warning(`Reddit 키워드 "${keyword}" 검색 실패`, { error: error.message });
      return null;
    }
  }
}

module.exports = RedditAPI;
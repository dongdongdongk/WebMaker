/**
 * reddit-subreddit.js
 * 특정 서브레딧에서 일일 top 글과 모든 댓글을 수집하는 모듈
 */

const axios = require('axios');

class RedditSubreddit {
  constructor(logger) {
    this.logger = logger;
    this.baseURL = 'https://www.reddit.com';
    this.oauthURL = 'https://oauth.reddit.com';
    
    // Reddit API 설정
    this.clientId = process.env.REDDIT_CLIENT_ID;
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET;
    this.userAgent = process.env.REDDIT_USER_AGENT || 'WebMaker-Bot/1.0 (by /u/webmaker)';
    
    // OAuth 토큰 관리
    this.accessToken = null;
    this.tokenExpiry = null;
    
    // API 사용 모드 결정
    this.useOfficialAPI = !!(this.clientId && this.clientSecret);
    
    // 추천 서브레딧 목록 (카테고리별)
    this.recommendedSubreddits = {
      technology: ['technology', 'programming', 'webdev', 'artificial', 'MachineLearning'],
      business: ['entrepreneur', 'startups', 'smallbusiness', 'marketing', 'ecommerce'],
      lifestyle: ['LifeProTips', 'productivity', 'getmotivated', 'selfimprovement'],
      food: ['veganfood', 'MealPrepSunday', 'recipes', 'cooking'],
      design: ['web_design', 'userexperience', 'graphic_design', 'webdev'],
      science: ['science', 'space', 'futurology', 'askscience']
    };
  }

  /**
   * OAuth 토큰 발급/갱신
   */
  async authenticateOAuth() {
    if (!this.useOfficialAPI) return false;

    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return true;
    }

    try {
      await this.logger.info('Reddit OAuth 토큰 발급 중');

      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post('https://www.reddit.com/api/v1/access_token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': this.userAgent
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
        
        await this.logger.info('Reddit OAuth 인증 성공');
        return true;
      }

      throw new Error('OAuth 토큰 발급 실패');
    } catch (error) {
      await this.logger.warning('Reddit OAuth 인증 실패, 공개 API로 fallback', { error: error.message });
      this.useOfficialAPI = false;
      return false;
    }
  }

  /**
   * 특정 서브레딧에서 일일 top 글 수집
   */
  async getDailyTopPost(subreddit = 'technology') {
    await this.logger.info(`r/${subreddit}에서 일일 top 글 수집 중`);

    try {
      // 공식 API 인증 시도
      if (this.useOfficialAPI) {
        const authSuccess = await this.authenticateOAuth();
        if (!authSuccess) {
          this.useOfficialAPI = false;
        }
      }

      // 일일 top 글 가져오기
      const post = await this.getTopPost(subreddit);
      
      if (!post) {
        await this.logger.warning(`r/${subreddit}에서 적절한 top 글을 찾을 수 없음`);
        return null;
      }

      await this.logger.info(`Top 글 발견: "${post.title}" (${post.ups} upvotes)`);

      // 해당 글의 모든 댓글 수집
      const allComments = await this.getAllComments(post.permalink);

      const result = {
        // 서브레딧 정보
        subreddit: post.subreddit,
        subredditDescription: await this.getSubredditDescription(subreddit),
        
        // 게시물 정보
        title: post.title,
        content: post.selftext || '',
        url: `https://reddit.com${post.permalink}`,
        author: post.author,
        upvotes: post.ups,
        commentCount: post.num_comments,
        createdTime: new Date(post.created_utc * 1000).toISOString(),
        
        // 댓글들 (인기순 + 일반순)
        topComments: allComments.topComments,      // 인기 댓글들
        allComments: allComments.allComments,      // 모든 댓글들
        commentStats: allComments.stats,           // 댓글 통계
        
        // 메타데이터
        collectedAt: new Date().toISOString(),
        source: this.useOfficialAPI ? 'reddit-official' : 'reddit-public',
        category: this.getSubredditCategory(subreddit)
      };

      await this.logger.success(`r/${subreddit} 데이터 수집 완료: 인기 댓글 ${allComments.topComments.length}개, 전체 댓글 ${allComments.allComments.length}개`);
      return result;

    } catch (error) {
      await this.logger.error(`r/${subreddit} 데이터 수집 실패`, { error: error.message });
      return null;
    }
  }

  /**
   * 서브레딧에서 일일 top 글 가져오기
   */
  async getTopPost(subreddit) {
    try {
      let url, headers;

      if (this.useOfficialAPI && this.accessToken) {
        url = `${this.oauthURL}/r/${subreddit}/top?t=day&limit=5`;
        headers = {
          'Authorization': `Bearer ${this.accessToken}`,
          'User-Agent': this.userAgent
        };
      } else {
        url = `${this.baseURL}/r/${subreddit}/top.json?t=day&limit=5`;
        headers = {
          'User-Agent': this.userAgent
        };
      }

      await this.logger.info(`일일 top 글 조회: r/${subreddit}`);

      const response = await axios.get(url, { headers, timeout: 10000 });

      if (response.data && response.data.data && response.data.data.children) {
        const posts = response.data.data.children;
        
        // 적절한 포스트 찾기 (스티키가 아니고, 충분한 upvote, 성인 콘텐츠 아님)
        for (const postObj of posts) {
          const post = postObj.data;
          if (post.ups > 50 && !post.over_18 && !post.stickied) {
            return post;
          }
        }
        
        // 조건에 맞는 것이 없으면 첫 번째 것 반환
        if (posts.length > 0) {
          return posts[0].data;
        }
      }

      return null;
    } catch (error) {
      await this.logger.error(`r/${subreddit} top 글 조회 실패`, { error: error.message });
      return null;
    }
  }

  /**
   * 특정 글의 모든 댓글 수집 (인기 댓글 + 일반 댓글)
   */
  async getAllComments(permalink) {
    await this.logger.info(`모든 댓글 수집 중: ${permalink}`);

    try {
      // 1. 인기 댓글 수집 (top 정렬)
      const topComments = await this.getCommentsBySort(permalink, 'top', 15);
      
      // 2. 모든 댓글 수집 (new 정렬로 최신 댓글들도 포함)
      const newComments = await this.getCommentsBySort(permalink, 'new', 30);
      
      // 3. 댓글 합치기 및 중복 제거
      const allCommentsMap = new Map();
      
      // 인기 댓글 먼저 추가
      topComments.forEach(comment => {
        allCommentsMap.set(comment.id, { ...comment, type: 'top' });
      });
      
      // 일반 댓글 추가 (중복 제거)
      newComments.forEach(comment => {
        if (!allCommentsMap.has(comment.id)) {
          allCommentsMap.set(comment.id, { ...comment, type: 'new' });
        }
      });
      
      const allComments = Array.from(allCommentsMap.values());
      
      // 4. 통계 계산
      const stats = {
        totalComments: allComments.length,
        topCommentsCount: topComments.length,
        newCommentsCount: newComments.length,
        avgUpvotes: allComments.reduce((sum, c) => sum + c.upvotes, 0) / allComments.length,
        totalUpvotes: allComments.reduce((sum, c) => sum + c.upvotes, 0),
        gildedCount: allComments.filter(c => c.isGilded).length
      };

      await this.logger.info(`댓글 수집 완료: 인기 ${topComments.length}개, 신규 ${newComments.length}개, 총 ${allComments.length}개`);

      return {
        topComments: topComments,
        allComments: allComments,
        stats: stats
      };

    } catch (error) {
      await this.logger.error('댓글 수집 실패', { error: error.message });
      return {
        topComments: [],
        allComments: [],
        stats: { totalComments: 0, topCommentsCount: 0, newCommentsCount: 0 }
      };
    }
  }

  /**
   * 특정 정렬 방식으로 댓글 수집
   */
  async getCommentsBySort(permalink, sort = 'top', limit = 20) {
    try {
      let url, headers;

      if (this.useOfficialAPI && this.accessToken) {
        url = `${this.oauthURL}${permalink}?limit=${limit}&sort=${sort}`;
        headers = {
          'Authorization': `Bearer ${this.accessToken}`,
          'User-Agent': this.userAgent
        };
      } else {
        url = `${this.baseURL}${permalink}.json?limit=${limit}&sort=${sort}`;
        headers = {
          'User-Agent': this.userAgent
        };
      }

      const response = await axios.get(url, { headers, timeout: 15000 });

      if (response.data && Array.isArray(response.data) && response.data.length > 1) {
        const commentsData = response.data[1].data.children;
        const comments = [];

        for (const commentObj of commentsData.slice(0, limit)) {
          const comment = commentObj.data;
          
          // 유효한 댓글만 포함
          if (comment.body && 
              comment.body !== '[deleted]' && 
              comment.body !== '[removed]' && 
              comment.body.length > 10 &&
              comment.id) {  // ID가 있어야 중복 제거 가능
            comments.push({
              id: comment.id,
              body: comment.body,
              author: comment.author,
              upvotes: comment.ups || 0,
              score: comment.score || 0,
              createdTime: new Date(comment.created_utc * 1000).toISOString(),
              isGilded: comment.gilded > 0,
              depth: comment.depth || 0,
              parentId: comment.parent_id,
              sortType: sort
            });
          }
        }

        return comments;
      }

      return [];
    } catch (error) {
      await this.logger.warning(`${sort} 댓글 수집 실패`, { error: error.message });
      return [];
    }
  }

  /**
   * 서브레딧 설명 가져오기
   */
  async getSubredditDescription(subreddit) {
    try {
      let url, headers;

      if (this.useOfficialAPI && this.accessToken) {
        url = `${this.oauthURL}/r/${subreddit}/about`;
        headers = {
          'Authorization': `Bearer ${this.accessToken}`,
          'User-Agent': this.userAgent
        };
      } else {
        url = `${this.baseURL}/r/${subreddit}/about.json`;
        headers = {
          'User-Agent': this.userAgent
        };
      }

      const response = await axios.get(url, { headers, timeout: 10000 });

      if (response.data && response.data.data) {
        return response.data.data.public_description || response.data.data.description || '';
      }

      return '';
    } catch (error) {
      await this.logger.warning(`r/${subreddit} 설명 가져오기 실패`, { error: error.message });
      return '';
    }
  }

  /**
   * 서브레딧 카테고리 분류
   */
  getSubredditCategory(subreddit) {
    for (const [category, subreddits] of Object.entries(this.recommendedSubreddits)) {
      if (subreddits.some(sub => sub.toLowerCase() === subreddit.toLowerCase())) {
        return category;
      }
    }
    return 'general';
  }

  /**
   * 추천 서브레딧 목록 반환
   */
  getRecommendedSubreddits() {
    return this.recommendedSubreddits;
  }

  /**
   * 수집된 데이터를 AI 블로그 생성용으로 포맷팅
   */
  formatForAIGeneration(data) {
    if (!data) return null;

    return {
      // 소스 정보
      source: {
        subreddit: data.subreddit,
        category: data.category,
        description: data.subredditDescription,
        originalUrl: data.url
      },
      
      // 메인 콘텐츠
      original: {
        title: data.title,
        content: data.content,
        engagement: {
          upvotes: data.upvotes,
          comments: data.commentCount
        }
      },
      
      // 커뮤니티 반응
      community: {
        topComments: data.topComments.map(comment => ({
          text: comment.body,
          author: comment.author,
          popularity: comment.upvotes,
          isHighlighted: comment.isGilded,
          type: 'top'
        })),
        allComments: data.allComments.map(comment => ({
          text: comment.body,
          author: comment.author,
          popularity: comment.upvotes,
          isHighlighted: comment.isGilded,
          type: comment.sortType || 'general'
        })),
        stats: data.commentStats
      },
      
      // AI 생성 힌트
      aiHints: {
        trend_level: this.getEngagementLevel(data.upvotes),
        topic_category: data.category,
        content_type: data.content ? 'discussion' : 'link',
        community_interest: data.commentCount > 50 ? 'high' : 'medium',
        comment_sentiment: this.analyzeCommentSentiment(data.allComments)
      }
    };
  }

  /**
   * 댓글 감정 분석 (간단한 키워드 기반)
   */
  analyzeCommentSentiment(comments) {
    const positiveWords = ['good', 'great', 'awesome', 'love', 'amazing', 'excellent', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'worst', 'stupid'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    comments.forEach(comment => {
      const text = comment.body.toLowerCase();
      if (positiveWords.some(word => text.includes(word))) positiveCount++;
      if (negativeWords.some(word => text.includes(word))) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * 참여도 레벨 계산
   */
  getEngagementLevel(upvotes) {
    if (upvotes > 10000) return 'viral';
    if (upvotes > 5000) return 'very_high';
    if (upvotes > 1000) return 'high';
    if (upvotes > 500) return 'medium';
    return 'normal';
  }
}

module.exports = RedditSubreddit;
/**
 * used-posts-manager.js
 * Reddit에서 사용된 글들을 추적하고 관리하는 모듈
 */

const fs = require('fs').promises;
const path = require('path');

class UsedPostsManager {
  constructor(logger) {
    this.logger = logger;
    this.configPath = path.join(__dirname, '../../config/used-posts.json');
    this.retentionDays = 30; // 30일간 보관
  }

  /**
   * 사용된 글 데이터 로드
   */
  async loadUsedPosts() {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(data);
      
      // 기본 구조 확인 및 보정
      if (!config.posts) config.posts = [];
      if (!config.lastCleanup) config.lastCleanup = new Date().toISOString();
      if (!config.stats) config.stats = { totalUsed: 0, cleanupCount: 0 };
      
      return config;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 파일이 없으면 기본 구조로 생성
        const defaultConfig = {
          posts: [],
          lastCleanup: new Date().toISOString(),
          stats: {
            totalUsed: 0,
            cleanupCount: 0
          }
        };
        await this.saveUsedPosts(defaultConfig);
        return defaultConfig;
      }
      throw error;
    }
  }

  /**
   * 사용된 글 데이터 저장
   */
  async saveUsedPosts(config) {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      await this.logger.error('사용된 글 데이터 저장 실패', { error: error.message });
      throw error;
    }
  }

  /**
   * 특정 글 ID가 이미 사용되었는지 확인
   */
  async isPostUsed(postId, subreddit = null) {
    try {
      const config = await this.loadUsedPosts();
      
      const isUsed = config.posts.some(post => 
        post.id === postId && 
        (!subreddit || post.subreddit === subreddit)
      );
      
      if (isUsed) {
        await this.logger.info(`이미 사용된 글 발견: ${postId} (${subreddit})`);
      }
      
      return isUsed;
    } catch (error) {
      await this.logger.warning('사용된 글 확인 실패, 안전하게 미사용으로 처리', { 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * 새로운 사용된 글 추가
   */
  async addUsedPost(postData) {
    try {
      const config = await this.loadUsedPosts();
      
      const newPost = {
        id: postData.id,
        title: postData.title,
        subreddit: postData.subreddit,
        upvotes: postData.upvotes || 0,
        usedAt: new Date().toISOString(),
        url: postData.url || ''
      };
      
      // 중복 확인 (안전장치)
      const exists = config.posts.some(post => 
        post.id === newPost.id && post.subreddit === newPost.subreddit
      );
      
      if (!exists) {
        config.posts.push(newPost);
        config.stats.totalUsed++;
        
        await this.logger.info(`사용된 글 추가: ${newPost.id} - "${newPost.title.substring(0, 50)}..."`);
      }
      
      await this.saveUsedPosts(config);
      return true;
    } catch (error) {
      await this.logger.error('사용된 글 추가 실패', { 
        error: error.message,
        postId: postData.id 
      });
      return false;
    }
  }

  /**
   * 30일 이상된 기록 정리
   */
  async cleanupOldPosts() {
    try {
      const config = await this.loadUsedPosts();
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - (this.retentionDays * 24 * 60 * 60 * 1000));
      
      const originalCount = config.posts.length;
      
      // 30일 이내의 글만 유지
      config.posts = config.posts.filter(post => {
        const postDate = new Date(post.usedAt);
        return postDate > cutoffDate;
      });
      
      const cleanedCount = originalCount - config.posts.length;
      
      if (cleanedCount > 0) {
        config.stats.cleanupCount++;
        config.lastCleanup = now.toISOString();
        
        await this.logger.info(`오래된 기록 정리 완료: ${cleanedCount}개 제거, ${config.posts.length}개 유지`);
        await this.saveUsedPosts(config);
      }
      
      return cleanedCount;
    } catch (error) {
      await this.logger.error('기록 정리 실패', { error: error.message });
      return 0;
    }
  }

  /**
   * 자동 정리 필요성 확인 (7일마다 실행)
   */
  async shouldCleanup() {
    try {
      const config = await this.loadUsedPosts();
      const lastCleanup = new Date(config.lastCleanup);
      const now = new Date();
      const daysSinceCleanup = (now - lastCleanup) / (24 * 60 * 60 * 1000);
      
      return daysSinceCleanup >= 7; // 7일마다 정리
    } catch (error) {
      return true; // 오류 시 정리 실행
    }
  }

  /**
   * 필터링된 글 목록 반환 (중복 제외)
   */
  async filterUnusedPosts(posts, subreddit) {
    try {
      const config = await this.loadUsedPosts();
      const usedIds = new Set(
        config.posts
          .filter(post => post.subreddit.toLowerCase() === subreddit.toLowerCase())
          .map(post => post.id)
      );
      
      
      const filteredPosts = posts.filter(post => !usedIds.has(post.id));
      
      await this.logger.info(`글 필터링 완료: ${posts.length}개 → ${filteredPosts.length}개 (${posts.length - filteredPosts.length}개 중복 제외)`);
      
      return filteredPosts;
    } catch (error) {
      await this.logger.warning('글 필터링 실패, 전체 목록 반환', { error: error.message });
      return posts;
    }
  }

  /**
   * 사용 통계 조회
   */
  async getStats() {
    try {
      const config = await this.loadUsedPosts();
      
      // 서브레딧별 통계 계산
      const subredditStats = {};
      config.posts.forEach(post => {
        if (!subredditStats[post.subreddit]) {
          subredditStats[post.subreddit] = 0;
        }
        subredditStats[post.subreddit]++;
      });
      
      // 최근 활동 통계
      const now = new Date();
      const recentPosts = config.posts.filter(post => {
        const postDate = new Date(post.usedAt);
        const daysDiff = (now - postDate) / (24 * 60 * 60 * 1000);
        return daysDiff <= 7;
      });
      
      return {
        totalPosts: config.posts.length,
        recentPosts: recentPosts.length,
        subredditStats: subredditStats,
        lastCleanup: config.lastCleanup,
        cleanupCount: config.stats.cleanupCount,
        retentionDays: this.retentionDays
      };
    } catch (error) {
      await this.logger.error('통계 조회 실패', { error: error.message });
      return null;
    }
  }

  /**
   * 전체 기록 초기화 (개발용)
   */
  async resetAllPosts() {
    try {
      const config = {
        posts: [],
        lastCleanup: new Date().toISOString(),
        stats: {
          totalUsed: 0,
          cleanupCount: 0
        }
      };
      
      await this.saveUsedPosts(config);
      await this.logger.info('사용된 글 기록 전체 초기화 완료');
      return true;
    } catch (error) {
      await this.logger.error('기록 초기화 실패', { error: error.message });
      return false;
    }
  }
}

module.exports = UsedPostsManager;
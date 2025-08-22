/**
 * rate-limiter.js
 * API 레이트 리미팅 관리 모듈
 */

class RateLimiter {
  constructor(logger) {
    this.logger = logger;
    this.limits = {
      googleTrends: { 
        calls: 0, 
        maxCalls: 100, 
        resetTime: Date.now() + 3600000, // 1시간
        resetInterval: 3600000 
      },
      newsApi: { 
        calls: 0, 
        maxCalls: 500, 
        resetTime: Date.now() + 86400000, // 24시간
        resetInterval: 86400000 
      },
      reddit: { 
        calls: 0, 
        maxCalls: 60, 
        resetTime: Date.now() + 60000, // 1분
        resetInterval: 60000 
      },
      gnews: { 
        calls: 0, 
        maxCalls: 100, 
        resetTime: Date.now() + 86400000, // 24시간
        resetInterval: 86400000 
      }
    };
  }

  /**
   * API 레이트 리미트 확인
   */
  async checkLimit(apiName) {
    const limit = this.limits[apiName];
    if (!limit) {
      await this.logger.warning(`알 수 없는 API: ${apiName}`);
      return true; // 제한이 없는 API는 허용
    }
    
    // 리셋 시간이 지났는지 확인
    if (Date.now() > limit.resetTime) {
      limit.calls = 0;
      limit.resetTime = Date.now() + limit.resetInterval;
      await this.logger.info(`${apiName} API 레이트 리미트 리셋`, { 
        newResetTime: new Date(limit.resetTime).toISOString() 
      });
    }
    
    // 제한 확인
    if (limit.calls >= limit.maxCalls) {
      const waitTime = Math.round((limit.resetTime - Date.now()) / 1000);
      await this.logger.warning(`${apiName} API 레이트 리미트 초과`, { 
        calls: limit.calls, 
        maxCalls: limit.maxCalls,
        waitTimeSeconds: waitTime
      });
      return false;
    }
    
    // 호출 수 증가
    limit.calls++;
    await this.logger.debug(`${apiName} API 호출`, { 
      calls: limit.calls, 
      remaining: limit.maxCalls - limit.calls 
    });
    
    return true;
  }

  /**
   * 특정 API의 현재 상태 조회
   */
  getStatus(apiName) {
    const limit = this.limits[apiName];
    if (!limit) return null;
    
    const now = Date.now();
    const resetInSeconds = Math.max(0, Math.round((limit.resetTime - now) / 1000));
    
    return {
      api: apiName,
      calls: limit.calls,
      maxCalls: limit.maxCalls,
      remaining: limit.maxCalls - limit.calls,
      resetInSeconds,
      resetTime: new Date(limit.resetTime).toISOString()
    };
  }

  /**
   * 모든 API의 상태 조회
   */
  getAllStatus() {
    const status = {};
    
    for (const apiName of Object.keys(this.limits)) {
      status[apiName] = this.getStatus(apiName);
    }
    
    return status;
  }

  /**
   * 특정 API의 제한을 수동으로 리셋
   */
  async resetLimit(apiName) {
    const limit = this.limits[apiName];
    if (!limit) {
      await this.logger.warning(`알 수 없는 API: ${apiName}`);
      return false;
    }
    
    limit.calls = 0;
    limit.resetTime = Date.now() + limit.resetInterval;
    
    await this.logger.info(`${apiName} API 레이트 리미트 수동 리셋`);
    return true;
  }

  /**
   * API 호출 대기 시간 계산
   */
  calculateDelay(apiName) {
    const limit = this.limits[apiName];
    if (!limit) return 0;
    
    // 호출 빈도에 따른 지연 시간 계산
    const callsPerMinute = (limit.calls / (limit.resetInterval / 60000));
    const recommendedDelay = Math.max(1000, Math.round(60000 / limit.maxCalls * 60)); // 분당 최대 호출수 기반
    
    return Math.min(recommendedDelay * (callsPerMinute / 10), 10000); // 최대 10초
  }

  /**
   * 스마트 대기 (API별 최적 호출 간격)
   */
  async smartDelay(apiName) {
    const delay = this.calculateDelay(apiName);
    if (delay > 0) {
      await this.logger.debug(`${apiName} API 호출 간격 대기`, { delayMs: delay });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = RateLimiter;
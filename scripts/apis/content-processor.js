/**
 * content-processor.js
 * 크롤링된 콘텐츠 처리 및 분석 모듈
 */

class ContentProcessor {
  constructor(logger) {
    this.logger = logger;
    
    // 콘텐츠 필터링 기준
    this.filterCriteria = {
      minQualityScore: 40,
      minWordCount: 100,
      maxDuplicateThreshold: 0.8,
      blacklistKeywords: ['광고', 'AD', '홍보', '스폰서', 'sponsored'],
      requiredLanguages: ['ko', 'en']
    };
  }

  /**
   * 크롤링 결과 일괄 처리
   */
  async processResults(crawlResults, keyword = '') {
    await this.logger.info(`${crawlResults.length}개 크롤링 결과 처리 시작`);
    
    if (!crawlResults.length) {
      await this.logger.warning('처리할 크롤링 결과가 없음');
      return {
        processed: [],
        filtered: [],
        summary: { total: 0, passed: 0, failed: 0 }
      };
    }
    
    // 1. 기본 필터링
    const filteredResults = this.filterByQuality(crawlResults);
    
    // 2. 중복 제거
    const uniqueResults = this.removeDuplicates(filteredResults);
    
    // 3. 언어 감지 및 필터링
    const languageFiltered = await this.filterByLanguage(uniqueResults);
    
    // 4. 키워드 관련성 점수 계산
    const scoredResults = this.calculateRelevanceScores(languageFiltered, keyword);
    
    // 5. 최종 순위 매기기
    const rankedResults = this.rankContent(scoredResults);
    
    // 6. 메타데이터 보강
    const enrichedResults = await this.enrichMetadata(rankedResults);
    
    const summary = {
      total: crawlResults.length,
      filtered: crawlResults.length - filteredResults.length,
      duplicates: filteredResults.length - uniqueResults.length,
      languageFiltered: uniqueResults.length - languageFiltered.length,
      final: enrichedResults.length,
      avgQuality: this.calculateAverageQuality(enrichedResults),
      topQuality: Math.max(...enrichedResults.map(r => r.quality.score))
    };
    
    await this.logger.info('크롤링 결과 처리 완료', summary);
    
    return {
      processed: enrichedResults,
      summary,
      keyword,
      processedAt: new Date().toISOString()
    };
  }

  /**
   * 품질 기준 필터링
   */
  filterByQuality(results) {
    return results.filter(result => {
      if (!result || !result.quality) return false;
      
      const quality = result.quality;
      const content = result.content || '';
      
      // 최소 품질 점수
      if (quality.score < this.filterCriteria.minQualityScore) {
        return false;
      }
      
      // 최소 단어 수
      if (quality.wordCount < this.filterCriteria.minWordCount) {
        return false;
      }
      
      // 블랙리스트 키워드 체크
      const hasBlacklistKeywords = this.filterCriteria.blacklistKeywords.some(
        keyword => content.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasBlacklistKeywords) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * 중복 콘텐츠 제거
   */
  removeDuplicates(results) {
    if (results.length <= 1) return results;
    
    const unique = [];
    
    for (let i = 0; i < results.length; i++) {
      const current = results[i];
      let isDuplicate = false;
      
      for (let j = 0; j < unique.length; j++) {
        const existing = unique[j];
        const similarity = this.calculateTextSimilarity(current.content, existing.content);
        
        if (similarity > this.filterCriteria.maxDuplicateThreshold) {
          isDuplicate = true;
          
          // 더 높은 품질의 콘텐츠를 유지
          if (current.quality.score > existing.quality.score) {
            unique[j] = current;
          }
          break;
        }
      }
      
      if (!isDuplicate) {
        unique.push(current);
      }
    }
    
    return unique;
  }

  /**
   * 텍스트 유사도 계산 (간단한 Jaccard 유사도)
   */
  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    // 문장 단위로 분할
    const sentences1 = new Set(text1.split(/[.!?]+/).map(s => s.trim().toLowerCase()));
    const sentences2 = new Set(text2.split(/[.!?]+/).map(s => s.trim().toLowerCase()));
    
    // Jaccard 유사도 계산
    const intersection = new Set([...sentences1].filter(s => sentences2.has(s)));
    const union = new Set([...sentences1, ...sentences2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 언어 감지 및 필터링
   */
  async filterByLanguage(results) {
    const filtered = [];
    
    for (const result of results) {
      const detectedLanguage = this.detectLanguage(result.content);
      result.detectedLanguage = detectedLanguage;
      
      if (this.filterCriteria.requiredLanguages.includes(detectedLanguage)) {
        filtered.push(result);
      }
    }
    
    return filtered;
  }

  /**
   * 간단한 언어 감지 (한국어/영어)
   */
  detectLanguage(text) {
    if (!text) return 'unknown';
    
    // 한글 문자 비율 계산
    const koreanChars = text.match(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g) || [];
    const totalChars = text.replace(/\s/g, '').length;
    const koreanRatio = koreanChars.length / totalChars;
    
    if (koreanRatio > 0.3) return 'ko';
    if (text.match(/[a-zA-Z]/g) && koreanRatio < 0.1) return 'en';
    
    return 'mixed';
  }

  /**
   * 키워드 관련성 점수 계산
   */
  calculateRelevanceScores(results, keyword = '') {
    if (!keyword) return results;
    
    return results.map(result => {
      const content = (result.content || '').toLowerCase();
      const title = (result.title || '').toLowerCase();
      const keywordLower = keyword.toLowerCase();
      
      let relevanceScore = 0;
      
      // 제목에서의 키워드 출현 (높은 가중치)
      const titleMatches = (title.match(new RegExp(keywordLower, 'g')) || []).length;
      relevanceScore += titleMatches * 10;
      
      // 본문에서의 키워드 출현
      const contentMatches = (content.match(new RegExp(keywordLower, 'g')) || []).length;
      relevanceScore += contentMatches * 2;
      
      // 키워드 밀도 점수
      const wordCount = content.split(/\s+/).length;
      const density = contentMatches / Math.max(wordCount, 1);
      
      if (density >= 0.01 && density <= 0.05) {
        relevanceScore += 20; // 적절한 밀도
      } else if (density > 0) {
        relevanceScore += 10;
      }
      
      // 유사 키워드 검색 (간단한 부분 문자열 매칭)
      const relatedKeywords = this.generateRelatedKeywords(keyword);
      relatedKeywords.forEach(relatedKeyword => {
        if (content.includes(relatedKeyword.toLowerCase())) {
          relevanceScore += 5;
        }
      });
      
      result.relevanceScore = Math.min(relevanceScore, 100);
      return result;
    });
  }

  /**
   * 관련 키워드 생성
   */
  generateRelatedKeywords(keyword) {
    if (!keyword) return [];
    
    const keywordMap = {
      'AI': ['인공지능', 'artificial intelligence', 'machine learning', '머신러닝'],
      '인공지능': ['AI', 'artificial intelligence', 'machine learning', '머신러닝'],
      'JavaScript': ['JS', 'ECMAScript', 'Node.js', 'React'],
      'React': ['리액트', 'JavaScript', 'JSX', 'Next.js'],
      '블록체인': ['blockchain', 'cryptocurrency', '암호화폐', 'bitcoin'],
      '스타트업': ['startup', 'venture', '벤처', 'entrepreneur']
    };
    
    return keywordMap[keyword] || [];
  }

  /**
   * 콘텐츠 순위 매기기
   */
  rankContent(results) {
    return results
      .map(result => ({
        ...result,
        finalScore: this.calculateFinalScore(result)
      }))
      .sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * 최종 점수 계산
   */
  calculateFinalScore(result) {
    const qualityWeight = 0.4;
    const relevanceWeight = 0.3;
    const freshnessWeight = 0.2;
    const authorityWeight = 0.1;
    
    const qualityScore = result.quality?.score || 0;
    const relevanceScore = result.relevanceScore || 0;
    const freshnessScore = this.calculateFreshnessScore(result);
    const authorityScore = this.calculateAuthorityScore(result);
    
    return Math.round(
      qualityScore * qualityWeight +
      relevanceScore * relevanceWeight +
      freshnessScore * freshnessWeight +
      authorityScore * authorityWeight
    );
  }

  /**
   * 신선도 점수 계산
   */
  calculateFreshnessScore(result) {
    const publishDate = result.metadata?.publishDate;
    if (!publishDate) return 50; // 기본 점수
    
    const pubTime = new Date(publishDate).getTime();
    const now = Date.now();
    const daysDiff = (now - pubTime) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 1) return 100;      // 1일 이내
    if (daysDiff <= 7) return 80;       // 1주일 이내
    if (daysDiff <= 30) return 60;      // 1개월 이내
    if (daysDiff <= 90) return 40;      // 3개월 이내
    return 20;                          // 3개월 초과
  }

  /**
   * 권위도 점수 계산
   */
  calculateAuthorityScore(result) {
    const url = result.url || '';
    const domain = new URL(url).hostname;
    
    // 도메인별 권위도 점수
    const authorityDomains = {
      'medium.com': 80,
      'dev.to': 75,
      'techcrunch.com': 90,
      'blog.naver.com': 60,
      'tistory.com': 50,
      'github.io': 70,
      'stackoverflow.com': 85
    };
    
    for (const [authorityDomain, score] of Object.entries(authorityDomains)) {
      if (domain.includes(authorityDomain)) {
        return score;
      }
    }
    
    // HTTPS 보너스
    const httpsBonus = url.startsWith('https://') ? 10 : 0;
    
    return 50 + httpsBonus; // 기본 점수
  }

  /**
   * 메타데이터 보강
   */
  async enrichMetadata(results) {
    return results.map(result => {
      // 읽기 시간 재계산
      const wordCount = result.wordCount || result.content.split(/\s+/).length;
      result.readingTime = Math.ceil(wordCount / 200);
      
      // 태그 추출
      result.extractedTags = this.extractTags(result.content, result.title);
      
      // 감정 분석 (간단한 버전)
      result.sentiment = this.analyzeSentiment(result.content);
      
      // 카테고리 추측
      result.suggestedCategory = this.suggestCategory(result.content, result.title);
      
      return result;
    });
  }

  /**
   * 태그 추출
   */
  extractTags(content, title = '') {
    const text = `${title} ${content}`.toLowerCase();
    const techTerms = [
      'javascript', 'python', 'react', 'vue', 'angular', 'node.js',
      'ai', '인공지능', '머신러닝', 'blockchain', '블록체인',
      'cloud', 'aws', 'docker', 'kubernetes', 'microservice',
      'frontend', 'backend', 'fullstack', 'devops', 'api'
    ];
    
    const foundTerms = techTerms.filter(term => 
      text.includes(term.toLowerCase())
    );
    
    return foundTerms.slice(0, 5); // 최대 5개
  }

  /**
   * 간단한 감정 분석
   */
  analyzeSentiment(content) {
    if (!content) return 'neutral';
    
    const positiveWords = ['좋', '훌륭', '멋진', '최고', '완벽', '성공', '혁신'];
    const negativeWords = ['나쁜', '문제', '실패', '어려운', '복잡', '느린'];
    
    const text = content.toLowerCase();
    const positiveCount = positiveWords.reduce((count, word) => 
      count + (text.match(new RegExp(word, 'g')) || []).length, 0
    );
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (text.match(new RegExp(word, 'g')) || []).length, 0
    );
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * 카테고리 추천
   */
  suggestCategory(content, title = '') {
    const text = `${title} ${content}`.toLowerCase();
    
    const categories = {
      'frontend': ['react', 'vue', 'angular', 'javascript', 'css', 'html'],
      'backend': ['node.js', 'python', 'java', 'api', 'database', 'server'],
      'ai': ['ai', '인공지능', 'machine learning', '머신러닝', 'deep learning'],
      'devops': ['docker', 'kubernetes', 'aws', 'cloud', 'deployment'],
      'mobile': ['react native', 'flutter', 'ios', 'android', '모바일']
    };
    
    let bestCategory = 'general';
    let maxScore = 0;
    
    for (const [category, keywords] of Object.entries(categories)) {
      const score = keywords.reduce((count, keyword) => 
        count + (text.match(new RegExp(keyword, 'g')) || []).length, 0
      );
      
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    }
    
    return bestCategory;
  }

  /**
   * 평균 품질 계산
   */
  calculateAverageQuality(results) {
    if (!results.length) return 0;
    
    const totalQuality = results.reduce((sum, result) => 
      sum + (result.quality?.score || 0), 0
    );
    
    return Math.round(totalQuality / results.length);
  }

  /**
   * 처리 결과 요약 생성
   */
  generateProcessingSummary(processedData) {
    const { processed, summary } = processedData;
    
    return {
      overview: {
        totalProcessed: summary.total,
        finalCount: summary.final,
        successRate: `${Math.round((summary.final / summary.total) * 100)}%`,
        avgQuality: summary.avgQuality,
        topQuality: summary.topQuality
      },
      filtering: {
        qualityFiltered: summary.filtered,
        duplicatesRemoved: summary.duplicates,
        languageFiltered: summary.languageFiltered
      },
      topResults: processed.slice(0, 3).map(result => ({
        title: result.title,
        url: result.url,
        finalScore: result.finalScore,
        qualityScore: result.quality?.score,
        wordCount: result.wordCount
      }))
    };
  }
}

module.exports = ContentProcessor;
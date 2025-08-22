/**
 * optimize-seo.js
 * 생성된 블로그 포스트의 SEO를 최적화합니다.
 * 실행 시간: 약 3분
 */

const Logger = require('./utils/logger');
const FileUtils = require('./utils/file-utils');
const DateUtils = require('./utils/date-utils');
const StringUtils = require('./utils/string-utils');
const path = require('path');

class SEOOptimizer {
  constructor() {
    this.logger = new Logger('optimize-seo');
    this.postsDir = path.join(__dirname, '../content/posts');
    this.configPath = path.join(__dirname, '../config/seo-config.json');
    
    // SEO 최적화 규칙
    this.seoRules = {
      title: {
        minLength: 20,
        maxLength: 60,
        requiredKeywords: 1
      },
      excerpt: {
        minLength: 120,
        maxLength: 160,
        includeKeyword: true
      },
      content: {
        minWords: 300,
        keywordDensity: { min: 0.5, max: 3.0 }, // 0.5% - 3%
        headingStructure: true,
        internalLinks: 0, // 현재는 외부 링크 제외
        imageAltText: true
      },
      meta: {
        tags: { min: 3, max: 7 },
        categories: 1,
        readingTime: true
      }
    };
  }

  /**
   * SEO 설정 로드
   */
  async loadConfig() {
    try {
      const config = await FileUtils.readJson(this.configPath);
      if (config) {
        await this.logger.info('SEO 설정 파일 로드 완료');
        return config;
      }
    } catch (error) {
      await this.logger.warning('설정 파일 로드 실패, 기본 설정 사용');
    }

    // 기본 설정 생성
    const defaultConfig = {
      optimization: {
        keywordDensityTarget: 2.0, // 2%
        titleOptimization: true,
        excerptOptimization: true,
        headingOptimization: true,
        imageOptimization: true,
        metaTagOptimization: true
      },
      rules: this.seoRules,
      sitemap: {
        generate: true,
        priority: 0.8,
        changeFreq: 'weekly'
      },
      lastUpdated: DateUtils.getNow()
    };

    await FileUtils.writeJson(this.configPath, defaultConfig);
    await this.logger.info('기본 SEO 설정 생성 완료');
    return defaultConfig;
  }

  /**
   * 최근 생성된 포스트 파일 찾기
   */
  async findRecentPosts(hours = 24) {
    const posts = await FileUtils.listFiles(this.postsDir, '.md');
    const recentPosts = [];
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);

    for (const post of posts) {
      const postPath = path.join(this.postsDir, post);
      try {
        const stats = require('fs').statSync(postPath);
        if (stats.mtime.getTime() > cutoffTime) {
          recentPosts.push({
            filename: post,
            filepath: postPath,
            modifiedAt: stats.mtime
          });
        }
      } catch (error) {
        await this.logger.warning(`파일 stat 조회 실패: ${post}`);
      }
    }

    await this.logger.info(`최근 ${hours}시간 내 생성된 포스트: ${recentPosts.length}개`);
    return recentPosts.sort((a, b) => b.modifiedAt - a.modifiedAt);
  }

  /**
   * 마크다운 파일 파싱
   */
  parseMarkdownFile(content) {
    // Front matter 추출
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      throw new Error('Front matter를 찾을 수 없습니다');
    }

    const frontmatterText = frontmatterMatch[1];
    const bodyContent = frontmatterMatch[2];

    // YAML 파싱 (간단한 구현)
    const frontmatter = {};
    frontmatterText.split('\n').forEach(line => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        if (value.startsWith('"') && value.endsWith('"')) {
          frontmatter[key] = value.slice(1, -1);
        } else if (value.startsWith('[')) {
          // 배열 처리 (간단한 구현)
          frontmatter[key] = value.slice(1, -1).split(',').map(v => v.trim().replace(/"/g, ''));
        } else {
          frontmatter[key] = isNaN(value) ? value : Number(value);
        }
      }
    });

    return { frontmatter, content: bodyContent };
  }

  /**
   * 키워드 밀도 계산
   */
  calculateKeywordDensity(content, keyword) {
    const cleanContent = StringUtils.stripMarkdown(content).toLowerCase();
    const words = cleanContent.split(/\s+/).filter(word => word.length > 0);
    const keywordCount = cleanContent.split(keyword.toLowerCase()).length - 1;
    
    return words.length > 0 ? (keywordCount / words.length) * 100 : 0;
  }

  /**
   * 제목 SEO 최적화
   */
  optimizeTitle(title, mainKeyword, rules) {
    let optimizedTitle = title;
    
    // 키워드가 제목에 포함되어 있는지 확인
    if (!title.toLowerCase().includes(mainKeyword.toLowerCase())) {
      // 키워드를 제목 앞에 추가
      optimizedTitle = `${mainKeyword}: ${title}`;
    }

    // 길이 최적화
    if (optimizedTitle.length > rules.title.maxLength) {
      optimizedTitle = optimizedTitle.substring(0, rules.title.maxLength - 3) + '...';
    }

    // 년도 추가 (트렌드성 콘텐츠인 경우)
    const currentYear = new Date().getFullYear();
    if (!optimizedTitle.includes(currentYear.toString()) && 
        (mainKeyword.includes('트렌드') || mainKeyword.includes('전망'))) {
      optimizedTitle = `${currentYear} ${optimizedTitle}`;
    }

    return optimizedTitle;
  }

  /**
   * 요약문 SEO 최적화
   */
  optimizeExcerpt(excerpt, mainKeyword, content, rules) {
    let optimizedExcerpt = excerpt;

    // 키워드가 요약문에 없으면 추가
    if (!excerpt.toLowerCase().includes(mainKeyword.toLowerCase())) {
      optimizedExcerpt = `${mainKeyword}에 대한 전문적인 분석과 인사이트를 제공합니다. ${excerpt}`;
    }

    // 길이 최적화
    if (optimizedExcerpt.length < rules.excerpt.minLength) {
      // 콘텐츠에서 추가 정보 추출
      const firstParagraph = StringUtils.stripMarkdown(content).split('\n')[0];
      optimizedExcerpt += ` ${firstParagraph.substring(0, 50)}...`;
    }

    if (optimizedExcerpt.length > rules.excerpt.maxLength) {
      optimizedExcerpt = optimizedExcerpt.substring(0, rules.excerpt.maxLength - 3) + '...';
    }

    return optimizedExcerpt;
  }

  /**
   * 콘텐츠 내 헤딩 구조 최적화
   */
  optimizeHeadings(content, mainKeyword) {
    let optimizedContent = content;

    // H1이 없으면 추가
    if (!content.match(/^# /m)) {
      optimizedContent = `# ${mainKeyword} 완전 가이드\n\n${optimizedContent}`;
    }

    // H2 헤딩에 키워드 추가 (일부만)
    const h2Headings = content.match(/^## (.+)$/gm);
    if (h2Headings && h2Headings.length > 0) {
      // 첫 번째 H2에 키워드가 없으면 추가
      const firstH2 = h2Headings[0];
      if (!firstH2.toLowerCase().includes(mainKeyword.toLowerCase())) {
        const newH2 = `## ${mainKeyword}의 핵심 포인트`;
        optimizedContent = optimizedContent.replace(firstH2, newH2);
      }
    }

    return optimizedContent;
  }

  /**
   * 메타 태그 최적화
   */
  optimizeMetaTags(frontmatter, mainKeyword, rules) {
    const optimized = { ...frontmatter };

    // 태그 최적화
    if (!optimized.tags || optimized.tags.length < rules.meta.tags.min) {
      const suggestedTags = [
        mainKeyword,
        '개발',
        '기술',
        '트렌드',
        new Date().getFullYear().toString()
      ];
      optimized.tags = [...(optimized.tags || []), ...suggestedTags]
        .slice(0, rules.meta.tags.max);
    }

    // 카테고리 설정
    if (!optimized.category) {
      if (mainKeyword.includes('AI') || mainKeyword.includes('인공지능')) {
        optimized.category = 'AI/ML';
      } else if (mainKeyword.includes('웹') || mainKeyword.includes('JavaScript')) {
        optimized.category = '웹개발';
      } else {
        optimized.category = '기술';
      }
    }

    // 읽기 시간 업데이트 (콘텐츠 길이 기반)
    if (!optimized.readingTime) {
      optimized.readingTime = DateUtils.calculateReadingTimeKorean(
        frontmatter.content || ''
      );
    }

    return optimized;
  }

  /**
   * 포스트 SEO 분석
   */
  analyzeSEO(frontmatter, content, config) {
    const analysis = {
      score: 0,
      issues: [],
      suggestions: [],
      details: {}
    };

    const mainKeyword = frontmatter.tags?.[0] || 'Unknown';

    // 제목 분석
    const titleLength = frontmatter.title?.length || 0;
    if (titleLength < config.rules.title.minLength) {
      analysis.issues.push('제목이 너무 짧습니다');
    } else if (titleLength > config.rules.title.maxLength) {
      analysis.issues.push('제목이 너무 깁니다');
    } else {
      analysis.score += 20;
    }

    // 요약문 분석
    const excerptLength = frontmatter.excerpt?.length || 0;
    if (excerptLength < config.rules.excerpt.minLength) {
      analysis.issues.push('요약문이 너무 짧습니다');
    } else if (excerptLength > config.rules.excerpt.maxLength) {
      analysis.issues.push('요약문이 너무 깁니다');
    } else {
      analysis.score += 20;
    }

    // 키워드 밀도 분석
    const keywordDensity = this.calculateKeywordDensity(content, mainKeyword);
    analysis.details.keywordDensity = keywordDensity;
    
    if (keywordDensity < config.rules.content.keywordDensity.min) {
      analysis.suggestions.push('키워드 밀도를 높이세요');
    } else if (keywordDensity > config.rules.content.keywordDensity.max) {
      analysis.suggestions.push('키워드 밀도를 낮추세요');
    } else {
      analysis.score += 20;
    }

    // 콘텐츠 길이 분석
    const wordCount = StringUtils.stripMarkdown(content).split(/\s+/).length;
    analysis.details.wordCount = wordCount;
    
    if (wordCount < config.rules.content.minWords) {
      analysis.issues.push('콘텐츠가 너무 짧습니다');
    } else {
      analysis.score += 20;
    }

    // 헤딩 구조 분석
    const hasH1 = /^# /m.test(content);
    const h2Count = (content.match(/^## /gm) || []).length;
    
    if (!hasH1) {
      analysis.issues.push('H1 태그가 없습니다');
    } else if (h2Count < 2) {
      analysis.suggestions.push('H2 태그를 더 추가하세요');
    } else {
      analysis.score += 20;
    }

    return analysis;
  }

  /**
   * 개별 포스트 최적화
   */
  async optimizePost(postInfo, config) {
    await this.logger.info(`포스트 최적화 중: ${postInfo.filename}`);
    
    // 파일 읽기
    const fileContent = await FileUtils.readText(postInfo.filepath);
    const { frontmatter, content } = this.parseMarkdownFile(fileContent);
    
    // SEO 분석
    const seoAnalysis = this.analyzeSEO(frontmatter, content, config);
    
    // 메인 키워드 추출
    const mainKeyword = frontmatter.tags?.[0] || frontmatter.title?.split(' ')[0] || 'Unknown';
    
    // 각 요소 최적화
    const optimizedTitle = this.optimizeTitle(frontmatter.title, mainKeyword, config.rules);
    const optimizedExcerpt = this.optimizeExcerpt(frontmatter.excerpt, mainKeyword, content, config.rules);
    const optimizedContent = this.optimizeHeadings(content, mainKeyword);
    const optimizedMeta = this.optimizeMetaTags(frontmatter, mainKeyword, config.rules);
    
    // 최적화된 frontmatter 생성
    const optimizedFrontmatter = {
      ...optimizedMeta,
      title: optimizedTitle,
      excerpt: optimizedExcerpt
    };

    // 최적화된 파일 내용 생성
    const frontmatterText = Object.entries(optimizedFrontmatter)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}:\n${value.map(v => `  - "${v}"`).join('\n')}`;
        } else {
          return `${key}: "${value}"`;
        }
      })
      .join('\n');

    const optimizedFileContent = `---\n${frontmatterText}\n---\n\n${optimizedContent}`;
    
    // 백업 후 저장
    await FileUtils.backup(postInfo.filepath);
    await FileUtils.writeText(postInfo.filepath, optimizedFileContent);
    
    // 최적화 후 SEO 분석
    const finalAnalysis = this.analyzeSEO(optimizedFrontmatter, optimizedContent, config);
    
    await this.logger.info(`포스트 최적화 완료: ${postInfo.filename}`, {
      beforeScore: seoAnalysis.score,
      afterScore: finalAnalysis.score,
      improvement: finalAnalysis.score - seoAnalysis.score
    });

    return {
      filename: postInfo.filename,
      before: seoAnalysis,
      after: finalAnalysis,
      optimizations: {
        title: optimizedTitle !== frontmatter.title,
        excerpt: optimizedExcerpt !== frontmatter.excerpt,
        content: optimizedContent !== content,
        meta: JSON.stringify(optimizedMeta) !== JSON.stringify(frontmatter)
      }
    };
  }

  /**
   * 메인 실행 함수
   */
  async execute() {
    try {
      await this.logger.info('SEO 최적화 작업 시작');
      
      // 1. 설정 로드
      const config = await this.loadConfig();
      
      // 2. 최근 포스트 찾기
      const recentPosts = await this.findRecentPosts(24);
      
      if (recentPosts.length === 0) {
        await this.logger.warning('최적화할 최근 포스트가 없습니다');
        return { optimized: [], message: '최적화할 포스트가 없습니다' };
      }

      // 3. 각 포스트 최적화
      const results = [];
      for (const post of recentPosts) {
        try {
          const result = await this.optimizePost(post, config);
          results.push(result);
          
          // 포스트 간 간격
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          await this.logger.error(`포스트 최적화 실패: ${post.filename}`, { error: error.message });
        }
      }

      // 4. 전체 결과 정리
      const summary = {
        totalProcessed: results.length,
        totalImprovements: results.reduce((sum, r) => sum + (r.after.score - r.before.score), 0),
        averageScoreAfter: results.length > 0 ? 
          results.reduce((sum, r) => sum + r.after.score, 0) / results.length : 0,
        optimizations: results.reduce((acc, r) => {
          Object.keys(r.optimizations).forEach(key => {
            if (r.optimizations[key]) acc[key] = (acc[key] || 0) + 1;
          });
          return acc;
        }, {})
      };

      const result = {
        success: true,
        summary,
        results,
        metadata: {
          generatedBy: 'optimize-seo.js',
          version: '1.0.0',
          optimizedAt: DateUtils.getNow()
        }
      };

      await this.logger.success('SEO 최적화 완료', {
        processed: results.length,
        averageScore: Math.round(summary.averageScoreAfter),
        totalImprovement: Math.round(summary.totalImprovements)
      });

      return result;

    } catch (error) {
      await this.logger.error('SEO 최적화 실패', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }
}

// 직접 실행시
if (require.main === module) {
  const optimizer = new SEOOptimizer();
  optimizer.execute()
    .then(result => {
      console.log('SEO 최적화 성공:', result.summary?.totalProcessed || 0, '개 포스트');
      process.exit(0);
    })
    .catch(error => {
      console.error('SEO 최적화 실패:', error.message);
      process.exit(1);
    });
}

module.exports = SEOOptimizer;
/**
 * generate-reddit-blog.js
 * Reddit 데이터를 기반으로 AI 블로그 글을 생성하는 스크립트
 */

const Logger = require('./utils/logger');
const FileUtils = require('./utils/file-utils');
const DateUtils = require('./utils/date-utils');
const OpenAIRedditGenerator = require('./apis/openai-reddit-generator');
const EmailNotifier = require('./apis/email-notifier');
const RedditSubredditService = require('./apis/reddit-subreddit');
const path = require('path');

// 환경변수 로드
require('dotenv').config();

class RedditBlogGenerator {
  constructor() {
    this.logger = new Logger('reddit-blog-generator');
    this.outputDir = path.join(__dirname, '../content/posts');
    
    this.redditService = new RedditSubredditService(this.logger);
    this.aiGenerator = new OpenAIRedditGenerator(this.logger);
    this.emailNotifier = new EmailNotifier(this.logger);
  }

  /**
   * 실시간 Reddit 데이터 가져오기
   */
  async loadRedditData() {
    try {
      const config = await this.loadConfig();
      const subreddit = config.selectedSubreddit || 'technology';
      
      await this.logger.info('Reddit에서 실시간 데이터 수집 중...', { subreddit });
      
      // 실시간 Reddit 데이터 가져오기
      const rawData = await this.redditService.getDailyTopPost(subreddit);
      if (!rawData) {
        throw new Error('Reddit 데이터를 가져올 수 없습니다.');
      }
      
      // AI 블로그 생성에 맞는 형태로 데이터 변환
      const data = this.transformToAIFormat(rawData);
      
      await this.logger.info('Reddit 데이터 로드 완료', {
        subreddit: data.aiData.source.subreddit,
        postTitle: data.aiData.original.title.substring(0, 50) + '...',
        commentCount: data.aiData.community.stats.totalComments
      });
      
      return data;
    } catch (error) {
      await this.logger.error('Reddit 데이터 로드 실패', { error: error.message });
      throw error;
    }
  }

  /**
   * Reddit 데이터를 AI 블로그 생성용 형태로 변환
   */
  transformToAIFormat(rawData) {
    return {
      aiData: {
        original: {
          title: rawData.title,
          engagement: {
            upvotes: rawData.upvotes,
            comments: rawData.commentCount
          }
        },
        source: {
          subreddit: rawData.subreddit,
          originalUrl: rawData.url
        },
        community: {
          topComments: rawData.topComments.map(comment => ({
            text: comment.body,
            popularity: comment.upvotes
          })),
          stats: {
            totalComments: rawData.allComments.length
          }
        },
        aiHints: {
          topic_category: rawData.category || 'technology',
          trend_level: rawData.upvotes > 10000 ? 'viral' : 
                      rawData.upvotes > 5000 ? 'very_high' : 'high'
        }
      }
    };
  }

  /**
   * 파일명과 slug 생성 (영어 기반 안전한 파일명)
   */
  generateFilenameAndSlug(title, date, redditData) {
    // 시분까지 포함된 파일명 생성
    const dateTimeStr = DateUtils.getDateTimeForFilename();
    
    // Reddit 소스 기반으로 영어 slug 생성
    const subreddit = redditData.sourceData.subreddit;
    const originalTitle = redditData.sourceData.originalTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // 영어와 숫자만 남김
      .replace(/\s+/g, '-') // 공백을 하이픈으로
      .substring(0, 30); // 길이 제한 (시분 포함으로 줄임)
    
    const slug = `${dateTimeStr}-${subreddit}-${originalTitle}`;
    const filename = `${slug}.md`;
    
    return { filename, slug };
  }

  /**
   * Reddit 설정 로드
   */
  async loadConfig() {
    try {
      const siteConfig = require('../config/site.config.js');
      const contentSources = siteConfig.blogTheme.contentSources;
      
      return {
        selectedSubreddit: contentSources.selectedSubreddit,
        fallbackSubreddits: contentSources.fallbackSubreddits,
        commentLimits: contentSources.commentLimits,
        filterSettings: contentSources.filterSettings,
        availableModels: siteConfig.blogTheme.availableModels,
        promptTemplates: siteConfig.blogTheme.promptTemplates,
        aiPromptSettings: {
          promptTemplate: contentSources.aiSettings.promptTemplate,
          gptModel: contentSources.aiSettings.gptModel,
          targetAudience: contentSources.targetAudience,
          language: "english",
          outputLanguage: contentSources.outputLanguage,
          includeComments: contentSources.aiSettings.includeComments,
          commentAnalysis: contentSources.aiSettings.commentAnalysis
        }
      };
    } catch (error) {
      await this.logger.warning('사이트 설정 로드 실패, 기본값 사용');
      return {
        selectedSubreddit: "technology",
        fallbackSubreddits: ["programming", "webdev"],
        aiPromptSettings: {
          language: 'english',
          outputLanguage: 'korean',
          promptTemplate: 'informative',
          targetAudience: 'general'
        }
      };
    }
  }

  /**
   * 메인 실행 함수
   */
  async execute() {
    const startTime = Date.now();
    await this.logger.info('Reddit 블로그 글 생성 시작');

    try {
      // 1. Reddit 데이터 및 설정 로드
      const redditData = await this.loadRedditData();
      const config = await this.loadConfig();
      
      // 2. AI로 블로그 글 생성
      await this.logger.info('OpenAI로 블로그 글 생성 중...', {
        outputLanguage: config.aiPromptSettings.outputLanguage,
        blogStyle: config.aiPromptSettings.blogStyle
      });
      const blogData = await this.aiGenerator.generateBlogFromReddit(redditData, config);
      
      // 3. 파일명 및 slug 생성
      const { filename, slug } = this.generateFilenameAndSlug(
        blogData.title, 
        blogData.metadata.date, 
        blogData
      );
      const outputPath = path.join(this.outputDir, filename);
      
      // frontmatter에 slug 추가
      blogData.metadata.slug = slug;
      
      // 4. 마크다운 형식으로 포맷팅 (slug가 포함된 상태로)
      const markdownContent = this.aiGenerator.generateMarkdownContent(blogData);
      
      await FileUtils.writeFile(outputPath, markdownContent);
      
      // 5. 생성 정보 저장
      const generationInfo = {
        date: DateUtils.getToday(),
        timestamp: DateUtils.getNow(),
        executionTimeMs: Date.now() - startTime,
        
        // 생성된 블로그 정보
        blog: {
          title: blogData.title,
          filename: filename,
          path: outputPath,
          contentLength: markdownContent.length,
          wordCount: markdownContent.split(/\s+/).length
        },
        
        // 소스 Reddit 정보
        source: {
          subreddit: blogData.sourceData.subreddit,
          originalTitle: blogData.sourceData.originalTitle,
          originalUrl: blogData.sourceData.originalUrl,
          engagement: blogData.sourceData.engagement
        },
        
        // 생성 통계
        stats: {
          aiModel: 'gpt-4',
          promptTokens: 'estimated',
          completionTokens: 'estimated',
          totalCost: 'estimated'
        },
        
        // 메타데이터
        metadata: {
          generatedBy: 'generate-reddit-blog.js',
          version: '1.0.0',
          aiGenerator: 'openai-reddit-generator'
        }
      };

      const infoPath = path.join(__dirname, '../config/blog-generation-info.json');
      await FileUtils.writeJson(infoPath, generationInfo);
      
      await this.logger.success('Reddit 블로그 글 생성 완료', {
        title: blogData.title.substring(0, 50) + '...',
        filename: filename,
        contentLength: markdownContent.length,
        sourceSubreddit: blogData.sourceData.subreddit,
        executionTime: `${Math.round(generationInfo.executionTimeMs / 1000)}초`
      });

      // 6. 완료 알림 이메일 발송
      try {
        await this.logger.info('완료 알림 이메일 발송 중...');
        const emailResult = await this.emailNotifier.sendBlogCreatedNotification(blogData, generationInfo);
        
        await this.logger.success('완료 알림 이메일 발송 성공', {
          recipient: emailResult.recipient,
          messageId: emailResult.messageId
        });
        
        // 이메일 발송 정보를 결과에 추가
        generationInfo.emailNotification = {
          sent: true,
          recipient: emailResult.recipient,
          messageId: emailResult.messageId,
          sentAt: new Date().toISOString()
        };
        
      } catch (emailError) {
        await this.logger.warning('완료 알림 이메일 발송 실패', { 
          error: emailError.message 
        });
        
        // 이메일 실패해도 전체 프로세스는 성공으로 처리
        generationInfo.emailNotification = {
          sent: false,
          error: emailError.message,
          attemptedAt: new Date().toISOString()
        };
      }

      return generationInfo;

    } catch (error) {
      const executionTime = Math.round((Date.now() - startTime) / 1000);
      
      await this.logger.error('Reddit 블로그 글 생성 실패', { 
        error: error.message,
        executionTime: `${executionTime}초`
      });

      // 실패 알림 이메일 발송
      try {
        await this.logger.info('실패 알림 이메일 발송 중...');
        
        // 시도한 단계들 정보 수집
        const attemptedSteps = [
          'Reddit 설정 파일 로드 시도',
          'Reddit 데이터 수집 시도',
          'OpenAI 클라이언트 초기화 시도',
          'AI 블로그 글 생성 시도',
          '마크다운 파일 저장 시도'
        ];

        // 추가 정보 수집 (가능한 경우)
        const additionalInfo = {
          executionTime: `${executionTime}초`,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        };

        // Reddit 데이터가 있다면 포함
        try {
          const redditData = await this.loadRedditData();
          if (redditData && redditData.aiData) {
            additionalInfo.redditData = {
              subreddit: redditData.aiData.source.subreddit,
              originalTitle: redditData.aiData.original.title,
              originalUrl: redditData.aiData.source.originalUrl
            };
          }
        } catch (redditError) {
          // Reddit 데이터 로드도 실패한 경우 무시
          additionalInfo.redditDataError = 'Reddit 데이터 로드 실패';
        }

        const emailResult = await this.emailNotifier.sendBlogFailureNotification(
          error, 
          attemptedSteps, 
          additionalInfo
        );
        
        await this.logger.success('실패 알림 이메일 발송 성공', {
          recipient: emailResult.recipient,
          messageId: emailResult.messageId,
          errorType: error.name || 'Unknown Error'
        });
        
      } catch (emailError) {
        await this.logger.warning('실패 알림 이메일 발송 실패', { 
          originalError: error.message,
          emailError: emailError.message 
        });
      }

      throw error;
    }
  }

  /**
   * 최근 생성된 블로그 글 정보 조회
   */
  async getLastGenerationInfo() {
    try {
      const infoPath = path.join(__dirname, '../config/blog-generation-info.json');
      return await FileUtils.readJson(infoPath);
    } catch (error) {
      await this.logger.warning('이전 생성 정보를 찾을 수 없음');
      return null;
    }
  }

  /**
   * 생성된 블로그 글 미리보기
   */
  async previewLastGenerated() {
    try {
      const info = await this.getLastGenerationInfo();
      if (!info) {
        throw new Error('생성된 블로그 글이 없습니다.');
      }

      const content = await FileUtils.readFile(info.blog.path);
      const preview = content.substring(0, 500) + '...';

      await this.logger.info('마지막 생성 블로그 미리보기', {
        title: info.blog.title,
        filename: info.blog.filename,
        preview: preview
      });

      return { info, preview, fullContent: content };
    } catch (error) {
      await this.logger.error('블로그 미리보기 실패', { error: error.message });
      throw error;
    }
  }
}

// 직접 실행시
if (require.main === module) {
  const generator = new RedditBlogGenerator();
  generator.execute()
    .then(result => {
      console.log('Reddit 블로그 글 생성 성공:', {
        title: result.blog.title.substring(0, 50) + '...',
        filename: result.blog.filename,
        subreddit: result.source.subreddit
      });
      process.exit(0);
    })
    .catch(error => {
      console.error('Reddit 블로그 글 생성 실패:', error.message);
      process.exit(1);
    });
}

module.exports = RedditBlogGenerator;
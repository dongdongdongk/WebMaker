/**
 * openai-reddit-generator-refactored.js
 * 리팩토링된 Reddit 데이터 기반 블로그 생성 메인 클래스
 */

const UnsplashImageService = require('./unsplash-image-service');
const ContentGenerator = require('./content-generator');
const MetadataGenerator = require('./metadata-generator');
const OpenAIModelConfig = require('./openai-model-config');
const siteConfig = require('../../config/site.config.js');

class OpenAIRedditGeneratorRefactored {
  constructor(logger) {
    this.logger = logger;
    
    // 의존성 주입
    this.imageService = new UnsplashImageService(logger);
    this.contentGenerator = new ContentGenerator(logger);
    this.metadataGenerator = new MetadataGenerator();
    this.modelConfig = new OpenAIModelConfig();
  }

  /**
   * Reddit 데이터를 바탕으로 블로그 글 생성
   */
  async generateBlogFromReddit(redditData, config = null) {
    if (!redditData || !redditData.aiData) {
      throw new Error('Valid Reddit data is required.');
    }

    await this.logger?.info('Starting blog generation from Reddit data');

    try {
      const { aiData } = redditData;
      
      // 설정 로드 (siteConfig에서 가져오기)
      const settings = this.loadSettings(config);
      const templateConfig = this.loadTemplateConfig(settings.promptTemplate);
      const modelConfig = this.loadModelConfig(settings.gptModel, config?.availableModels);

      await this.logger?.info('사용할 모델 설정', {
        model: modelConfig.model,
        maxTokens: modelConfig.max_tokens,
        promptTemplate: settings.promptTemplate
      });
      
      // 1. 블로그 제목 생성
      const title = await this.contentGenerator.generateTitle(aiData, settings, templateConfig, modelConfig);
      
      // 2. 이미지 검색 (2개 서로 다른 키워드로)
      await this.logger?.info('관련 이미지 검색 중...');
      const allImages = await this.imageService.getTwoDistinctImages(title);
      
      // 3. 메인 콘텐츠 생성 (2개 이미지 정보 포함)
      const contentResult = await this.contentGenerator.generateContent(
        aiData, title, settings, templateConfig, modelConfig, allImages
      );
      const content = contentResult.content;
      const tokenUsage = contentResult.tokenUsage;
      
      // 4. 메타데이터 생성 (첫 번째 이미지를 메인 이미지로 사용)
      const metadata = this.metadataGenerator.generateMetadata(aiData, title, settings, allImages[0]);

      const result = {
        title,
        content,
        metadata,
        mainImage: allImages[0],
        sourceData: {
          subreddit: aiData.source.subreddit,
          originalTitle: aiData.original.title,
          originalUrl: aiData.source.originalUrl,
          commentCount: aiData.community.stats.totalComments,
          engagement: aiData.original.engagement
        },
        generatedAt: new Date().toISOString(),
        promptTemplate: settings.promptTemplate,
        imagesAdded: allImages.length,
        tokenUsage: tokenUsage
      };

      await this.logger?.success('블로그 글 생성 완료', {
        title: title.substring(0, 50) + '...',
        contentLength: content.length,
        sourceSubreddit: aiData.source.subreddit,
        promptTemplate: settings.promptTemplate,
        tokenUsage: {
          prompt_tokens: tokenUsage.prompt_tokens,
          completion_tokens: tokenUsage.completion_tokens,
          total_tokens: tokenUsage.total_tokens
        }
      });

      return result;

    } catch (error) {
      await this.logger?.error('블로그 글 생성 실패', { error: error.message });
      throw error;
    }
  }

  /**
   * 설정 로드 (siteConfig 우선)
   */
  loadSettings(config = null) {
    const siteAiSettings = siteConfig?.blogTheme?.contentSources?.aiSettings || {};
    
    return {
      language: 'english',
      outputLanguage: siteAiSettings.outputLanguage || 'korean',
      promptTemplate: siteAiSettings.promptTemplate || 'informative',
      targetAudience: siteConfig?.blogTheme?.contentSources?.targetAudience || 'general',
      gptModel: siteAiSettings.gptModel || 'gpt-4',
      includeComments: siteAiSettings.includeComments !== false,
      commentAnalysis: siteAiSettings.commentAnalysis !== false,
      ...config?.aiPromptSettings // 외부 설정으로 오버라이드 가능
    };
  }

  /**
   * 템플릿 설정 로드
   */
  loadTemplateConfig(templateName) {
    const templates = siteConfig?.blogTheme?.promptTemplates || {};
    return templates[templateName] || { blogStyle: 'informative', tone: 'professional' };
  }

  /**
   * 모델 설정 로드
   */
  loadModelConfig(modelName, availableModels = null) {
    const configModels = availableModels || siteConfig?.blogTheme?.availableModels;
    return this.modelConfig.getModelConfig(modelName, configModels);
  }

  /**
   * 완성된 마크다운 콘텐츠 생성
   */
  generateMarkdownContent(result) {
    return this.metadataGenerator.generateMarkdownContent(result.metadata, result.content);
  }

  /**
   * 파일명 생성
   */
  generateFilename(result) {
    return `${result.metadata.slug}.md`;
  }

  /**
   * 워드 카운트 계산
   */
  calculateWordCount(content) {
    // 한국어와 영어 단어를 모두 고려한 카운트
    const koreanWords = (content.match(/[가-힣]+/g) || []).join('').length;
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    const numbers = (content.match(/\d+/g) || []).length;
    
    return Math.max(koreanWords + englishWords + numbers, content.split(/\s+/).length);
  }
}

module.exports = OpenAIRedditGeneratorRefactored;
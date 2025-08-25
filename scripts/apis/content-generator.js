/**
 * content-generator.js
 * OpenAI를 사용한 실제 콘텐츠 생성 로직
 */

const OpenAI = require('openai');
const OpenAIModelConfig = require('./openai-model-config');
const PromptTemplateManager = require('./prompt-template-manager');

class ContentGenerator {
  constructor(logger) {
    this.logger = logger;
    this.client = null;
    this.modelConfig = new OpenAIModelConfig();
    this.promptManager = new PromptTemplateManager();
    
    this.initializeClient();
  }

  /**
   * OpenAI 클라이언트 초기화
   */
  initializeClient() {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
      }
      
      this.client = new OpenAI({ apiKey });
      this.logger?.info('OpenAI 클라이언트 초기화 완료');
    } catch (error) {
      this.logger?.error('OpenAI 클라이언트 초기화 실패', { error: error.message });
      throw error;
    }
  }

  /**
   * 블로그 제목 생성
   */
  async generateTitle(aiData, settings, templateConfig, modelConfig) {
    const outputLang = settings.outputLanguage === 'korean' ? 'Korean' : 'English';
    const originalTitle = aiData.original.title;
    
    const prompt = `
Create a catchy, SEO-optimized blog title in ${outputLang} based on this topic: "${originalTitle}"

Requirements:
- Write entirely in ${outputLang}
- Make it engaging and clickable
- Include relevant keywords naturally
- Keep it under 60 characters for SEO
- Style: ${templateConfig.blogStyle}
- Make it appealing to ${outputLang === 'Korean' ? 'Korean readers' : 'English-speaking readers'}

Generate only the title, nothing else.`;

    const response = await this.client.chat.completions.create({
      model: modelConfig.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: modelConfig.temperature,
      max_tokens: 100
    });

    return response.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
  }

  /**
   * 메인 콘텐츠 생성
   */
  async generateContent(aiData, title, settings, templateConfig, modelConfig, availableImages = []) {
    const outputLang = settings.outputLanguage === 'korean' ? 'Korean' : 'English';
    const audience = outputLang === 'Korean' ? 'Korean readers' : 'English-speaking readers';
    const templateName = settings.promptTemplate || 'informative';
    
    // 인기 댓글들을 문맥으로 활용
    const topComments = aiData.community.topComments.slice(0, 5);
    const naturalInsights = topComments.map((comment, index) => 
      `"${comment.text.substring(0, 150)}..."`
    ).join('\n');

    // 사용 가능한 이미지 정보
    const imageInfo = availableImages.length > 0 ? 
      availableImages.map((img, index) => 
        `Image ${index + 1}: ![${img.alt}](${img.url}) - ${img.keyword || 'related'}`
      ).join('\n') : 
      'No specific images available';

    let prompt;
    
    // Summary 템플릿을 위한 특별한 프롬프트
    if (templateName === 'summary') {
      prompt = this.promptManager.createSummaryPrompt(
        aiData, title, settings, templateConfig, imageInfo, naturalInsights, outputLang, audience
      );
    } else {
      // 기존 템플릿들을 위한 상세 프롬프트
      prompt = this.promptManager.createDetailedPrompt(
        aiData, title, settings, templateConfig, imageInfo, naturalInsights, outputLang, audience
      );
    }

    // 템플릿에 맞는 시스템 프롬프트 사용
    const systemPrompt = this.modelConfig.getSystemPromptByTemplate(templateName, settings.outputLanguage);

    const response = await this.client.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.max_tokens
    });

    // 토큰 사용량 정보 저장 (응답에 포함)
    const tokenUsage = {
      prompt_tokens: response.usage?.prompt_tokens || 0,
      completion_tokens: response.usage?.completion_tokens || 0,
      total_tokens: response.usage?.total_tokens || 0
    };

    const rawContent = response.choices[0].message.content.trim();
    
    // AI가 생성한 태그 추출
    const { content, tags } = this.extractTagsFromContent(rawContent);
    
    // 토큰 정보와 태그를 content와 함께 반환
    return {
      content: content,
      tags: tags,
      tokenUsage: tokenUsage
    };
  }

  /**
   * AI 응답에서 태그 추출
   */
  extractTagsFromContent(rawContent) {
    const tagRegex = /===TAGS===([\s\S]*?)===TAGS===/;
    const match = rawContent.match(tagRegex);
    
    let tags = [];
    let content = rawContent;
    
    if (match) {
      // 태그 섹션 발견
      const tagSection = match[1].trim();
      tags = tagSection
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 4); // 최대 4개로 제한
      
      // 태그 섹션 제거
      content = rawContent.replace(tagRegex, '').trim();
    }
    
    return { content, tags };
  }
}

module.exports = ContentGenerator;
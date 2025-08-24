/**
 * openai-model-config.js
 * OpenAI 모델 설정과 시스템 프롬프트 관리
 */

class OpenAIModelConfig {
  constructor() {
    this.defaultConfig = {
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0.3,
      presence_penalty: 0.3
    };
  }

  /**
   * 모델별 최적화된 설정 가져오기
   */
  getModelConfig(modelName, availableModels = null) {
    const modelConfigs = {
      'gpt-3.5-turbo': {
        model: 'gpt-3.5-turbo',
        temperature: 0.8,
        max_tokens: 4000,
        top_p: 1,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      },
      'gpt-4': {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 6000,
        top_p: 1,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      },
      'gpt-4-turbo': {
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        max_tokens: 8000,
        top_p: 1,
        frequency_penalty: 0.2,
        presence_penalty: 0.2
      },
      'gpt-4o': {
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 8000,
        top_p: 1,
        frequency_penalty: 0.2,
        presence_penalty: 0.2
      }
    };

    // 설정 파일에서 모델 정보 확인
    if (availableModels && availableModels[modelName]) {
      const modelInfo = availableModels[modelName];
      const baseConfig = modelConfigs[modelName] || this.defaultConfig;
      
      return {
        ...baseConfig,
        maxTokens: modelInfo.maxTokens || baseConfig.max_tokens,
        costPerToken: modelInfo.costPerToken || 'unknown',
        speed: modelInfo.speed || 'unknown'
      };
    }

    return modelConfigs[modelName] || this.defaultConfig;
  }

  /**
   * 템플릿별 시스템 프롬프트 생성
   */
  getSystemPromptByTemplate(templateName, outputLanguage = 'korean') {
    const language = outputLanguage === 'korean' ? '한국어' : 'English';
    const basePrompt = `You are a professional blog writer creating content in ${language}.`;

    const templatePrompts = {
      informative: `${basePrompt} Write informative, well-structured articles with comprehensive coverage and SEO optimization. Focus on accuracy, depth, and practical value for readers.`,
      
      engaging: `${basePrompt} Write engaging, story-driven content that connects emotionally with readers. Use compelling narratives, relatable examples, and conversational tone while maintaining informational value.`,
      
      analytical: `${basePrompt} Write analytical, research-based content with data-driven insights. Focus on objective analysis, statistical evidence, and logical conclusions.`,
      
      technical: `${basePrompt} Write technical, detailed content for expert audiences. Include specifications, implementation details, and industry-specific terminology with precise explanations.`,
      
      casual: `${basePrompt} Write in a casual, friendly tone as if talking to a friend. Use simple language, personal anecdotes, and approachable explanations.`,
      
      summary: `${basePrompt} Write simple, easy-to-understand summaries that anyone can quickly read and comprehend. Use everyday language, avoid jargon, and focus only on essential information.`
    };

    return templatePrompts[templateName] || templatePrompts.informative;
  }
}

module.exports = OpenAIModelConfig;
/**
 * openai-reddit-generator.js
 * Reddit 데이터를 기반으로 OpenAI로 블로그 글을 생성하는 모듈
 */

const OpenAI = require('openai');
const UnsplashImageService = require('./unsplash-image-service');
const DateUtils = require('../utils/date-utils');
const siteConfig = require('../../config/site.config.js');

class OpenAIRedditGenerator {
  constructor(logger) {
    this.logger = logger;
    
    // OpenAI 클라이언트 초기화
    this.client = null;
    this.initializeClient();

    // Unsplash 이미지 서비스 초기화
    this.imageService = new UnsplashImageService(logger);
    
    // 생성 설정 (기본값)
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
      
      // 모델의 maxTokens 정보를 반영
      if (modelInfo.maxTokens && typeof modelInfo.maxTokens === 'number') {
        baseConfig.max_tokens = Math.min(baseConfig.max_tokens, Math.floor(modelInfo.maxTokens * 0.8));
      }
      
      return baseConfig;
    }

    return modelConfigs[modelName] || this.defaultConfig;
  }

  /**
   * OpenAI 클라이언트 초기화
   */
  initializeClient() {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다.');
      }

      this.client = new OpenAI({
        apiKey: apiKey
      });

      this.logger?.info('OpenAI 클라이언트 초기화 완료');
    } catch (error) {
      this.logger?.error('OpenAI 클라이언트 초기화 실패', { error: error.message });
      throw error;
    }
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
      
      // 설정 로드 (기본값 설정)
      const settings = config?.aiPromptSettings || {
        language: 'english',
        outputLanguage: 'korean',
        promptTemplate: 'informative',
        targetAudience: 'general'
      };

      // 프롬프트 템플릿 설정 로드
      const templateName = settings.promptTemplate || 'informative';
      const templateConfig = config?.promptTemplates?.[templateName] || {
        blogStyle: 'informative',
        tone: 'professional'
      };

      // GPT 모델 설정 로드
      const selectedModel = settings.gptModel || 'gpt-4';
      const modelConfig = this.getModelConfig(selectedModel, config?.availableModels);
      
      await this.logger?.info('사용할 모델 설정', {
        model: modelConfig.model,
        maxTokens: modelConfig.max_tokens,
        promptTemplate: templateName
      });
      
      // 1. 블로그 제목 생성
      const title = await this.generateTitle(aiData, settings, templateConfig, modelConfig);
      
      // 2. 이미지 검색 (2개 서로 다른 키워드로)
      await this.logger?.info('관련 이미지 검색 중...');
      const allImages = await this.imageService.getTwoDistinctImages(title);
      
      // 3. 메인 콘텐츠 생성 (2개 이미지 정보 포함)
      const contentResult = await this.generateContent(aiData, title, settings, templateConfig, modelConfig, allImages);
      const content = contentResult.content;
      const tokenUsage = contentResult.tokenUsage;
      
      // 4. 메타데이터 생성 (첫 번째 이미지를 메인 이미지로 사용)
      const metadata = this.generateMetadata(aiData, title, settings, allImages[0]);

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
        promptTemplate: templateName,
        imagesAdded: allImages.length,
        tokenUsage: tokenUsage
      };

      await this.logger?.success('블로그 글 생성 완료', {
        title: title.substring(0, 50) + '...',
        contentLength: content.length,
        sourceSubreddit: aiData.source.subreddit,
        promptTemplate: templateName,
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
   * 블로그 제목 생성
   */
  async generateTitle(aiData, settings, templateConfig, modelConfig) {
    const outputLang = settings.outputLanguage === 'korean' ? 'Korean' : 'English';
    const template = templateConfig || { blogStyle: 'informative', tone: 'professional' };
    
    const prompt = `
Generate a compelling blog title based on a trending topic from Reddit's r/${aiData.source.subreddit}.

Original post title: "${aiData.original.title}"
Subreddit category: ${aiData.aiHints.topic_category}
Engagement level: ${aiData.aiHints.trend_level}
Writing style: ${template.blogStyle}
Tone: ${template.tone}

Requirements:
1. Write in ${outputLang}
2. Create an engaging, clickable title that matches the ${template.blogStyle} style
3. Include SEO-friendly keywords
4. Keep it 20-40 characters for Korean, 40-80 characters for English
5. Style-specific guidance:
   - Informative: Use numbered lists (e.g., "5 Ways to...", "10 Tips for...")
   - Engaging: Use emotional hooks and storytelling elements
   - Analytical: Focus on data, insights, and analysis
   - Technical: Emphasize technical aspects and specifications
   - Casual: Use friendly, approachable language

Return only the blog title.`;

    const systemPrompt = this.getSystemPromptByTemplate(settings.promptTemplate || 'informative', settings.outputLanguage);

    const response = await this.client.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: systemPrompt + ' You specialize in creating engaging, SEO-optimized titles that match specific writing styles.' },
        { role: 'user', content: prompt }
      ],
      temperature: modelConfig.temperature,
      max_tokens: 100
    });

    return response.choices[0].message.content.trim().replace(/["']/g, '');
  }

  /**
   * 프롬프트 템플릿에 따른 시스템 프롬프트 생성
   */
  getSystemPromptByTemplate(templateName, outputLanguage) {
    const templates = {
      informative: {
        korean: 'You are a creative technology blogger who writes engaging, informative content for Korean readers. Break away from formulaic structures and write with personality. Use unique angles, creative section titles, and natural flow. Make each article feel fresh and original while maintaining professional quality.',
        english: 'You are a creative technology blogger who writes engaging, informative content. Break away from formulaic structures and write with personality. Use unique angles, creative section titles, and natural flow. Make each article feel fresh and original while maintaining professional quality.'
      },
      engaging: {
        korean: 'You are a charismatic storyteller and technology blogger who creates compelling, original narratives for Korean readers. Use creative storytelling techniques, unique perspectives, and varied structures. Each article should feel like a completely different reading experience with its own personality and voice.',
        english: 'You are a charismatic storyteller and technology blogger who creates compelling, original narratives. Use creative storytelling techniques, unique perspectives, and varied structures. Each article should feel like a completely different reading experience with its own personality and voice.'
      },
      analytical: {
        korean: 'You are an insightful technology analyst who provides deep, original analysis for Korean readers. Use creative analytical approaches, unique frameworks, and non-standard structures. Present data and insights in fresh, engaging ways that avoid repetitive patterns.',
        english: 'You are an insightful technology analyst who provides deep, original analysis. Use creative analytical approaches, unique frameworks, and non-standard structures. Present data and insights in fresh, engaging ways that avoid repetitive patterns.'
      },
      technical: {
        korean: 'You are a senior technology expert who explains complex concepts in creative, accessible ways for Korean readers. Use innovative explanation methods, unique analogies, and varied article structures. Make technical content engaging and original.',
        english: 'You are a senior technology expert who explains complex concepts in creative, accessible ways. Use innovative explanation methods, unique analogies, and varied article structures. Make technical content engaging and original.'
      },
      casual: {
        korean: 'You are a friendly technology enthusiast who writes with authentic personality for Korean readers. Use conversational style with creative twists, unique perspectives, and natural flow. Make each article feel like a personal conversation with a knowledgeable friend.',
        english: 'You are a friendly technology enthusiast who writes with authentic personality. Use conversational style with creative twists, unique perspectives, and natural flow. Make each article feel like a personal conversation with a knowledgeable friend.'
      }
    };

    const langKey = outputLanguage === 'korean' ? 'korean' : 'english';
    return templates[templateName]?.[langKey] || templates.informative[langKey];
  }

  /**
   * 프롬프트 템플릿에 따른 작성 지침 생성
   */
  getWritingGuidelinesByTemplate(templateName) {
    const guidelines = {
      informative: {
        structure: [
          'SEO-optimized introduction with comprehensive problem definition and search intent (400+ words)',
          'Historical context and background analysis (300+ words)',
          'Current market situation with detailed statistics and data (400+ words)',
          'Comprehensive analysis of 8-12 main factors/causes/solutions (200-300 words each)',
          'Multiple expert perspectives and detailed case studies (400+ words)',
          'Technical deep-dive with implementation details (300+ words)',
          'Practical implications for businesses and individuals with examples (400+ words)',
          'Challenges and limitations analysis (300+ words)',
          'Future outlook with detailed predictions and trends (400+ words)',
          'FAQ section addressing 8-10 comprehensive questions (300+ words)',
          'Actionable conclusion with detailed next steps and resources (300+ words)'
        ],
        tone: 'Professional, authoritative, comprehensive, and search-engine friendly',
        features: [
          'Include comprehensive keyword coverage for SEO with natural integration',
          'Use extensive data-driven insights, statistics, and research findings',
          'Provide detailed step-by-step guides and comprehensive frameworks',
          'Add extensive FAQ sections to capture long-tail searches',
          'Include multiple real-world examples, case studies, and success stories',
          'Structure content for featured snippets and rich results',
          'Use semantic keywords and related terms naturally throughout',
          'Create highly scannable content with detailed headers, subheaders, and organized lists',
          'Provide in-depth analysis that goes beyond surface-level information',
          'Include expert quotes, industry insights, and authoritative sources'
        ]
      },
      engaging: {
        structure: [
          'Compelling hook opening with detailed story or thought-provoking question (400+ words)',
          'Personal anecdotes and multiple relatable examples with depth (300+ words)',
          'Detailed emotional journey through the topic with context (400+ words)',
          'Multiple interactive elements and comprehensive reader engagement (300+ words)',
          'In-depth analysis with storytelling approach (400+ words each section, 6-8 sections)',
          'Real-world applications with detailed scenarios (400+ words)',
          'Community insights and shared experiences (300+ words)',
          'Comprehensive practical advice with examples (400+ words)',
          'Inspiring conclusion with detailed call-to-action and resources (300+ words)'
        ],
        tone: 'Conversational yet comprehensive, enthusiastic, and deeply relatable',
        features: [
          'Use extensive storytelling techniques, metaphors, and narrative structures',
          'Include detailed personal perspectives and comprehensive experiences',
          'Ask thoughtful rhetorical questions to deeply engage readers',
          'Use vivid descriptions, emotional language, and rich sensory details',
          'Provide comprehensive coverage while maintaining engaging tone',
          'Include multiple viewpoints and community perspectives',
          'Create detailed scenarios and relatable situations',
          'Balance entertainment with substantial informational value'
        ]
      },
      analytical: {
        structure: [
          'Research-based introduction with context',
          'Data analysis and statistical insights',
          'Comparative analysis and benchmarking',
          'Trend identification and future implications',
          'Evidence-backed conclusions and recommendations'
        ],
        tone: 'Academic, thoughtful, and research-oriented',
        features: [
          'Include charts, graphs, and data visualizations concepts',
          'Reference multiple sources and studies',
          'Provide in-depth analysis and interpretations',
          'Focus on objective, evidence-based conclusions'
        ]
      },
      technical: {
        structure: [
          'Technical overview with specifications',
          'Detailed implementation explanations',
          'Code examples and technical demonstrations',
          'Best practices and optimization tips',
          'Technical recommendations and next steps'
        ],
        tone: 'Expert, precise, and technically authoritative',
        features: [
          'Use technical terminology appropriately',
          'Provide detailed explanations of processes',
          'Include practical examples and use cases',
          'Focus on technical accuracy and depth'
        ]
      },
      casual: {
        structure: [
          'Friendly greeting and casual introduction',
          'Easy-to-follow explanations with analogies',
          'Personal thoughts and casual observations',
          'Practical tips in conversational style',
          'Warm conclusion with friendly advice'
        ],
        tone: 'Friendly, approachable, and conversational',
        features: [
          'Use simple language and avoid jargon',
          'Include personal anecdotes and humor when appropriate',
          'Write as if talking to a friend',
          'Focus on accessibility and ease of understanding'
        ]
      },
      summary: {
        structure: [
          '핵심 내용을 한눈에 파악할 수 있는 간단한 소개 (150-200 words)',
          '가장 중요한 3-4가지 핵심 포인트를 쉬운 용어로 설명 (각 150-200 words)',
          '복잡한 개념을 일상 용어와 비유로 쉽게 풀어내기 (200 words)',
          '실생활에 어떤 영향을 미치는지 간단 정리 (150 words)',
          '3줄 요약으로 마무리 (100-150 words)'
        ],
        tone: 'Simple, clear, and easy-to-understand',
        features: [
          'Replace technical terms with everyday language',
          'Use analogies and metaphors for complex concepts',
          'Focus only on the most essential information',
          'Write in short, clear sentences',
          'Avoid unnecessary details and tangents',
          'Include practical, real-world examples',
          'Structure content for quick comprehension',
          'End with a genuine 3-line summary of key takeaways'
        ]
      }
    };

    return guidelines[templateName] || guidelines.informative;
  }

  /**
   * 메인 콘텐츠 생성
   */
  async generateContent(aiData, title, settings, templateConfig, modelConfig, availableImages = []) {
    const outputLang = settings.outputLanguage === 'korean' ? 'Korean' : 'English';
    const audience = outputLang === 'Korean' ? 'Korean readers' : 'English-speaking readers';
    const templateName = settings.promptTemplate || 'informative';
    const template = templateConfig || { blogStyle: 'informative', tone: 'professional' };
    
    // 인기 댓글들을 문맥으로 활용
    const topComments = aiData.community.topComments.slice(0, 5);
    const commentContext = topComments.map((comment, index) => 
      `Comment ${index + 1} (${comment.popularity} upvotes): ${comment.text.substring(0, 200)}...`
    ).join('\n\n');

    // 템플릿별 작성 지침 가져오기
    const guidelines = this.getWritingGuidelinesByTemplate(templateName);

    // 커뮤니티 인사이트를 자연스럽게 변환
    const naturalInsights = topComments.map(comment => {
      // Reddit 작성자 언급 제거, 인사이트만 추출
      return `"${comment.text.substring(0, 150)}..."`;
    }).join('\n');

    // 사용 가능한 이미지 정보
    const imageInfo = availableImages.length > 0 ? 
      availableImages.map((img, index) => 
        `Image ${index + 1}: ![${img.alt}](${img.url}) - ${img.keyword || 'related'}`
      ).join('\n') : 
      'No specific images available';

    // Summary 템플릿을 위한 특별한 프롬프트
    if (templateName === 'summary') {
      const prompt = `
Create a simple, easy-to-understand summary blog post about: ${aiData.original.title}

Target: ${audience} (especially beginners and non-experts)
Language: ${outputLang} 
Length: Write a short 400-600 word article that focuses on clarity and simplicity
Style: ${template.blogStyle}

Expert Insights to Include (simplified):
${naturalInsights}

Available Images:
${imageInfo}

핵심 요구사항:
1. Write entirely in ${outputLang}
2. Create 400-600 word easy-to-understand article
3. Replace all technical terms with everyday language
4. Use analogies and metaphors to explain complex concepts
5. Focus ONLY on the most essential information
6. Write in short, clear sentences
7. Include ONE content image (second image) in a relevant section
8. End with genuine 3-line summary of key takeaways

쉬운 요약형 구조:
- 한눈에 파악할 수 있는 간단한 소개 (80-100단어)
- 가장 중요한 2-3가지 핵심 포인트를 쉬운 용어로 설명 (각 80-120단어)
- 실생활에 어떤 영향을 미치는지 간단 정리 (80-100단어)
- 3줄 요약으로 마무리 (50-80단어)

Writing Guidelines:
- 중학생도 이해할 수 있는 수준으로 작성 (스낵처럼 가볍게)
- 전문 용어는 반드시 쉬운 말로 바꿔서 설명
- 친근하고 재미있는 예시와 비유를 사용
- 불필요한 세부사항은 모두 생략
- 핵심만 간단명료하게 전달 (스낵 컨텐츠처럼)
- 읽기 쉽고 부담 없는 스타일
- 마지막에 정말 중요한 내용 3줄로 요약

Write a simple, snack-like blog post that anyone can quickly read and understand, focusing only on the most important points.`;

      const systemPrompt = this.getSystemPromptByTemplate(templateName, settings.outputLanguage);

      const response = await this.client.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens
      });

      const tokenUsage = {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0
      };

      const content = response.choices[0].message.content.trim();
      
      return {
        content: content,
        tokenUsage: tokenUsage
      };
    }

    // 기존 템플릿들을 위한 프롬프트
    const prompt = `
Create a comprehensive, in-depth blog post about: ${aiData.original.title}

Target: ${audience}
Language: ${outputLang} 
Length: Write a substantial 2000-3000 word detailed article with comprehensive coverage
Style: ${template.blogStyle}

Expert Insights to Include:
${naturalInsights}

Available Images:
${imageInfo}

Critical Requirements:
1. Write entirely in ${outputLang}
2. Create a minimum 2000-word comprehensive article
3. Include detailed analysis, multiple perspectives, and practical insights
4. Present as expert knowledge (no Reddit references)
5. Professional, authoritative tone with personality
6. Clear structure with 8-12 substantial sections
7. Include ONE content image (second image) in a relevant section
8. Each section should be 200-400 words with rich detail

Enhanced Structure Requirements:
- Create 8-12 substantial main sections (not just 5-8)
- Each section should have 3-5 paragraphs minimum
- Include detailed explanations, examples, and context in every section
- Add subsections where appropriate for complex topics
- Use creative, engaging section titles that relate to the content
- Organize information in the most compelling way for readers
- Consider multiple approaches: storytelling, problem-solving, step-by-step analysis, comparisons

Content Depth Requirements:
- Provide historical context and background information
- Include multiple viewpoints and expert perspectives
- Add detailed examples, case studies, and real-world applications
- Explain the 'why' behind every major point
- Include implications, consequences, and future outlook
- Add practical tips, actionable advice, and implementation strategies
- Cover potential challenges, limitations, and alternative approaches

Writing Style Enhancement:
- **Deep Analysis**: Go beyond surface-level information
- **Multiple Perspectives**: Present different viewpoints and expert opinions
- **Rich Context**: Provide background, history, and broader implications
- **Practical Application**: Include how readers can apply this information
- **Future Implications**: Discuss trends, predictions, and what's next
- **Detailed Examples**: Use specific, relevant examples to illustrate points
- **Technical Depth**: Explain complex concepts in accessible but thorough ways

Format and Flow:
- Start with a compelling introduction that sets up the entire article
- Create unique, descriptive section headers that promise value
- Use varied paragraph lengths but ensure each paragraph is substantial
- Include ONE content image where it naturally enhances understanding
- Mix content types: detailed analysis, lists, examples, scenarios, quotes
- Write with authority and personality, making complex topics engaging
- End with a comprehensive conclusion that ties everything together
- Ensure smooth transitions between sections for natural flow

Write a comprehensive, authoritative blog post that provides exceptional value to readers through depth, insight, and practical application. This should be a definitive resource on the topic.`;

    // 템플릿에 맞는 시스템 프롬프트 사용
    const systemPrompt = this.getSystemPromptByTemplate(templateName, settings.outputLanguage);

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

    const content = response.choices[0].message.content.trim();
    
    // 토큰 정보를 content와 함께 반환
    return {
      content: content,
      tokenUsage: tokenUsage
    };
  }

  /**
   * 메타데이터 생성
   */
  generateMetadata(aiData, title, settings, mainImage = null) {
    // 태그 생성
    const tags = [];
    
    // 서브레딧 기반 태그
    tags.push(aiData.source.subreddit);
    tags.push(aiData.aiHints.topic_category);
    
    // 트렌드 레벨 기반 태그
    if (aiData.aiHints.trend_level === 'viral') {
      tags.push('바이럴', '핫토픽');
    }
    
    // 카테고리별 기본 태그
    const categoryTags = {
      technology: ['기술', 'IT', '트렌드'],
      business: ['비즈니스', '스타트업', '마케팅'],
      science: ['과학', '연구', '혁신'],
      lifestyle: ['라이프스타일', '자기계발'],
      food: ['음식', '요리', '레시피']
    };
    
    if (categoryTags[aiData.aiHints.topic_category]) {
      tags.push(...categoryTags[aiData.aiHints.topic_category]);
    }

    return {
      title,
      description: `r/${aiData.source.subreddit}에서 화제가 된 ${title}에 대한 깊이 있는 분석과 인사이트`,
      tags: [...new Set(tags)], // 중복 제거
      category: aiData.aiHints.topic_category,
      readingTime: Math.ceil(title.length / 300), // 대략적인 읽기 시간 (분)
      seo: {
        canonical: null,
        keywords: tags.slice(0, 5).join(', '),
        author: siteConfig.content.defaultAuthor,
        publishDate: new Date().toISOString().split('T')[0]
      },
      source: {
        platform: 'Reddit',
        subreddit: aiData.source.subreddit,
        originalUrl: aiData.source.originalUrl,
        engagement: aiData.original.engagement
      }
    };
  }

  /**
   * 블로그 포스트를 마크다운 파일로 포맷팅
   */
  formatAsMarkdownPost(blogData) {
    const { title, content, metadata, mainImage } = blogData;
    
    // 메인 이미지 URL 결정
    const imageUrl = mainImage?.url || `https://picsum.photos/1200/600?random=${Date.now()}`;
    
    // 현재 시간으로 시분까지 포함된 date 생성
    const currentDateTime = DateUtils.getDateTimeForFrontmatter();
    
    const frontMatter = `---
title: "${title}"
slug: "${metadata.slug || ''}"
date: "${currentDateTime}"
description: "${metadata.description}"
tags: [${metadata.tags.map(tag => `"${tag}"`).join(', ')}]
category: "${metadata.category}"
author: "${siteConfig.content.defaultAuthor}"
image: "${imageUrl}"
source:
  platform: "${metadata.source.platform}"
  subreddit: "${metadata.source.subreddit}"
  url: "${metadata.source.originalUrl}"
  upvotes: ${metadata.source.engagement.upvotes}
  comments: ${metadata.source.engagement.comments}
---

`;

    return frontMatter + content;
  }
}

module.exports = OpenAIRedditGenerator;
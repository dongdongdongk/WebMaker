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
        max_tokens: 2500,
        top_p: 1,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      },
      'gpt-4': {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 3000,
        top_p: 1,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      },
      'gpt-4-turbo': {
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        max_tokens: 4000,
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
      let content = await this.generateContent(aiData, title, settings, templateConfig, modelConfig, allImages);
      
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
        imagesAdded: allImages.length
      };

      await this.logger?.success('블로그 글 생성 완료', {
        title: title.substring(0, 50) + '...',
        contentLength: content.length,
        sourceSubreddit: aiData.source.subreddit,
        promptTemplate: templateName
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
          'SEO-optimized introduction with problem definition and search intent',
          'Current market situation and key statistics',
          'Detailed analysis of 5-7 main factors/causes/solutions',
          'Industry expert insights and case studies',
          'Practical implications for businesses and individuals',
          'Future outlook and predictions',
          'FAQ section addressing common questions',
          'Actionable conclusion with next steps'
        ],
        tone: 'Professional, authoritative, and search-engine friendly',
        features: [
          'Include comprehensive keyword coverage for SEO',
          'Use data-driven insights and industry statistics',
          'Provide step-by-step guides and practical frameworks',
          'Add FAQ sections to capture long-tail searches',
          'Include real-world examples and case studies',
          'Structure content for featured snippets',
          'Use semantic keywords and related terms naturally',
          'Create scannable content with clear headers and lists'
        ]
      },
      engaging: {
        structure: [
          'Hook opening with compelling story or question',
          'Personal anecdotes and relatable examples',
          'Emotional journey through the topic',
          'Interactive elements and reader engagement',
          'Inspiring conclusion with call-to-action'
        ],
        tone: 'Conversational, enthusiastic, and relatable',
        features: [
          'Use storytelling techniques and metaphors',
          'Include personal opinions and experiences',
          'Ask rhetorical questions to engage readers',
          'Use vivid descriptions and emotional language'
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

    const prompt = `
Create a comprehensive blog post about: ${aiData.original.title}

Target: ${audience}
Language: ${outputLang} 
Length: Write a substantial, detailed article (aim for comprehensive coverage)
Style: ${template.blogStyle}

Expert Insights to Include:
${naturalInsights}

Available Images:
${imageInfo}

Requirements:
1. Write entirely in ${outputLang}
2. Create valuable, SEO-optimized content
3. Include detailed analysis and practical insights
4. Present as expert knowledge (no Reddit references)
5. Professional, authoritative tone
6. Clear structure with proper headers
7. Include ONE content image (second image) in a relevant section

Structure Guidelines (Choose your own natural flow):
- Create your own logical structure that fits the topic
- Use creative, engaging section titles that relate to the content
- Organize information in the most compelling way for readers
- Include 5-8 main sections with natural progression
- Make each section title unique and interesting
- Consider different approaches: storytelling, problem-solving, step-by-step analysis, etc.

Writing Style Options (Choose freely based on content):
- **Storytelling**: Start with a compelling story or scenario
- **Question-driven**: Pose intriguing questions and answer them
- **Case study**: Analyze specific examples or situations  
- **Timeline**: Present information chronologically
- **Comparison**: Compare different perspectives or solutions
- **Personal journey**: Write as if sharing insights from experience
- **Problem-solution**: Identify issues and provide solutions
- **Myth-busting**: Challenge common misconceptions

Format Freedom:
- Create unique, catchy section headers
- Use varied paragraph lengths for rhythm
- Include ONE content image where it naturally fits
- Mix different content types: lists, examples, quotes, scenarios
- Write with personality and voice, not just facts
- Make it conversational yet professional

Write an engaging, unique blog post that doesn't feel templated or formulaic.`;

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

    return response.choices[0].message.content.trim();
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
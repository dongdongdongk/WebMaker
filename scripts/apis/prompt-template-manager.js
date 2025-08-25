/**
 * prompt-template-manager.js
 * 프롬프트 템플릿과 작성 지침 관리
 */

class PromptTemplateManager {
  constructor() {
    // 템플릿별 작성 지침
    this.guidelines = {
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
          '핵심 내용을 한눈에 파악할 수 있는 간단한 소개 (80-100 words)',
          '가장 중요한 2-3가지 핵심 포인트를 쉬운 용어로 설명 (각 80-120 words)',
          '실생활에 어떤 영향을 미치는지 간단 정리 (80-100 words)',
          '3줄 요약으로 마무리 (50-80 words)'
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
  }

  /**
   * 템플릿별 작성 지침 가져오기
   */
  getWritingGuidelinesByTemplate(templateName) {
    return this.guidelines[templateName] || this.guidelines.informative;
  }

  /**
   * Summary 템플릿용 특별 프롬프트 생성
   */
  createSummaryPrompt(aiData, title, settings, templateConfig, imageInfo, naturalInsights, outputLang, audience) {
    return `
Create a simple, easy-to-understand summary blog post about: ${aiData.original.title}

Blog Context: This content is from r/${aiData.source.subreddit} - ${aiData.source.description || ''}
IMPORTANT: Make sure the entire blog post stays relevant to the ${aiData.source.subreddit} community theme. Connect the topic to relevant concepts, strategies, tools, or applications within this field whenever possible.

Target: ${audience} (especially beginners and non-experts)
Language: ${outputLang} 
Length: Write a short 400-600 word article that focuses on clarity and simplicity
Style: ${templateConfig.blogStyle}

Expert Insights to Include (simplified):
${naturalInsights}

Available Images:
${imageInfo}

Core Requirements:
1. Write entirely in ${outputLang}
2. Create 400-600 word easy-to-understand article
3. Replace all technical terms with everyday language
4. Use analogies and metaphors to explain complex concepts
5. Focus ONLY on the most essential information
6. Write in short, clear sentences
7. Include ONE content image (second image) in a relevant section
8. End with genuine 3-line summary of key takeaways

Easy Summary Structure:
- Simple introduction that can be understood at a glance (80-100 words)
- Explain 2-3 most important key points in simple terms (80-120 words each)
- Simple summary of how it affects real life (80-100 words)
- Finish with 3-line summary (50-80 words)

Writing Guidelines:
- Write at a level that middle school students can understand (light like a snack)
- Always replace technical terms with easy explanations
- Friendly and interesting tone
- Omit all unnecessary details
- Deliver only the core message clearly and concisely (like snack content)
- Easy-to-read and stress-free style
- Summarize really important content in 3 lines at the end

Write a simple, snack-like blog post that anyone can quickly read and understand, focusing only on the most important points.

IMPORTANT: At the end of your response, add a separate section with exactly 3-4 relevant tags:
===TAGS===
tag1, tag2, tag3, tag4
===TAGS===

Tag Requirements:
- Use 3-4 tags maximum
- Must be relevant to both the content AND the ${aiData.source.subreddit} community
- Use single words or 2-word phrases
- Write tags in ${outputLang === 'Korean' ? 'Korean' : 'English'}
- Examples for different communities:
  - DigitalMarketing: "Digital Marketing", "SEO", "Content Marketing", "Social Media" 
  - Tiktokhelp: "TikTok", "Viral", "Content Creation", "Social Media"
  - Technology: "Technology", "AI", "Programming", "Innovation"`;
  }

  /**
   * 기본 템플릿용 상세 프롬프트 생성
   */
  createDetailedPrompt(aiData, title, settings, templateConfig, imageInfo, naturalInsights, outputLang, audience) {
    return `
Create a comprehensive, in-depth blog post about: ${aiData.original.title}

Blog Context: This content is from r/${aiData.source.subreddit} - ${aiData.source.description || ''}
IMPORTANT: Make sure the entire blog post stays relevant to the ${aiData.source.subreddit} community theme. Connect the topic to relevant concepts, strategies, tools, or applications within this field whenever possible.

Target: ${audience}
Language: ${outputLang} 
Length: Write a substantial 2000-3000 word detailed article with comprehensive coverage
Style: ${templateConfig.blogStyle}

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

Write a comprehensive, authoritative blog post that provides exceptional value to readers through depth, insight, and practical application. This should be a definitive resource on the topic.

IMPORTANT: At the end of your response, add a separate section with exactly 3-4 relevant tags:
===TAGS===
tag1, tag2, tag3, tag4
===TAGS===

Tag Requirements:
- Use 3-4 tags maximum
- Must be relevant to both the content AND the ${aiData.source.subreddit} community
- Use single words or 2-word phrases  
- Write tags in ${outputLang === 'Korean' ? 'Korean' : 'English'}
- Examples for different communities:
  - DigitalMarketing: "Digital Marketing", "SEO", "Content Marketing", "Social Media"
  - Tiktokhelp: "TikTok", "Viral", "Content Creation", "Social Media"
  - Technology: "Technology", "AI", "Programming", "Innovation"`;
  }
}

module.exports = PromptTemplateManager;
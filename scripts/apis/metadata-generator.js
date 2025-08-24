/**
 * metadata-generator.js
 * 블로그 포스트의 메타데이터와 프론트매터 생성
 */

const DateUtils = require('../utils/date-utils');
const siteConfig = require('../../config/site.config.js');

class MetadataGenerator {
  constructor() {
    this.siteConfig = siteConfig;
  }

  /**
   * 메타데이터 생성 (프론트매터용)
   */
  generateMetadata(aiData, title, settings, mainImage) {
    const now = new Date();
    const config = this.siteConfig;
    
    // 기본 태그들
    const baseTags = [
      config.blogTheme?.contentSources?.selectedSubreddit || "technology",
      "기술", 
      "IT", 
      "트렌드"
    ];

    // AI가 생성한 추가 태그들 (제목에서 키워드 추출)
    const additionalTags = this.extractTagsFromTitle(title);
    const allTags = [...new Set([...baseTags, ...additionalTags])];

    return {
      title: title,
      slug: this.generateSlug(title, now),
      date: DateUtils.getDateTimeForFrontmatter(now),
      description: this.generateDescription(aiData, title),
      tags: allTags,
      category: config.blogTheme?.contentSources?.selectedSubreddit || "technology",
      author: config.content?.defaultAuthor || "WebMaker Team",
      image: mainImage ? mainImage.url : this.getDefaultImage(),
      source: {
        platform: "Reddit",
        subreddit: aiData.source.subreddit,
        url: aiData.source.originalUrl,
        upvotes: aiData.original.engagement.upvotes,
        comments: aiData.original.engagement.comments
      }
    };
  }

  /**
   * 파일명용 슬러그 생성
   */
  generateSlug(title, date = new Date()) {
    const dateStr = DateUtils.getDateTimeForFilename(date);
    const slugTitle = title
      .toLowerCase()
      .replace(/[^\w\s가-힣-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    return `${dateStr}-${this.siteConfig.blogTheme?.contentSources?.selectedSubreddit || "technology"}-${slugTitle}`;
  }

  /**
   * 블로그 설명 생성
   */
  generateDescription(aiData, title) {
    const subreddit = aiData.source.subreddit;
    return `r/${subreddit}에서 화제가 된 ${title}에 대한 깊이 있는 분석과 인사이트`;
  }

  /**
   * 제목에서 태그 추출
   */
  extractTagsFromTitle(title) {
    const tags = [];
    const keywords = {
      'AI': ['AI', '인공지능', 'artificial', 'intelligence'],
      '기술': ['기술', 'technology', 'tech'],
      '개발': ['개발', 'development', 'dev'],
      '프로그래밍': ['프로그래밍', 'programming', 'coding'],
      '웹': ['웹', 'web', 'website'],
      '앱': ['앱', 'app', 'application'],
      '모바일': ['모바일', 'mobile'],
      '클라우드': ['클라우드', 'cloud'],
      '보안': ['보안', 'security'],
      '데이터': ['데이터', 'data'],
      '분석': ['분석', 'analysis', 'analytics']
    };

    for (const [tag, keywords_list] of Object.entries(keywords)) {
      if (keywords_list.some(keyword => 
        title.toLowerCase().includes(keyword.toLowerCase())
      )) {
        tags.push(tag);
      }
    }

    return tags;
  }

  /**
   * 기본 이미지 URL 가져오기
   */
  getDefaultImage() {
    return this.siteConfig.images?.defaultImage || "https://picsum.photos/1200/600?random=1";
  }

  /**
   * 마크다운 프론트매터 생성
   */
  generateFrontmatter(metadata) {
    const frontmatter = `---
title: "${metadata.title}"
slug: "${metadata.slug}"
date: "${metadata.date}"
description: "${metadata.description}"
tags: [${metadata.tags.map(tag => `"${tag}"`).join(', ')}]
category: "${metadata.category}"
author: "${metadata.author}"
image: "${metadata.image}"
source:
  platform: "${metadata.source.platform}"
  subreddit: "${metadata.source.subreddit}"
  url: "${metadata.source.url}"
  upvotes: ${metadata.source.upvotes}
  comments: ${metadata.source.comments}
---`;

    return frontmatter;
  }

  /**
   * 완전한 마크다운 파일 콘텐츠 생성
   */
  generateMarkdownContent(metadata, content) {
    const frontmatter = this.generateFrontmatter(metadata);
    return `${frontmatter}\n\n${content}`;
  }
}

module.exports = MetadataGenerator;
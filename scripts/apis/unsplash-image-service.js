/**
 * unsplash-image-service.js
 * Unsplash API를 이용한 관련 이미지 검색 및 삽입 서비스
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class UnsplashImageService {
  constructor(logger) {
    this.logger = logger;
    this.accessKey = process.env.UNSPLASH_ACCESS_KEY;
    this.baseUrl = 'https://api.unsplash.com';
    
    // 키워드 매핑 설정 로드
    this.loadKeywordMappings();
    
    if (!this.accessKey) {
      this.logger?.warning('UNSPLASH_ACCESS_KEY가 설정되지 않았습니다. Picsum 대체 서비스를 사용합니다.');
    }
  }

  /**
   * 키워드 매핑 설정 파일 로드
   */
  loadKeywordMappings() {
    try {
      const configPath = path.join(__dirname, '../../config/image-keywords.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      this.keywordConfig = JSON.parse(configData);
      this.logger?.info('이미지 키워드 설정 로드 완료');
    } catch (error) {
      this.logger?.warning('키워드 설정 파일 로드 실패, 기본값 사용', { error: error.message });
      // 기본 설정값
      this.keywordConfig = {
        koreanToEnglish: {
          '기술': 'technology',
          '비즈니스': 'business',
          '인공지능': 'artificial intelligence'
        },
        categoryKeywords: {
          'technology': ['technology', 'innovation', 'development']
        },
        defaultKeywords: ['technology', 'business', 'innovation']
      };
    }
  }

  /**
   * 키워드로 관련 이미지 검색 (랜덤 페이지 + 가로 이미지만)
   */
  async searchImages(query, count = 3) {
    if (!this.accessKey) {
      return this.getFallbackImages(count);
    }

    try {
      // 랜덤 페이지 선택 (1-50 페이지 중에서)
      let randomPage = Math.floor(Math.random() * 50) + 1;
      
      let response = await axios.get(`${this.baseUrl}/search/photos`, {
        headers: {
          'Authorization': `Client-ID ${this.accessKey}`
        },
        params: {
          query: query,
          per_page: count,
          page: randomPage,
          orientation: 'landscape', // 가로 이미지만
          content_filter: 'high'
        }
      });

      // 호깃 페이지(결과 부족) 처리: 결과가 없거나 부족하면 앞쪽 페이지에서 재시도
      if (!response.data.results || response.data.results.length === 0) {
        this.logger?.warning(`키워드 "${query}" 페이지 ${randomPage}에서 결과 없음, 앞쪽 페이지에서 재시도`);
        randomPage = Math.floor(Math.random() * 5) + 1; // 1-5 페이지 중에서
        
        response = await axios.get(`${this.baseUrl}/search/photos`, {
          headers: {
            'Authorization': `Client-ID ${this.accessKey}`
          },
          params: {
            query: query,
            per_page: count,
            page: randomPage,
            orientation: 'landscape',
            content_filter: 'high'
          }
        });
      }

      const results = response.data.results || [];
      return results.map(photo => ({
        id: photo.id,
        url: photo.urls.regular,
        alt: photo.alt_description || query,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        downloadUrl: photo.links.download_location
      }));

    } catch (error) {
      this.logger?.warning('Unsplash API 요청 실패, Picsum 대체 서비스 사용', { error: error.message });
      return this.getFallbackImages(count);
    }
  }

  /**
   * Picsum 대체 이미지 생성 (가로 이미지만)
   */
  getFallbackImages(count = 3) {
    const images = [];
    for (let i = 0; i < count; i++) {
      const randomId = Math.floor(Math.random() * 1000) + Date.now() + i;
      images.push({
        id: `picsum-${randomId}`,
        url: `https://picsum.photos/1200/600?random=${randomId}`, // 가로 비율 2:1
        alt: 'Related image',
        photographer: 'Picsum Photos',
        photographerUrl: 'https://picsum.photos',
        downloadUrl: null
      });
    }
    return images;
  }

  /**
   * 블로그 주제에서 이미지 키워드 추출
   */
  extractImageKeywords(title, content) {
    const keywords = [];
    
    // 제목에서 주요 키워드 추출
    const titleKeywords = this.extractKeywordsFromText(title);
    keywords.push(...titleKeywords);

    // 내용에서 주요 섹션 헤더 추출
    const headerMatches = content.match(/##\s+(.+)/g);
    if (headerMatches) {
      headerMatches.forEach(header => {
        const cleanHeader = header.replace('##', '').trim();
        const headerKeywords = this.extractKeywordsFromText(cleanHeader);
        keywords.push(...headerKeywords);
      });
    }

    // 중복 제거 및 상위 키워드 선택
    const uniqueKeywords = [...new Set(keywords)];
    return uniqueKeywords.slice(0, 5);
  }

  /**
   * 텍스트에서 키워드 추출 (설정 파일 기반)
   */
  extractKeywordsFromText(text) {
    const keywords = [];
    
    // 1. 설정 파일의 한국어-영어 매핑 사용
    const koreanToEnglish = this.keywordConfig.koreanToEnglish || {};
    Object.keys(koreanToEnglish).forEach(korean => {
      if (text.includes(korean)) {
        keywords.push(koreanToEnglish[korean]);
      }
    });

    // 2. 영어 키워드 직접 추출 (3글자 이상)
    const englishWords = text.match(/[a-zA-Z]{3,}/g);
    if (englishWords) {
      // 기술 관련 영어 단어 우선순위
      const techWords = englishWords.filter(word => 
        /^(AI|tech|app|web|data|cloud|mobile|digital|cyber|smart|auto)/i.test(word) ||
        word.length >= 4
      );
      keywords.push(...techWords.slice(0, 3));
    }

    // 3. 키워드가 부족한 경우 카테고리 기반 추론
    if (keywords.length < 2) {
      const categoryKeywords = this.inferCategoryFromText(text);
      keywords.push(...categoryKeywords);
    }

    // 4. 여전히 키워드가 없으면 기본값 사용
    const defaultKeywords = this.keywordConfig.defaultKeywords || ['technology', 'business', 'innovation'];
    return keywords.length > 0 ? 
      [...new Set(keywords)].slice(0, 5) : 
      defaultKeywords.slice(0, 3);
  }

  /**
   * 텍스트에서 카테고리를 추론하여 관련 키워드 생성 (설정 파일 기반)
   */
  inferCategoryFromText(text) {
    const lowerText = text.toLowerCase();
    const keywords = [];
    const categoryKeywords = this.keywordConfig.categoryKeywords || {};

    // 텍스트에서 카테고리 키워드 찾기
    Object.keys(categoryKeywords).forEach(category => {
      if (lowerText.includes(category) || 
          lowerText.includes(category.replace(/([A-Z])/g, ' $1').toLowerCase())) {
        keywords.push(...categoryKeywords[category].slice(0, 2));
      }
    });

    return keywords.slice(0, 3);
  }

  /**
   * 메인 이미지 생성 (블로그 상단용)
   */
  async getMainImage(title) {
    const keywords = this.extractKeywordsFromText(title);
    const mainKeyword = keywords[0] || 'technology';
    
    const images = await this.searchImages(mainKeyword, 1);
    return images[0];
  }

  /**
   * 본문 중간 이미지들 생성
   */
  async getContentImages(title, content, count = 3, avoidMainKeyword = false) {
    const keywords = this.extractImageKeywords(title, content);
    const images = [];

    // 메인 이미지와 다른 키워드 사용
    let searchKeywords = keywords;
    if (avoidMainKeyword && keywords.length > 1) {
      // 첫 번째 키워드(메인 키워드) 제외하고 사용
      searchKeywords = keywords.slice(1);
      
      // 추가 관련 키워드 생성
      const additionalKeywords = this.generateAlternativeKeywords(title);
      searchKeywords.push(...additionalKeywords);
    }

    // 각 키워드별로 이미지 검색
    for (let i = 0; i < Math.min(count, searchKeywords.length); i++) {
      const keyword = searchKeywords[i];
      const keywordImages = await this.searchImages(keyword, 1);
      if (keywordImages.length > 0) {
        images.push({
          keyword,
          ...keywordImages[0]
        });
      }
      
      // API 요청 제한을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return images;
  }

  /**
   * 대체 키워드 생성 (메인 키워드와 다른 관련 키워드) - 설정 파일 기반
   */
  generateAlternativeKeywords(title) {
    const alternatives = [];
    const koreanToEnglish = this.keywordConfig.koreanToEnglish || {};
    const categoryKeywords = this.keywordConfig.categoryKeywords || {};

    // 1. 제목에서 한국어 키워드 찾고 관련 영어 키워드 추가
    Object.keys(koreanToEnglish).forEach(korean => {
      if (title.includes(korean)) {
        const englishKeyword = koreanToEnglish[korean];
        
        // 해당 키워드와 관련된 카테고리 찾기
        Object.keys(categoryKeywords).forEach(category => {
          if (categoryKeywords[category].includes(englishKeyword) || 
              englishKeyword.includes(category)) {
            alternatives.push(...categoryKeywords[category].slice(0, 2));
          }
        });
      }
    });

    // 2. 카테고리별 기본 대체 키워드 추가
    if (alternatives.length < 3) {
      const generalCategories = ['business', 'technology', 'innovation'];
      generalCategories.forEach(category => {
        if (categoryKeywords[category]) {
          alternatives.push(...categoryKeywords[category].slice(0, 2));
        }
      });
    }

    // 3. 기본 비즈니스/기술 키워드 추가
    const defaultAlternatives = [
      'business meeting', 'office', 'professional', 
      'workplace', 'team work', 'innovation', 'development'
    ];
    alternatives.push(...defaultAlternatives);

    // 중복 제거 후 상위 5개 반환
    return [...new Set(alternatives)].slice(0, 5);
  }

  /**
   * Unsplash 이미지 다운로드 트래킹 (필수)
   */
  async trackDownload(downloadUrl) {
    if (!downloadUrl || !this.accessKey) return;

    try {
      await axios.get(downloadUrl, {
        headers: {
          'Authorization': `Client-ID ${this.accessKey}`
        }
      });
      this.logger?.info('Unsplash 다운로드 추적 완료');
    } catch (error) {
      this.logger?.warning('Unsplash 다운로드 추적 실패', { error: error.message });
    }
  }

  /**
   * 서로 다른 두 이미지 가져오기 (메인용 + 본문용)
   */
  async getTwoDistinctImages(title) {
    const keywords = this.extractKeywordsFromText(title);
    const images = [];

    // 첫 번째 이미지: 메인 배너용
    const mainKeyword = keywords[0] || 'technology';
    const mainImages = await this.searchImages(mainKeyword, 1);
    if (mainImages.length > 0) {
      images.push({
        type: 'main',
        keyword: mainKeyword,
        ...mainImages[0]
      });
    }

    // API 요청 제한을 위한 지연
    await new Promise(resolve => setTimeout(resolve, 300));

    // 두 번째 이미지: 본문용 (메인과 다른 키워드)
    let contentKeyword = 'business';
    if (keywords.length > 1) {
      contentKeyword = keywords[1];
    } else {
      // 대체 키워드 생성
      const alternatives = this.generateAlternativeKeywords(title);
      contentKeyword = alternatives[0] || 'innovation';
    }

    const contentImages = await this.searchImages(contentKeyword, 1);
    if (contentImages.length > 0) {
      images.push({
        type: 'content',
        keyword: contentKeyword,
        ...contentImages[0]
      });
    }

    this.logger?.info(`메인/본문용 두 이미지 생성 완료: ${mainKeyword}, ${contentKeyword}`);
    return images;
  }

  /**
   * 마크다운에 이미지 삽입
   */
  insertImagesIntoMarkdown(content, images) {
    if (!images || images.length === 0) return content;

    let modifiedContent = content;
    const sections = content.split('##').filter(section => section.trim());
    
    if (sections.length <= 1) return content;

    // 각 섹션 사이에 이미지 삽입
    images.forEach((image, index) => {
      const sectionIndex = Math.floor((sections.length - 1) * (index + 1) / images.length);
      const targetSection = `## ${sections[sectionIndex]}`;
      
      const imageMarkdown = `
![${image.alt}](${image.url})
*Photo by [${image.photographer}](${image.photographerUrl}) on [Unsplash](https://unsplash.com)*

`;

      modifiedContent = modifiedContent.replace(
        targetSection,
        targetSection + '\n' + imageMarkdown
      );

      // 다운로드 추적
      if (image.downloadUrl) {
        this.trackDownload(image.downloadUrl);
      }
    });

    return modifiedContent;
  }
}

module.exports = UnsplashImageService;
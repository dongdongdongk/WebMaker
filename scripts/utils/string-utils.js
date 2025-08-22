/**
 * 문자열 조작 유틸리티
 * 슬러그 생성, 텍스트 정제, 키워드 처리 등을 담당합니다.
 */

class StringUtils {
  /**
   * 한글/영문을 URL 친화적인 슬러그로 변환
   */
  static createSlug(text) {
    return text
      .toLowerCase()
      .trim()
      // 한글을 영문으로 변환하거나 제거
      .replace(/[가-힣]/g, (match) => {
        // 간단한 한글-영문 매핑 (필요시 확장)
        const koreanToEnglish = {
          '인공지능': 'ai',
          'AI': 'ai',
          '트렌드': 'trends',
          '웹개발': 'web-development',
          '자바스크립트': 'javascript',
          '리액트': 'react',
          '넥스트': 'nextjs'
        };
        return koreanToEnglish[match] || '';
      })
      // 특수문자를 하이픈으로 변환
      .replace(/[^a-z0-9가-힣]/g, '-')
      // 연속된 하이픈 제거
      .replace(/-+/g, '-')
      // 시작/끝 하이픈 제거
      .replace(/^-|-$/g, '');
  }

  /**
   * 제목에서 슬러그 생성 (더 스마트한 변환)
   */
  static titleToSlug(title) {
    // 연도 추출
    const yearMatch = title.match(/(\d{4})/);
    const year = yearMatch ? yearMatch[1] : '';

    // 키워드 매핑
    const keywords = {
      'AI': 'ai',
      '인공지능': 'ai',
      '트렌드': 'trends',
      '웹개발': 'web-development',
      '자바스크립트': 'javascript',
      'JavaScript': 'javascript',
      '리액트': 'react',
      'React': 'react',
      'Next.js': 'nextjs',
      '넥스트': 'nextjs',
      '모바일': 'mobile',
      '디자인': 'design',
      '보안': 'security',
      '사이버보안': 'cybersecurity',
      '클라우드': 'cloud',
      '원격근무': 'remote-work',
      '생산성': 'productivity'
    };

    let slug = '';
    
    // 키워드 추출 및 변환
    Object.keys(keywords).forEach(korean => {
      if (title.includes(korean)) {
        slug += keywords[korean] + '-';
      }
    });

    // 연도 추가
    if (year) {
      slug += year;
    }

    // 기본 슬러그 생성이 비어있으면 제목 기반으로 생성
    if (!slug) {
      slug = this.createSlug(title);
    }

    return slug.replace(/-+/g, '-').replace(/^-|-$/g, '') || 'post';
  }

  /**
   * 텍스트에서 불필요한 공백 제거
   */
  static cleanText(text) {
    return text
      .replace(/\s+/g, ' ') // 연속된 공백을 하나로
      .replace(/\n\s*\n/g, '\n\n') // 연속된 빈 줄을 두 개로 제한
      .trim();
  }

  /**
   * 마크다운 텍스트에서 순수 텍스트 추출
   */
  static stripMarkdown(text) {
    return text
      .replace(/#+\s*/g, '') // 헤딩 제거
      .replace(/\*\*(.*?)\*\*/g, '$1') // 볼드 제거
      .replace(/\*(.*?)\*/g, '$1') // 이탤릭 제거
      .replace(/`(.*?)`/g, '$1') // 인라인 코드 제거
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크 제거
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // 이미지 제거
      .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
      .replace(/>\s*/g, '') // 인용문 제거
      .replace(/[-*+]\s+/g, '') // 리스트 제거
      .replace(/\d+\.\s+/g, '') // 순서 리스트 제거
      .trim();
  }

  /**
   * 텍스트에서 요약문 추출 (첫 N개 문장)
   */
  static extractExcerpt(text, sentences = 2) {
    const cleanText = this.stripMarkdown(text);
    const sentencePattern = /[.!?]+\s+/g;
    const sentenceArray = cleanText.split(sentencePattern);
    
    return sentenceArray
      .slice(0, sentences)
      .join(' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * 키워드 배열을 정규화
   */
  static normalizeKeywords(keywords) {
    return keywords
      .map(keyword => keyword.trim().toLowerCase())
      .filter(keyword => keyword.length > 1)
      .filter((keyword, index, array) => array.indexOf(keyword) === index); // 중복 제거
  }

  /**
   * 문자열을 카멜케이스로 변환
   */
  static toCamelCase(str) {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9가-힣]+(.)/g, (_, char) => char.toUpperCase());
  }

  /**
   * 문자열을 파스칼케이스로 변환
   */
  static toPascalCase(str) {
    const camelCase = this.toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }

  /**
   * 문자열 자르기 (한글 고려)
   */
  static truncate(str, length = 100, suffix = '...') {
    if (str.length <= length) {
      return str;
    }
    return str.substring(0, length - suffix.length) + suffix;
  }

  /**
   * HTML 태그 제거
   */
  static stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * 이메일 주소 검증
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * URL 검증
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = StringUtils;
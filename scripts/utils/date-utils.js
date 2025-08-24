/**
 * 날짜 관련 유틸리티
 * 다양한 날짜 포맷팅과 계산을 담당합니다.
 */

class DateUtils {
  /**
   * 현재 날짜를 YYYY-MM-DD 형식으로 반환
   */
  static getToday() {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * 현재 날짜시간을 ISO 형식으로 반환
   */
  static getNow() {
    return new Date().toISOString();
  }

  /**
   * 날짜를 한국어 형식으로 포맷팅 (2025년 1월 21일)
   */
  static formatKorean(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}년 ${month}월 ${day}일`;
  }

  /**
   * 파일명에 사용할 날짜 형식 (20250121)
   */
  static getDateForFilename(date = new Date()) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * 파일명에 사용할 날짜시분 형식 (20250121-1430)
   */
  static getDateTimeForFilename(date = new Date()) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}-${hour}${minute}`;
  }

  /**
   * 슬러그용 날짜 형식 (2025-01-21)
   */
  static getDateForSlug(date = new Date()) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * frontmatter용 날짜시분 형식 (2025-08-23T14:30:00)
   */
  static getDateTimeForFrontmatter(date = new Date()) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    const second = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }

  /**
   * 읽기 시간 계산 (단어 수 기준)
   */
  static calculateReadingTime(text) {
    const wordsPerMinute = 200; // 평균 읽기 속도
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return Math.max(1, minutes); // 최소 1분
  }

  /**
   * 마크다운 텍스트에서 읽기 시간 계산 (한글 기준)
   */
  static calculateReadingTimeKorean(text) {
    // 한글은 글자 수 기준, 영문은 단어 수 기준
    const koreanChars = (text.match(/[가-힣]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    
    const koreanReadingSpeed = 300; // 분당 한글 글자 수
    const englishReadingSpeed = 200; // 분당 영어 단어 수
    
    const koreanTime = koreanChars / koreanReadingSpeed;
    const englishTime = englishWords / englishReadingSpeed;
    
    const totalMinutes = Math.ceil(koreanTime + englishTime);
    return Math.max(1, totalMinutes);
  }

  /**
   * N일 전 날짜 계산
   */
  static getDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  /**
   * N일 후 날짜 계산
   */
  static getDaysLater(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  /**
   * 두 날짜 사이의 일수 계산
   */
  static getDaysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 랜덤 이미지 번호 생성 (날짜 기반)
   */
  static getRandomImageNumber(date = new Date()) {
    const dateString = this.getDateForFilename(date);
    // 날짜를 시드로 사용하여 일관된 랜덤 번호 생성
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    return Math.abs(hash) % 100 + 1; // 1-100 사이의 숫자
  }
}

module.exports = DateUtils;
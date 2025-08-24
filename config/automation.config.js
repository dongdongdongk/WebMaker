/**
 * automation.config.js
 * GitHub Actions 자동화 설정 (Reddit 기반 블로그 생성)
 */

const automationConfig = {
  // 실행 스케줄 설정 (UTC 기준, 미국 Reddit 활동 패턴 최적화)
  schedule: {
    // 실행 시간들 (UTC 시간)
    defaultTimes: [
      '00:00', // UTC 0시 = 미국 저녁 (EST 7-8PM)
      '13:00', // UTC 13시 = 미국 아침 (EST 8-9AM) 
      '17:00'  // UTC 17시 = 미국 점심 (EST 12-1PM)
    ],
    
    // 실행 요일 (0=일요일, 1=월요일, ..., 6=토요일)
    weekdays: [1, 2, 3, 4, 5], // 평일만 실행
    
    // 스케줄 활성화 여부
    enabled: true
  },
  
  // 블로그 생성 설정
  blogGeneration: {
    // UTC 시간별 템플릿 매핑
    templateByTime: {
      'us_evening': 'engaging', // UTC 0시 = 미국 저녁 (심화 정보형)
      'us_morning': 'summary',     // UTC 13시 = 미국 아침 (간단 요약형)
      'us_lunch': 'summary'       // UTC 17시 = 미국 점심 (흥미유발형)
    },
    
    // 시간 구분 기준
    timeRanges: {
      us_evening: { start: '23:00', end: '03:00' },
      us_morning: { start: '12:00', end: '15:00' },
      us_lunch: { start: '16:00', end: '19:00' }
    }
  }
};

module.exports = automationConfig;
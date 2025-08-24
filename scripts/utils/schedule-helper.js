/**
 * schedule-helper.js
 * GitHub Actions 스케줄 생성 헬퍼
 */

const automationConfig = require('../../config/automation.config.js');

class ScheduleHelper {
  /**
   * 한국시간을 UTC로 변환 (KST = UTC+9)
   */
  static convertKSTtoUTC(kstTime) {
    const [hours, minutes] = kstTime.split(':').map(Number);
    
    // KST = UTC+9이므로 UTC는 9시간 빼기
    let utcHours = hours - 9;
    
    // 음수가 되면 전날
    const prevDay = utcHours < 0;
    if (prevDay) utcHours += 24;
    
    return {
      hours: utcHours,
      minutes,
      prevDay
    };
  }
  
  /**
   * Cron 표현식 생성 (UTC 시간 직접 사용)
   */
  static generateCronExpression() {
    const config = automationConfig.schedule;
    if (!config.enabled) return [];
    
    const cronExpressions = [];
    
    for (const utcTime of config.defaultTimes) {
      const [hours, minutes] = utcTime.split(':').map(Number);
      
      const weekdayStr = config.weekdays.length === 7 ? '*' : config.weekdays.join(',');
      const cronExpr = `${minutes} ${hours} * * ${weekdayStr}`;
      
      // 미국 시간 표시를 위한 계산
      const estHour = (hours - 5 + 24) % 24; // EST = UTC-5 (겨울시간 기준)
      const edtHour = (hours - 4 + 24) % 24; // EDT = UTC-4 (여름시간 기준)
      
      cronExpressions.push({
        cron: cronExpr,
        description: `UTC ${utcTime} = 미국 EST ${estHour}:${minutes.toString().padStart(2, '0')} / EDT ${edtHour}:${minutes.toString().padStart(2, '0')}`
      });
    }
    
    return cronExpressions;
  }
  
  /**
   * 현재 시간대별 템플릿 결정 (UTC 기준)
   */
  static getCurrentTemplate() {
    const now = new Date();
    
    // UTC 시간 사용
    const currentHour = now.getUTCHours();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
    
    const config = automationConfig.blogGeneration;
    
    for (const [period, range] of Object.entries(config.timeRanges)) {
      if (this.isTimeInRange(currentTime, range.start, range.end)) {
        return config.templateByTime[period] || 'summary';
      }
    }
    
    return 'summary'; // 기본값
  }
  
  /**
   * 시간 범위 체크
   */
  static isTimeInRange(currentTime, startTime, endTime) {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    
    return current >= start && current <= end;
  }
  
  /**
   * 시간을 분으로 변환
   */
  static timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  
  /**
   * 설정 정보 출력
   */
  static printScheduleInfo() {
    console.log('📅 GitHub Actions 스케줄 정보:');
    
    const crons = this.generateCronExpression();
    crons.forEach((cron, index) => {
      console.log(`${index + 1}. ${cron.description}`);
      console.log(`   Cron: ${cron.cron}`);
    });
    
    console.log(`\n🎯 현재 설정 (UTC 기준):`);
    console.log(`- 템플릿: ${this.getCurrentTemplate()}`);
    console.log(`- 시간대: UTC (미국 Reddit 활동 패턴 최적화)`);
  }
}

// 직접 실행 시 정보 출력
if (require.main === module) {
  ScheduleHelper.printScheduleInfo();
}

module.exports = ScheduleHelper;
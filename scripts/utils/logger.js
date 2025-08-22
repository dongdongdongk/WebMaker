/**
 * 로깅 유틸리티
 * 스크립트 실행 로그를 관리합니다.
 */

const fs = require('fs').promises;
const path = require('path');

class Logger {
  constructor(scriptName) {
    this.scriptName = scriptName;
    this.logDir = path.join(__dirname, '../../logs');
    this.logFile = path.join(this.logDir, `${scriptName}-${this.getDateString()}.log`);
  }

  getDateString() {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  async ensureLogDir() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      // 디렉토리가 이미 존재하는 경우 무시
    }
  }

  async log(level, message, data = null) {
    const timestamp = this.getTimestamp();
    const logEntry = {
      timestamp,
      script: this.scriptName,
      level,
      message,
      data
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    // 콘솔 출력
    const colors = {
      INFO: '\x1b[36m',
      SUCCESS: '\x1b[32m',
      WARNING: '\x1b[33m',
      ERROR: '\x1b[31m',
      RESET: '\x1b[0m'
    };

    console.log(`${colors[level] || ''}[${level}] ${this.scriptName}: ${message}${colors.RESET}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }

    // 파일 출력
    try {
      await this.ensureLogDir();
      await fs.appendFile(this.logFile, logLine);
    } catch (error) {
      console.error('로그 파일 쓰기 실패:', error);
    }
  }

  async info(message, data) {
    await this.log('INFO', message, data);
  }

  async success(message, data) {
    await this.log('SUCCESS', message, data);
  }

  async warning(message, data) {
    await this.log('WARNING', message, data);
  }

  async error(message, data) {
    await this.log('ERROR', message, data);
  }
}

module.exports = Logger;
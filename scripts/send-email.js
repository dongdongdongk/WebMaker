/**
 * send-email.js
 * 자동화 작업의 성공/실패 알림 이메일을 발송합니다.
 * 실행 시간: 약 30초
 */

const Logger = require('./utils/logger');
const FileUtils = require('./utils/file-utils');
const DateUtils = require('./utils/date-utils');
const StringUtils = require('./utils/string-utils');
const path = require('path');

// 사이트 설정 로드
const siteConfig = require('../config/site.config.js');

class EmailNotifier {
  constructor() {
    this.logger = new Logger('send-email');
    this.configPath = path.join(__dirname, '../config/email-config.json');
    this.templatesDir = path.join(__dirname, 'templates');
    
    // 이메일 템플릿 정의 (설정 파일에서 가져오기)
    this.templates = {
      success: {
        subject: `✅ ${siteConfig.branding.siteName} ${siteConfig.email.templates.success} - {date}`,
        template: 'success-template.html'
      },
      failure: {
        subject: `❌ ${siteConfig.branding.siteName} ${siteConfig.email.templates.failure} - {date}`,
        template: 'failure-template.html'
      },
      partial: {
        subject: `⚠️ ${siteConfig.branding.siteName} ${siteConfig.email.templates.partial} - {date}`,
        template: 'partial-template.html'
      }
    };
  }

  /**
   * 이메일 설정 로드
   */
  async loadConfig() {
    try {
      const config = await FileUtils.readJson(this.configPath);
      if (config) {
        await this.logger.info('이메일 설정 파일 로드 완료');
        return config;
      }
    } catch (error) {
      await this.logger.warning('설정 파일 로드 실패, 기본 설정 사용');
    }

    // 기본 설정 생성
    const defaultConfig = {
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER || 'your-email@gmail.com',
          pass: process.env.GMAIL_PASSWORD || 'your-app-password'
        }
      },
      recipients: {
        success: siteConfig.email.notifications,
        failure: siteConfig.email.notifications,
        partial: siteConfig.email.notifications
      },
      options: {
        retryAttempts: 3,
        retryDelay: 5000, // 5초
        timeout: 30000, // 30초
        includeMetrics: true,
        includeLinks: true
      },
      lastUpdated: DateUtils.getNow()
    };

    await FileUtils.writeJson(this.configPath, defaultConfig);
    await this.logger.info('기본 이메일 설정 생성 완료');
    return defaultConfig;
  }

  /**
   * 작업 결과 데이터 수집
   */
  async collectJobResults() {
    const results = {
      timestamp: DateUtils.getNow(),
      date: DateUtils.getToday(),
      jobs: {}
    };

    // 각 스크립트 결과 파일 확인
    const resultFiles = {
      keywords: '../config/keywords-today.json',
      content: '../config/content-data.json',
      posts: '../content/posts'
    };

    // 키워드 수집 결과
    try {
      const keywordData = await FileUtils.readJson(
        path.join(__dirname, resultFiles.keywords)
      );
      results.jobs.keywords = {
        success: !!keywordData,
        count: keywordData?.finalKeywords?.length || 0,
        data: keywordData
      };
    } catch (error) {
      results.jobs.keywords = { success: false, error: error.message };
    }

    // 콘텐츠 크롤링 결과
    try {
      const contentData = await FileUtils.readJson(
        path.join(__dirname, resultFiles.content)
      );
      results.jobs.content = {
        success: !!contentData,
        count: contentData?.qualityContent?.length || 0,
        data: contentData
      };
    } catch (error) {
      results.jobs.content = { success: false, error: error.message };
    }

    // 포스트 생성 결과
    try {
      const postsDir = path.join(__dirname, resultFiles.posts);
      const todayPosts = await this.getTodayPosts(postsDir);
      results.jobs.posts = {
        success: todayPosts.length > 0,
        count: todayPosts.length,
        posts: todayPosts
      };
    } catch (error) {
      results.jobs.posts = { success: false, error: error.message };
    }

    // 전체 성공률 계산
    const totalJobs = Object.keys(results.jobs).length;
    const successfulJobs = Object.values(results.jobs).filter(job => job.success).length;
    results.successRate = totalJobs > 0 ? (successfulJobs / totalJobs) * 100 : 0;
    results.status = this.determineOverallStatus(results.successRate);

    return results;
  }

  /**
   * 오늘 생성된 포스트 조회
   */
  async getTodayPosts(postsDir) {
    const today = DateUtils.getToday();
    const posts = await FileUtils.listFiles(postsDir, '.md');
    const todayPosts = [];

    for (const post of posts) {
      try {
        const postPath = path.join(postsDir, post);
        const content = await FileUtils.readText(postPath);
        
        // Front matter에서 날짜 추출
        const dateMatch = content.match(/^date:\s*"([^"]+)"/m);
        if (dateMatch && dateMatch[1] === today) {
          const titleMatch = content.match(/^title:\s*"([^"]+)"/m);
          todayPosts.push({
            filename: post,
            title: titleMatch ? titleMatch[1] : post.replace('.md', ''),
            date: dateMatch[1]
          });
        }
      } catch (error) {
        await this.logger.warning(`포스트 정보 추출 실패: ${post}`);
      }
    }

    return todayPosts;
  }

  /**
   * 전체 작업 상태 판정
   */
  determineOverallStatus(successRate) {
    if (successRate >= 100) return 'success';
    if (successRate >= 50) return 'partial';
    return 'failure';
  }

  /**
   * HTML 이메일 템플릿 생성
   */
  generateEmailTemplate(status, results) {
    const statusEmoji = {
      success: '✅',
      partial: '⚠️',
      failure: '❌'
    };

    const statusColor = {
      success: '#28a745',
      partial: '#ffc107',
      failure: '#dc3545'
    };

    const jobRows = Object.entries(results.jobs).map(([jobName, job]) => {
      const emoji = job.success ? '✅' : '❌';
      const count = job.count !== undefined ? ` (${job.count}개)` : '';
      const error = job.error ? `<br><small style="color: #dc3545;">${job.error}</small>` : '';
      
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${emoji} ${jobName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${job.success ? '성공' : '실패'}${count}${error}</td>
        </tr>
      `;
    }).join('');

    const postsSection = results.jobs.posts?.posts?.length > 0 ? `
      <div style="margin-top: 20px;">
        <h3>📝 생성된 포스트</h3>
        <ul>
          ${results.jobs.posts.posts.map(post => 
            `<li><strong>${post.title}</strong> (${post.filename})</li>`
          ).join('')}
        </ul>
      </div>
    ` : '';

    const template = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebMaker 자동화 결과</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background-color: ${statusColor[status]}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">
                ${statusEmoji[status]} WebMaker 자동화 결과
            </h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">
                ${DateUtils.formatKorean(results.date)} 실행 결과
            </p>
        </div>

        <!-- Status Summary -->
        <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0; color: #333;">전체 성공률</h3>
                    <p style="margin: 5px 0 0 0; color: #666;">총 ${Object.keys(results.jobs).length}개 작업 중 ${Object.values(results.jobs).filter(job => job.success).length}개 성공</p>
                </div>
                <div style="font-size: 32px; font-weight: bold; color: ${statusColor[status]};">
                    ${Math.round(results.successRate)}%
                </div>
            </div>
        </div>

        <!-- Job Details -->
        <div style="padding: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #333;">작업 상세 결과</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">작업</th>
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">결과</th>
                    </tr>
                </thead>
                <tbody>
                    ${jobRows}
                </tbody>
            </table>
        </div>

        ${postsSection}

        <!-- Footer -->
        <div style="padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 12px;">
                🤖 이 이메일은 WebMaker 자동화 시스템에서 발송되었습니다.<br>
                실행 시간: ${results.timestamp}
            </p>
        </div>

    </div>
</body>
</html>
    `;

    return template;
  }

  /**
   * 실제 이메일 발송
   */
  async sendEmail(to, subject, htmlContent, config) {
    await this.logger.info(`이메일 발송 중: ${to}`);
    
    // 이메일 설정이 없으면 시뮬레이션 모드
    if (!config.smtp.auth.user || config.smtp.auth.user === 'your-email@gmail.com') {
      await this.logger.warning('Gmail 설정이 없어 시뮬레이션 모드로 실행');
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.logger.info(`이메일 발송 시뮬레이션 완료: ${to}`);
      return { messageId: 'simulated-' + Date.now() };
    }

    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter(config.smtp);
      
      const result = await transporter.sendMail({
        from: {
          name: 'WebMaker AI',
          address: config.smtp.auth.user
        },
        to,
        subject,
        html: htmlContent
      });
      
      await this.logger.info(`이메일 발송 완료: ${to}`, { messageId: result.messageId });
      return result;
    } catch (error) {
      await this.logger.error(`이메일 발송 실패: ${to}`, { error: error.message });
      throw error;
    }
  }

  /**
   * 메인 실행 함수
   */
  async execute(customResults = null) {
    try {
      await this.logger.info('이메일 알림 발송 시작');
      
      // 1. 설정 로드
      const config = await this.loadConfig();
      
      // 2. 작업 결과 수집
      const results = customResults || await this.collectJobResults();
      const status = results.status;
      
      // 3. 이메일 템플릿 생성
      const template = this.templates[status];
      const subject = template.subject.replace('{date}', DateUtils.formatKorean(results.date));
      const htmlContent = this.generateEmailTemplate(status, results);
      
      // 4. 수신자 목록
      const recipients = config.recipients[status] || config.recipients.failure;
      
      // 5. 이메일 발송
      const emailResults = [];
      for (const recipient of recipients) {
        try {
          const result = await this.sendEmail(recipient, subject, htmlContent, config);
          emailResults.push({
            recipient,
            success: true,
            messageId: result.messageId
          });
          
          // 발송 간격
          if (recipients.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error) {
          await this.logger.error(`이메일 발송 실패: ${recipient}`, { error: error.message });
          emailResults.push({
            recipient,
            success: false,
            error: error.message
          });
        }
      }

      // 6. 결과 정리
      const summary = {
        status,
        totalRecipients: recipients.length,
        successfulSends: emailResults.filter(r => r.success).length,
        failedSends: emailResults.filter(r => !r.success).length,
        jobResults: results,
        emailResults
      };

      const result = {
        success: summary.successfulSends > 0,
        summary,
        metadata: {
          generatedBy: 'send-email.js',
          version: '1.0.0',
          sentAt: DateUtils.getNow()
        }
      };

      await this.logger.success('이메일 알림 발송 완료', {
        status,
        recipients: summary.totalRecipients,
        successful: summary.successfulSends,
        failed: summary.failedSends
      });

      return result;

    } catch (error) {
      await this.logger.error('이메일 알림 발송 실패', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * 테스트 이메일 발송
   */
  async sendTestEmail() {
    const testResults = {
      timestamp: DateUtils.getNow(),
      date: DateUtils.getToday(),
      status: 'success',
      successRate: 100,
      jobs: {
        keywords: { success: true, count: 25 },
        content: { success: true, count: 15 },
        posts: { 
          success: true, 
          count: 3,
          posts: [
            { title: 'AI 트렌드 2025 테스트', filename: 'ai-trends-test.md' },
            { title: '웹개발 가이드 테스트', filename: 'web-dev-test.md' }
          ]
        }
      }
    };

    return this.execute(testResults);
  }
}

// 직접 실행시
if (require.main === module) {
  const notifier = new EmailNotifier();
  
  // 명령행 인수 확인
  const isTest = process.argv.includes('--test');
  
  const executeMethod = isTest ? 
    notifier.sendTestEmail.bind(notifier) : 
    notifier.execute.bind(notifier);
    
  executeMethod()
    .then(result => {
      console.log('이메일 발송 성공:', result.summary?.successfulSends || 0, '개');
      process.exit(0);
    })
    .catch(error => {
      console.error('이메일 발송 실패:', error.message);
      process.exit(1);
    });
}

module.exports = EmailNotifier;
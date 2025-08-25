/**
 * email-notifier.js
 * 블로그 생성 완료 알림 이메일 발송 모듈
 */

const nodemailer = require('nodemailer');

class EmailNotifier {
  constructor(logger) {
    this.logger = logger;
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * 이메일 전송기 초기화
   */
  initializeTransporter() {
    try {
      const gmailUser = process.env.GMAIL_USER;
      const gmailPassword = process.env.GMAIL_PASSWORD;
      
      if (!gmailUser || !gmailPassword) {
        throw new Error('Gmail 계정 정보가 설정되지 않았습니다.');
      }

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPassword
        }
      });

      this.logger?.info('이메일 전송기 초기화 완료');
    } catch (error) {
      this.logger?.error('이메일 전송기 초기화 실패', { error: error.message });
      throw error;
    }
  }

  /**
   * 블로그 생성 완료 알림 이메일 발송
   */
  async sendBlogCreatedNotification(blogData, generationInfo) {
    try {
      const notificationEmail = process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER;
      
      if (!notificationEmail) {
        throw new Error('알림 수신 이메일이 설정되지 않았습니다.');
      }

      await this.logger?.info('블로그 생성 완료 알림 이메일 발송 중');

      // 이메일 템플릿 생성
      const emailTemplate = this.createBlogNotificationTemplate(blogData, generationInfo);
      
      const mailOptions = {
        from: `"WebMaker AI Blog" <${process.env.GMAIL_USER}>`,
        to: notificationEmail,
        subject: `🎉 새 블로그 글이 생성되었습니다: ${blogData.title}`,
        html: emailTemplate.html,
        text: emailTemplate.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      await this.logger?.success('블로그 생성 완료 알림 이메일 발송 성공', {
        recipient: notificationEmail,
        messageId: result.messageId,
        blogTitle: blogData.title.substring(0, 50) + '...'
      });

      return {
        success: true,
        messageId: result.messageId,
        recipient: notificationEmail
      };

    } catch (error) {
      await this.logger?.error('블로그 생성 완료 알림 이메일 발송 실패', { error: error.message });
      throw error;
    }
  }

  /**
   * 블로그 생성 완료 이메일 템플릿 생성
   */
  createBlogNotificationTemplate(blogData, generationInfo) {
    const {
      title,
      sourceData,
      metadata
    } = blogData;

    const {
      blog,
      source,
      stats
    } = generationInfo;

    const blogUrl = `https://vercel.com/dongdongdongks-projects/web-maker/${blog.filename.replace('.md', '')}`;
    const redditUrl = sourceData.originalUrl;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WebMaker AI Blog - 새 글 생성 완료</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e3f2fd;
            }
            .logo {
                font-size: 32px;
                font-weight: bold;
                background: linear-gradient(135deg, #2196F3, #9C27B0);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 10px;
            }
            .subtitle {
                color: #666;
                font-size: 16px;
            }
            .blog-title {
                font-size: 24px;
                font-weight: bold;
                color: #1976d2;
                margin: 20px 0;
                padding: 20px;
                background: #e3f2fd;
                border-radius: 8px;
                text-align: center;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 30px 0;
            }
            .info-card {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #2196F3;
            }
            .info-card h3 {
                margin: 0 0 10px 0;
                color: #1976d2;
                font-size: 16px;
            }
            .info-card p {
                margin: 5px 0;
                font-size: 14px;
            }
            .source-info {
                background: #fff3e0;
                border-left-color: #ff9800;
                margin: 20px 0;
                padding: 20px;
                border-radius: 8px;
            }
            .reddit-link {
                display: inline-flex;
                align-items: center;
                background: #ff4500;
                color: white;
                padding: 12px 20px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 10px 5px;
            }
            .blog-link {
                display: inline-flex;
                align-items: center;
                background: #2196F3;
                color: white;
                padding: 12px 20px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 10px 5px;
            }
            .stats {
                background: #e8f5e8;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .stats h3 {
                color: #388e3c;
                margin-bottom: 15px;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                color: #666;
                font-size: 14px;
            }
            @media (max-width: 600px) {
                .info-grid {
                    grid-template-columns: 1fr;
                }
                .container {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🤖 WebMaker AI</div>
                <div class="subtitle">자동 블로그 생성 시스템</div>
            </div>

            <h2>🎉 새로운 블로그 글이 성공적으로 생성되었습니다!</h2>

            <div class="blog-title">
                "${title}"
            </div>

            <div class="info-grid">
                <div class="info-card">
                    <h3>📄 생성된 블로그 정보</h3>
                    <p><strong>파일명:</strong> ${blog.filename}</p>
                    <p><strong>글자 수:</strong> ${blog.contentLength.toLocaleString()}자</p>
                    <p><strong>단어 수:</strong> ${blog.wordCount.toLocaleString()}개</p>
                    <p><strong>카테고리:</strong> ${metadata.category}</p>
                </div>

                <div class="info-card">
                    <h3>⏱️ 생성 정보</h3>
                    <p><strong>생성 시간:</strong> ${Math.round(generationInfo.executionTimeMs / 1000)}초</p>
                    <p><strong>AI 모델:</strong> ${blogData.aiModel || 'gpt-4o'}</p>
                    <p><strong>생성 일시:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                    <p><strong>언어:</strong> ${blogData.outputLanguage === 'english' ? 'English' : '한국어'}</p>
                </div>
            </div>
            
            ${blogData.tokenUsage ? `
            <div class="info-card" style="grid-column: 1 / -1; margin-top: 20px;">
                <h3>🔢 토큰 사용량</h3>
                <p><strong>프롬프트 토큰:</strong> ${blogData.tokenUsage.prompt_tokens.toLocaleString()}개</p>
                <p><strong>완성 토큰:</strong> ${blogData.tokenUsage.completion_tokens.toLocaleString()}개</p>
                <p><strong>총 토큰:</strong> ${blogData.tokenUsage.total_tokens.toLocaleString()}개</p>
            </div>
            ` : ''}
            
            <div style="display: none;">
            </div>

            <div class="source-info">
                <h3>📍 원본 소스 정보</h3>
                <p><strong>플랫폼:</strong> ${metadata.source.platform}</p>
                <p><strong>서브레딧:</strong> r/${source.subreddit}</p>
                <p><strong>원본 제목:</strong> ${source.originalTitle}</p>
                <p><strong>인기도:</strong> ${source.engagement.upvotes.toLocaleString()} upvotes, ${source.engagement.comments.toLocaleString()} 댓글</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${redditUrl}" class="reddit-link">
                    🔗 Reddit 원본 글 보기
                </a>
                <a href="${blogUrl}" class="blog-link">
                    📖 생성된 블로그 보기
                </a>
            </div>

            <div class="stats">
                <h3>📊 생성 통계</h3>
                <p>• <strong>태그:</strong> ${metadata.tags.join(', ')}</p>
                <p>• <strong>작성자:</strong> ${metadata.author}</p>
            </div>

            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1976d2; margin-bottom: 10px;">💡 다음 단계</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>생성된 블로그 글을 검토하고 필요시 수정</li>
                    <li>SEO 최적화 상태 확인</li>
                    <li>소셜 미디어 공유 준비</li>
                    <li>다음 Reddit 트렌드 모니터링</li>
                </ul>
            </div>

            <div class="footer">
                <p>이 이메일은 WebMaker AI 블로그 자동 생성 시스템에서 발송되었습니다.</p>
                <p>문의사항이 있으시면 언제든지 연락주세요.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 12px; color: #999;">
                    Generated at ${new Date().toISOString()} | WebMaker AI v1.0.0
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    const text = `
🎉 WebMaker AI - 새 블로그 글 생성 완료!

제목: ${title}

📄 블로그 정보:
- 파일명: ${blog.filename}
- 글자 수: ${blog.contentLength.toLocaleString()}자
- 생성 시간: ${Math.round(generationInfo.executionTimeMs / 1000)}초${blogData.tokenUsage ? `
- 프롬프트 토큰: ${blogData.tokenUsage.prompt_tokens.toLocaleString()}개
- 완성 토큰: ${blogData.tokenUsage.completion_tokens.toLocaleString()}개
- 총 토큰: ${blogData.tokenUsage.total_tokens.toLocaleString()}개` : ''}

📍 원본 소스:
- 플랫폼: ${metadata.source.platform}
- 서브레딧: r/${source.subreddit}
- 원본 제목: ${source.originalTitle}
- 인기도: ${source.engagement.upvotes.toLocaleString()} upvotes

🔗 링크:
- Reddit 원본: ${redditUrl}
- 생성된 블로그: ${blogUrl}

📊 통계:
- 카테고리: ${metadata.category}
- 태그: ${metadata.tags.join(', ')}
- 언어: 한국어
- 작성자: ${metadata.author}

---
이 이메일은 WebMaker AI 블로그 자동 생성 시스템에서 발송되었습니다.
생성 일시: ${new Date().toLocaleString('ko-KR')}
    `;

    return { html, text };
  }

  /**
   * 블로그 생성 실패 알림 이메일 발송
   */
  async sendBlogFailureNotification(error, attemptedSteps = [], additionalInfo = {}) {
    try {
      const notificationEmail = process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER;
      
      if (!notificationEmail) {
        throw new Error('알림 수신 이메일이 설정되지 않았습니다.');
      }

      await this.logger?.info('블로그 생성 실패 알림 이메일 발송 중');

      // 이메일 템플릿 생성
      const emailTemplate = this.createFailureNotificationTemplate(error, attemptedSteps, additionalInfo);
      
      const mailOptions = {
        from: `"WebMaker AI Blog" <${process.env.GMAIL_USER}>`,
        to: notificationEmail,
        subject: `⚠️ 블로그 글 생성 실패: ${error.message.substring(0, 50)}...`,
        html: emailTemplate.html,
        text: emailTemplate.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      await this.logger?.success('블로그 생성 실패 알림 이메일 발송 성공', {
        recipient: notificationEmail,
        messageId: result.messageId,
        errorType: error.name || 'Unknown Error'
      });

      return {
        success: true,
        messageId: result.messageId,
        recipient: notificationEmail
      };

    } catch (emailError) {
      await this.logger?.error('블로그 생성 실패 알림 이메일 발송 실패', { 
        originalError: error.message,
        emailError: emailError.message 
      });
      throw emailError;
    }
  }

  /**
   * 블로그 생성 실패 이메일 템플릿 생성
   */
  createFailureNotificationTemplate(error, attemptedSteps = [], additionalInfo = {}) {
    const failureTime = new Date().toLocaleString('ko-KR');
    const errorType = error.name || 'Unknown Error';
    const errorMessage = error.message || 'Unknown error occurred';
    
    // 시도한 단계들을 HTML 리스트로 변환
    const stepsList = attemptedSteps.length > 0 
      ? attemptedSteps.map(step => `<li>${step}</li>`).join('')
      : '<li>단계 정보가 기록되지 않았습니다.</li>';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WebMaker AI Blog - 생성 실패 알림</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #ffebee;
            }
            .logo {
                font-size: 32px;
                font-weight: bold;
                background: linear-gradient(135deg, #f44336, #ff9800);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 10px;
            }
            .subtitle {
                color: #666;
                font-size: 16px;
            }
            .error-title {
                font-size: 24px;
                font-weight: bold;
                color: #d32f2f;
                margin: 20px 0;
                padding: 20px;
                background: #ffebee;
                border-radius: 8px;
                text-align: center;
            }
            .error-details {
                background: #fff3e0;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #ff9800;
                margin: 20px 0;
            }
            .error-details h3 {
                margin: 0 0 10px 0;
                color: #e65100;
                font-size: 18px;
            }
            .error-code {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 6px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                color: #d32f2f;
                margin: 10px 0;
                word-break: break-word;
            }
            .steps-attempted {
                background: #e3f2fd;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .steps-attempted h3 {
                color: #1976d2;
                margin-bottom: 15px;
            }
            .steps-attempted ul {
                margin: 0;
                padding-left: 20px;
            }
            .steps-attempted li {
                margin: 8px 0;
                color: #424242;
            }
            .troubleshooting {
                background: #e8f5e8;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .troubleshooting h3 {
                color: #388e3c;
                margin-bottom: 15px;
            }
            .action-needed {
                background: #ffecb3;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #ffa000;
            }
            .action-needed h3 {
                color: #e65100;
                margin-bottom: 15px;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                color: #666;
                font-size: 14px;
            }
            .btn {
                display: inline-block;
                background: #2196F3;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 10px 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">⚠️ WebMaker AI</div>
                <div class="subtitle">자동 블로그 생성 시스템</div>
            </div>

            <div class="error-title">
                블로그 글 생성이 실패했습니다
            </div>

            <div class="error-details">
                <h3>🚨 오류 정보</h3>
                <p><strong>오류 유형:</strong> ${errorType}</p>
                <p><strong>발생 시간:</strong> ${failureTime}</p>
                <p><strong>오류 메시지:</strong></p>
                <div class="error-code">${errorMessage}</div>
            </div>

            <div class="steps-attempted">
                <h3>📋 시도한 작업 단계</h3>
                <ul>
                    ${stepsList}
                </ul>
            </div>

            ${additionalInfo.redditData ? `
            <div class="error-details">
                <h3>📍 소스 정보 (Reddit)</h3>
                <p><strong>서브레딧:</strong> r/${additionalInfo.redditData.subreddit || 'Unknown'}</p>
                <p><strong>원본 제목:</strong> ${(additionalInfo.redditData.originalTitle || 'Unknown').substring(0, 100)}...</p>
                ${additionalInfo.redditData.originalUrl ? `<p><strong>원본 URL:</strong> <a href="${additionalInfo.redditData.originalUrl}">${additionalInfo.redditData.originalUrl}</a></p>` : ''}
            </div>
            ` : ''}

            <div class="troubleshooting">
                <h3>🔧 문제 해결 가이드</h3>
                <ul>
                    <li><strong>API 키 확인:</strong> OPENAI_API_KEY, REDDIT_CLIENT_ID 등 환경변수 설정 확인</li>
                    <li><strong>네트워크 연결:</strong> 인터넷 연결 및 API 서버 상태 확인</li>
                    <li><strong>Reddit 데이터:</strong> 대상 서브레딧의 데이터 접근 가능 여부 확인</li>
                    <li><strong>OpenAI 사용량:</strong> API 사용 한도 및 크레딧 잔량 확인</li>
                    <li><strong>파일 권한:</strong> 블로그 파일 생성 디렉토리 쓰기 권한 확인</li>
                </ul>
            </div>

            <div class="action-needed">
                <h3>💡 권장 조치사항</h3>
                <ul>
                    <li>환경변수 설정 재확인 (.env 파일)</li>
                    <li>Reddit API 액세스 권한 확인</li>
                    <li>OpenAI API 계정 상태 및 잔액 확인</li>
                    <li>로그 파일에서 상세 오류 정보 확인</li>
                    <li>스크립트 수동 실행으로 문제 재현 및 디버깅</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://platform.openai.com/account/usage" class="btn">
                    OpenAI 사용량 확인
                </a>
                <a href="https://www.redditstatus.com/" class="btn">
                    Reddit 상태 확인
                </a>
            </div>

            <div class="footer">
                <p>이 이메일은 WebMaker AI 블로그 자동 생성 시스템에서 발송되었습니다.</p>
                <p>문제가 지속되면 시스템 관리자에게 문의하세요.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 12px; color: #999;">
                    Failure detected at ${new Date().toISOString()} | WebMaker AI v1.0.0
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    const text = `
⚠️ WebMaker AI - 블로그 글 생성 실패 알림

🚨 오류 정보:
- 오류 유형: ${errorType}
- 발생 시간: ${failureTime}
- 오류 메시지: ${errorMessage}

📋 시도한 작업 단계:
${attemptedSteps.length > 0 ? attemptedSteps.map((step, index) => `${index + 1}. ${step}`).join('\n') : '단계 정보가 기록되지 않았습니다.'}

${additionalInfo.redditData ? `
📍 소스 정보 (Reddit):
- 서브레딧: r/${additionalInfo.redditData.subreddit || 'Unknown'}
- 원본 제목: ${(additionalInfo.redditData.originalTitle || 'Unknown').substring(0, 100)}...
${additionalInfo.redditData.originalUrl ? `- 원본 URL: ${additionalInfo.redditData.originalUrl}` : ''}
` : ''}

🔧 문제 해결 가이드:
1. API 키 확인: OPENAI_API_KEY, REDDIT_CLIENT_ID 등 환경변수 설정 확인
2. 네트워크 연결: 인터넷 연결 및 API 서버 상태 확인
3. Reddit 데이터: 대상 서브레딧의 데이터 접근 가능 여부 확인
4. OpenAI 사용량: API 사용 한도 및 크레딧 잔량 확인
5. 파일 권한: 블로그 파일 생성 디렉토리 쓰기 권한 확인

💡 권장 조치사항:
- 환경변수 설정 재확인 (.env 파일)
- Reddit API 액세스 권한 확인
- OpenAI API 계정 상태 및 잔액 확인
- 로그 파일에서 상세 오류 정보 확인
- 스크립트 수동 실행으로 문제 재현 및 디버깅

확인 링크:
- OpenAI 사용량: https://platform.openai.com/account/usage
- Reddit 상태: https://www.redditstatus.com/

---
이 이메일은 WebMaker AI 블로그 자동 생성 시스템에서 발송되었습니다.
문제가 지속되면 시스템 관리자에게 문의하세요.
실패 감지 시간: ${new Date().toLocaleString('ko-KR')}
    `;

    return { html, text };
  }

  /**
   * 이메일 전송 테스트
   */
  async testEmail() {
    try {
      const testEmail = process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER;
      
      const mailOptions = {
        from: `"WebMaker AI Blog" <${process.env.GMAIL_USER}>`,
        to: testEmail,
        subject: '🧪 WebMaker AI 이메일 시스템 테스트',
        html: `
        <h2>WebMaker AI 이메일 시스템 테스트</h2>
        <p>이 이메일은 WebMaker AI 블로그 시스템의 이메일 기능 테스트입니다.</p>
        <p><strong>발송 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
        <p><strong>상태:</strong> ✅ 정상 작동</p>
        `,
        text: `WebMaker AI 이메일 시스템 테스트\n\n발송 시간: ${new Date().toLocaleString('ko-KR')}\n상태: 정상 작동`
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      await this.logger?.success('테스트 이메일 발송 성공', {
        messageId: result.messageId,
        recipient: testEmail
      });

      return result;
    } catch (error) {
      await this.logger?.error('테스트 이메일 발송 실패', { error: error.message });
      throw error;
    }
  }
}

module.exports = EmailNotifier;
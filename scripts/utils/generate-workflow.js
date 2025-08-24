#!/usr/bin/env node
/**
 * generate-workflow.js
 * automation.config.js를 기반으로 GitHub Actions workflow 생성
 */

const fs = require('fs');
const path = require('path');
const ScheduleHelper = require('./schedule-helper.js');

class WorkflowGenerator {
  
  static generateWorkflowYAML() {
    const crons = ScheduleHelper.generateCronExpression();
    
    if (crons.length === 0) {
      console.log('⚠️ 스케줄이 비활성화되어 있습니다.');
      return;
    }

    const cronSchedules = crons.map(cron => `    - cron: '${cron.cron}'  # ${cron.description}`).join('\n');

    const workflowContent = `name: Automated Blog Generation

on:
  # automation.config.js 기반 자동 스케줄
  schedule:
${cronSchedules}
  
  # 수동 실행 가능
  workflow_dispatch:
    inputs:
      template:
        description: 'Blog template to use'
        required: false
        default: 'summary'
        type: choice
        options:
          - summary
          - engaging
          - informative
          - analytical

jobs:
  generate-blog:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: \${{ secrets.GITHUB_TOKEN }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm install
      
      - name: Set template if manual run
        if: github.event_name == 'workflow_dispatch'
        run: |
          sed -i 's/promptTemplate: "\[^"\]*"/promptTemplate: "\${{ inputs.template }}"/' config/site.config.js
          echo "🔧 Template set to: \${{ inputs.template }}"
      
      - name: Generate blog post
        env:
          OPENAI_API_KEY: \${{ secrets.OPENAI_API_KEY }}
          NEWS_API_KEY: \${{ secrets.NEWS_API_KEY }}
          GNEWS_API_KEY: \${{ secrets.GNEWS_API_KEY }}
          REDDIT_CLIENT_ID: \${{ secrets.REDDIT_CLIENT_ID }}
          REDDIT_CLIENT_SECRET: \${{ secrets.REDDIT_CLIENT_SECRET }}
          REDDIT_USER_AGENT: \${{ secrets.REDDIT_USER_AGENT }}
          GMAIL_USER: \${{ secrets.GMAIL_USER }}
          GMAIL_PASSWORD: \${{ secrets.GMAIL_PASSWORD }}
          NOTIFICATION_EMAIL: \${{ secrets.NOTIFICATION_EMAIL }}
          UNSPLASH_ACCESS_KEY: \${{ secrets.UNSPLASH_ACCESS_KEY }}
        run: |
          echo "🚀 Starting blog generation..."
          
          # automation.config.js를 사용하여 현재 템플릿 결정
          template=\$(node -e "
            const ScheduleHelper = require('./scripts/utils/schedule-helper.js');
            console.log(ScheduleHelper.getCurrentTemplate());
          ")
          
          echo "🎯 Using template based on config: \$template"
          sed -i "s/promptTemplate: \\"[^\\"]*\\"/promptTemplate: \\"\$template\\"/" config/site.config.js
          
          node scripts/generate-reddit-blog.js
          echo "✅ Blog generation completed"
      
      - name: Configure Git
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action Bot"
      
      - name: Commit and push changes
        run: |
          git add content/posts/
          git add config/
          if ! git diff --staged --quiet; then
            timestamp=\$(date -u '+%Y-%m-%d %H:%M UTC')
            template=\$(grep -o 'promptTemplate: "\[^"\]*"' config/site.config.js | cut -d'"' -f2)
            
            git commit -m "chore: 자동 블로그 포스트 생성 (\$template) - \$timestamp"
            git push
            echo "✅ New blog post committed and pushed"
          else
            echo "ℹ️ No changes to commit"
          fi
      
      - name: Notify on failure
        if: failure()
        run: |
          echo "❌ Blog generation failed"
`;

    return workflowContent;
  }

  static updateWorkflowFile() {
    const workflowContent = this.generateWorkflowYAML();
    if (!workflowContent) return;

    const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'daily-blog-generation.yml');
    
    try {
      fs.writeFileSync(workflowPath, workflowContent, 'utf8');
      console.log('✅ GitHub Actions workflow가 automation.config.js 기반으로 업데이트되었습니다.');
      console.log(`📁 파일: ${workflowPath}`);
      
      // 생성된 스케줄 정보 표시
      ScheduleHelper.printScheduleInfo();
      
    } catch (error) {
      console.error('❌ workflow 파일 업데이트 실패:', error.message);
    }
  }
}

// 직접 실행 시 workflow 업데이트
if (require.main === module) {
  console.log('🔄 automation.config.js 기반으로 GitHub Actions workflow 생성 중...');
  WorkflowGenerator.updateWorkflowFile();
}

module.exports = WorkflowGenerator;
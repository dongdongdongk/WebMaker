# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebMaker - AI-powered automated blog system with GitHub Actions integration
- **Goal**: Keyword-based content generation → AI writing → SEO optimization → automated publishing
- **Core Workflow**: Keywords → Crawling → AI Generation → SEO → GitHub → Next.js Deploy → Email Notification

## Project Architecture

```
src/                           # Next.js 14 blog (Vercel deployment)
├── app/
│   ├── [slug]/page.tsx        # Individual blog posts
│   ├── sitemap.xml/route.ts   # Dynamic sitemap generation
│   ├── robots.txt/route.ts    # Dynamic robots.txt
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Homepage
│   └── design-preview/page.tsx # Design system preview
├── components/
│   ├── design/                # Design system components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── BlogPost.tsx
│   ├── SEO.tsx                # SEO meta components
│   └── PostList.tsx
└── lib/
    ├── posts.ts               # Markdown post utilities
    ├── seo-utils.ts           # SEO optimization utilities
    └── markdown.ts            # Markdown parsing

scripts/                       # GitHub Actions automation scripts
├── collect-keywords.js        # Google Trends/News API integration
├── crawl-content.js           # Content crawling with Puppeteer
├── generate-post.js           # OpenAI-powered blog generation
├── optimize-seo.js            # SEO optimization pipeline
├── send-email.js              # Email notifications
└── utils/                     # Shared utilities

.github/workflows/
├── daily-content.yml          # Main automation (daily UTC 2AM)
├── deploy.yml                 # Vercel deployment
└── test.yml                   # Testing pipeline

content/posts/                 # Auto-generated markdown content
config/                        # JSON configuration files
```

## Common Commands

```bash
# Development
npm run dev                    # Start Next.js dev server
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run type-check             # TypeScript type checking

# Script Testing (local)
node scripts/collect-keywords.js
node scripts/crawl-content.js
node scripts/generate-post.js
node scripts/optimize-seo.js
node scripts/send-email.js

# GitHub Actions Testing
gh workflow run daily-content.yml
gh workflow list
gh run list
```

## SSR and Component Structure Guidelines

**SSR-First Principle**
- All pages and components should be implemented with **Server-Side Rendering (SSR)** by default.  
- Leverage SSR for **SEO optimization** and **initial loading performance**.  
- Static content, blog posts, and metadata should always be rendered on the server.  

**When to Use Client Components**
- Use **client components** (`'use client'`) **only** in the following cases:

- **User interaction**: Form inputs, button click events  
- **Browser APIs**: Using `localStorage`, `geolocation`, or the `window` object  
- **State management**: When React hooks such as `useState` or `useEffect` are required  
- **Real-time features**: Search autocomplete, real-time filtering  
- **Animations**: Complex and interactive animations  

## Core Automation Flow

**Daily GitHub Actions Pipeline (UTC 2AM):**
1. Environment setup (Node.js, dependencies)
2. Keyword collection (`scripts/collect-keywords.js`)
3. Content crawling (`scripts/crawl-content.js`) 
4. AI blog generation (`scripts/generate-post.js`)
5. SEO optimization (`scripts/optimize-seo.js`)
6. GitHub commit (auto-generated content)
7. Vercel deployment trigger
8. Email notification (`scripts/send-email.js`)

**Deployment Flow:** New post commit → GitHub webhook → Vercel auto-build → Site update → Sitemap refresh

## Script Architecture

**Data Flow Pipeline:**
- `collect-keywords.js` → `keywords-today.json` (Google Trends/News API)
- `crawl-content.js` → `content-data.json` (Puppeteer web scraping)  
- `generate-post.js` → `content/posts/*.md` (OpenAI blog generation)
- `optimize-seo.js` → Enhanced markdown (meta tags, keyword density)
- `send-email.js` → Email notifications (success/failure templates)

**Execution Times:** Keywords (3min) → Crawling (7min) → AI Generation (15min) → SEO (3min) → Email (30sec)

## Development Implementation Order

**Step 0: Design System**
- Create `/design-preview` page with component library
- Implement typography hierarchy and responsive layout system
- Build interactive design testing tools (mobile/tablet/desktop)

**Step 1: Next.js Foundation + Vercel Deploy**
- Initialize Next.js 14 project with App Router
- Implement markdown parsing (`lib/markdown.ts`, `lib/posts.ts`)
- Configure Vercel auto-deployment
- Test: Manual markdown file → auto deployment

**Step 2: SEO Optimization System**
- Dynamic sitemap generation (`app/sitemap.xml/route.ts`)
- SEO component with meta tags (`components/SEO.tsx`)
- Dynamic robots.txt (`app/robots.txt/route.ts`)
- Test: SEO tool validation

**Step 3: GitHub Actions Script Foundation**
- Create `scripts/` structure with utility helpers
- Basic keyword collection logic
- Email notification system
- Test: Individual script execution locally

**Step 4-6: API Integration Pipeline**
- Google Trends API integration → keyword collection
- Puppeteer web scraping → content crawling  
- OpenAI API integration → blog generation
- Test: Each script independently, then in sequence

**Step 7: Unified GitHub Actions Workflow**
- Complete `daily-content.yml` with full pipeline
- Error handling and environment variable management
- Test: End-to-end automated workflow

**Step 8: Monitoring & Notifications**
- Email templates for success/failure scenarios
- Detailed logging and statistics
- Error recovery mechanisms

## Required Environment Variables

**GitHub Repository Secrets:**
```bash
OPENAI_API_KEY=sk-...                 # OpenAI API key
GOOGLE_TRENDS_API_KEY=...             # Google Trends API
NEWS_API_KEY=...                      # News API (optional)
GMAIL_USER=your-email@gmail.com       # Gmail account
GMAIL_PASSWORD=app-password           # Gmail app password
NOTIFICATION_EMAIL=notify@example.com  # Notification recipient
```

## Image Handling Strategy

**Free Image Integration:** Use Picsum placeholder service in markdown frontmatter and content:

```markdown
---
title: "AI Trends 2025"  
image: "https://picsum.photos/1200/600?random=1"
---

![AI Technology](https://picsum.photos/800/400?random=2)
```

**Note:** Unsplash source.unsplash.com service has been deprecated. Use Picsum (https://picsum.photos/) for reliable placeholder images with different random parameters.

## Design System Implementation

**Design Preview Page (`/design-preview`):**
- Typography hierarchy (headings, body, code, quotes)
- Complete UI component library demonstration
- Responsive layout system with breakpoint testing
- Interactive state demos (hover, active, loading)
- Mobile/tablet/desktop responsive testing tools

**Purpose:** Design validation, team collaboration guide, client feedback collection tool
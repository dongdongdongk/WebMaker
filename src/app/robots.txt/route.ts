import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/posts'

export async function GET(): Promise<Response> {
  const baseUrl = 'https://webmaker-ai-blog.vercel.app' // 실제 도메인으로 변경 필요
  const posts = await getAllPosts()
  
  // 동적으로 모든 블로그 포스트 경로 생성
  const blogPosts = posts.map(post => `Allow: /${post.slug}`).join('\n')
  
  const robotsTxt = `User-agent: *
Allow: /

# 주요 페이지들
Allow: /
Allow: /design-preview

# 모든 블로그 포스트들 (자동 생성)
${blogPosts}

# 정적 자산들
Allow: /images/
Allow: /icons/
Allow: /_next/static/

# 제외할 경로들
Disallow: /api/
Disallow: /_next/
Disallow: /admin/
Disallow: /private/

# 사이트맵 위치
Sitemap: ${baseUrl}/sitemap.xml

# 크롤링 지연 (밀리초)
Crawl-delay: 1

# 구글봇 특별 설정
User-agent: Googlebot
Allow: /
Crawl-delay: 0

# 빙봇 설정
User-agent: Bingbot
Allow: /
Crawl-delay: 1

# 네이버봇 설정
User-agent: Yeti
Allow: /
Crawl-delay: 1

# 다음봇 설정
User-agent: Daumoa
Allow: /
Crawl-delay: 1`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24시간 캐시
    },
  })
}

// Next.js의 기본 robots 함수도 지원
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://webmaker-ai-blog.vercel.app'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/admin/', '/private/'],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 0,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
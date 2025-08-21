import { remark } from 'remark'
import html from 'remark-html'
import gfm from 'remark-gfm'
import matter from 'gray-matter'

export interface PostFrontMatter {
  title: string
  date: string
  slug: string
  excerpt?: string
  image?: string
  tags?: string[]
  author?: string
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
  }
}

export interface ParsedPost {
  frontMatter: PostFrontMatter
  content: string
  htmlContent: string
}

export async function parseMarkdown(markdownContent: string): Promise<ParsedPost> {
  const { data: frontMatter, content } = matter(markdownContent)
  
  const processedContent = await remark()
    .use(gfm)
    .use(html, { sanitize: false })
    .process(content)
  
  const htmlContent = processedContent.toString()
  
  return {
    frontMatter: frontMatter as PostFrontMatter,
    content,
    htmlContent
  }
}

export function extractExcerpt(content: string, maxLength: number = 150): string {
  const textContent = content.replace(/[#*`\[\]()]/g, '').trim()
  if (textContent.length <= maxLength) return textContent
  
  const truncated = textContent.slice(0, maxLength)
  const lastSpaceIndex = truncated.lastIndexOf(' ')
  
  return lastSpaceIndex > 0 
    ? truncated.slice(0, lastSpaceIndex) + '...'
    : truncated + '...'
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
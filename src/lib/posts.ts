import fs from 'fs'
import path from 'path'
import { parseMarkdown, PostFrontMatter, ParsedPost, extractExcerpt, generateSlug } from './markdown'

const POSTS_DIRECTORY = path.join(process.cwd(), 'content', 'posts')

export interface Post extends PostFrontMatter {
  htmlContent: string
  readingTime: number
}

export interface PostSummary {
  slug: string
  title: string
  date: string
  excerpt: string
  image?: string
  tags?: string[]
  author?: string
  readingTime: number
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const fullPath = path.join(POSTS_DIRECTORY, `${slug}.md`)
    
    if (!fs.existsSync(fullPath)) {
      return null
    }
    
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { frontMatter, content, htmlContent } = await parseMarkdown(fileContents)
    
    const readingTime = calculateReadingTime(content)
    
    return {
      ...frontMatter,
      htmlContent,
      readingTime,
      slug: frontMatter.slug || slug
    }
  } catch (error) {
    console.error(`Error loading post ${slug}:`, error)
    return null
  }
}

export async function getAllPosts(): Promise<PostSummary[]> {
  try {
    if (!fs.existsSync(POSTS_DIRECTORY)) {
      fs.mkdirSync(POSTS_DIRECTORY, { recursive: true })
      return []
    }
    
    const fileNames = fs.readdirSync(POSTS_DIRECTORY)
    const markdownFiles = fileNames.filter(name => name.endsWith('.md'))
    
    const posts: PostSummary[] = []
    
    for (const fileName of markdownFiles) {
      const slug = fileName.replace(/\.md$/, '')
      const post = await getPostBySlug(slug)
      
      if (post) {
        posts.push({
          slug: post.slug,
          title: post.title,
          date: post.date,
          excerpt: post.excerpt || extractExcerpt(post.htmlContent.replace(/<[^>]*>/g, '')),
          image: post.image,
          tags: post.tags,
          author: post.author,
          readingTime: post.readingTime
        })
      }
    }
    
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('Error loading posts:', error)
    return []
  }
}

export async function getPostsByTag(tag: string): Promise<PostSummary[]> {
  const allPosts = await getAllPosts()
  return allPosts.filter(post => 
    post.tags && post.tags.some(postTag => 
      postTag.toLowerCase() === tag.toLowerCase()
    )
  )
}

export async function getAllTags(): Promise<Array<{ tag: string; count: number }>> {
  const allPosts = await getAllPosts()
  const tagCounts: Record<string, number> = {}
  
  allPosts.forEach(post => {
    post.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}

export function createPostFile(title: string, content: string, metadata: Partial<PostFrontMatter> = {}): string {
  const slug = metadata.slug || generateSlug(title)
  const date = metadata.date || new Date().toISOString().split('T')[0]
  
  const frontMatter = {
    title,
    date,
    slug,
    excerpt: metadata.excerpt,
    image: metadata.image,
    tags: metadata.tags || [],
    author: metadata.author || 'AI Assistant',
    ...metadata
  }
  
  const yamlFrontMatter = Object.entries(frontMatter)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}:\n${value.map(item => `  - ${item}`).join('\n')}`
      }
      if (typeof value === 'object' && value !== null) {
        return `${key}:\n${Object.entries(value).map(([k, v]) => `  ${k}: ${v}`).join('\n')}`
      }
      return `${key}: ${JSON.stringify(value)}`
    })
    .join('\n')
  
  return `---\n${yamlFrontMatter}\n---\n\n${content}`
}
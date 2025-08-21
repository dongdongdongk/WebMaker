import { PostSummary } from '@/lib/posts'
import BlogPost from './BlogPost'

interface PostListProps {
  posts: PostSummary[]
  title?: string
  showTitle?: boolean
}

export default function PostList({ posts, title = "최신 게시물", showTitle = true }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">
          아직 게시물이 없습니다
        </div>
        <p className="text-gray-400 text-sm">
          AI가 곧 새로운 콘텐츠를 생성할 예정입니다
        </p>
      </div>
    )
  }

  return (
    <section className="w-full">
      {showTitle && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <div className="w-16 h-1 bg-blue-600"></div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogPost key={post.slug} post={post} />
        ))}
      </div>
      
      <div className="text-center mt-8 text-sm text-gray-500">
        총 {posts.length}개의 게시물
      </div>
    </section>
  )
}
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { PostDetail } from '../../shared/types'
import { fetchPost, updatePost } from '../utils/api'
import PostForm from '../components/PostForm'

export default function EditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const numId = Number(id)
    if (!Number.isFinite(numId)) {
      setError('无效的文章 ID')
      setLoading(false)
      return
    }
    fetchPost(numId)
      .then(setPost)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  // 浏览器标签页显示编辑中的文章标题
  useEffect(() => {
    if (post) {
      document.title = `编辑 - ${post.title} · Su777 的博客`
    }
    return () => {
      document.title = "Su777 的博客 · Su777's Blog"
    }
  }, [post])

  async function handleSubmit(data: {
    title: string
    content: string
    tags: string[]
    category: string | null
    public: boolean
    excerpt: string | null
  }) {
    const numId = Number(id)
    await updatePost(numId, data)
    navigate(`/posts/${numId}`)
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-line rounded" />
          <div className="h-10 w-2/3 bg-line rounded" />
          <div className="h-64 w-full bg-line/60 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <p className="font-display text-2xl text-clay mb-3">{error}</p>
        <Link to="/" className="font-mono text-sm text-muted hover:text-clay">
          ← 返回首页
        </Link>
      </div>
    )
  }

  if (!post) return null

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link
        to={`/posts/${post.id}`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-sm
          bg-green-600 hover:bg-green-700 text-white rounded transition-colors mb-8"
      >
        <ArrowLeft size={13} />
        返回文章
      </Link>
      <header className="mb-10">
        <h1 className="font-display font-bold text-3xl text-ink mb-2">
          编辑 - {post.title}
        </h1>
        <p className="font-serif text-muted">修改文章内容与元数据。</p>
      </header>
      <PostForm
        initialTitle={post.title}
        initialTags={post.tags}
        initialCategory={post.category}
        initialPublic={post.public}
        initialExcerpt={post.excerpt}
        initialContent={post.content}
        submitLabel="保存修改"
        onSubmit={handleSubmit}
      />
    </div>
  )
}

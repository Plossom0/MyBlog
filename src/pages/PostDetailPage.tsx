import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Pencil, Trash2, ArrowLeft } from 'lucide-react'
import type { PostDetail } from '../../shared/types'
import { fetchPost, deletePost } from '../utils/api'
import { formatDate } from '../utils/format'
import MarkdownRenderer from '../components/MarkdownRenderer'
import Toc from '../components/Toc'
import { useToc } from '../hooks/useToc'

export default function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const articleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const numId = Number(id)
    if (!Number.isFinite(numId)) {
      setError('无效的文章 ID')
      setLoading(false)
      return
    }
    setLoading(true)
    fetchPost(numId)
      .then(setPost)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const { headings, activeId } = useToc(articleRef, post?.content ?? '')

  function jumpTo(targetId: string) {
    const el = document.getElementById(targetId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleDelete() {
    if (!post) return
    if (!window.confirm(`确定删除《${post.title}》吗？此操作不可撤销。`)) return
    try {
      await deletePost(post.id)
      navigate('/')
    } catch (e) {
      window.alert((e as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="max-w-prose mx-auto px-6 py-20">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-2/3 bg-line rounded" />
          <div className="h-4 w-40 bg-line/60 rounded" />
          <div className="h-4 w-full bg-line/40 rounded mt-8" />
          <div className="h-4 w-full bg-line/40 rounded" />
          <div className="h-4 w-5/6 bg-line/40 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-prose mx-auto px-6 py-20 text-center">
        <p className="font-display text-2xl text-clay mb-3">{error}</p>
        <Link to="/" className="font-mono text-sm text-muted hover:text-clay">
          ← 返回首页
        </Link>
      </div>
    )
  }

  if (!post) return null

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted hover:text-clay transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        返回列表
      </Link>

      <div className="flex gap-12">
        <article className="flex-1 min-w-0">
          {/* 文章头部 */}
          <header className="mb-10 animate-fade-in">
            <h1 className="font-display font-bold text-4xl md:text-5xl text-ink leading-tight mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <time className="font-mono text-sm text-muted">
                {formatDate(post.created_at)}
              </time>
              {post.updated_at !== post.created_at && (
                <span className="font-mono text-sm text-muted">
                  · 更新于 {formatDate(post.updated_at)}
                </span>
              )}
              {post.tags.map((t) => (
                <span key={t} className="tag-chip">
                  #{t}
                </span>
              ))}
            </div>
            <div className="border-t border-line mt-6" />
          </header>

          {/* 正文 */}
          <div ref={articleRef}>
            <MarkdownRenderer content={post.content} />
          </div>

          {/* 操作栏 */}
          <div className="flex items-center gap-3 mt-16 pt-6 border-t border-line">
            <Link
              to={`/posts/${post.id}/edit`}
              className="flex items-center gap-1.5 px-4 py-2 font-mono text-sm
                border border-line text-ink/70 rounded-md hover:border-clay hover:text-clay transition-colors"
            >
              <Pencil size={14} />
              编辑
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-4 py-2 font-mono text-sm
                border border-line text-ink/70 rounded-md hover:border-clay hover:text-clay transition-colors"
            >
              <Trash2 size={14} />
              删除
            </button>
          </div>
        </article>

        {/* TOC 侧边栏 */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24">
            <Toc headings={headings} activeId={activeId} onJump={jumpTo} />
          </div>
        </aside>
      </div>
    </div>
  )
}

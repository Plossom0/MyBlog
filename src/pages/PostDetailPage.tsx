import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Pencil, Trash2, ArrowLeft } from 'lucide-react'
import type { PostDetail } from '../../shared/types'
import { fetchPost, deletePost } from '../utils/api'
import { formatDate } from '../utils/format'
import MarkdownRenderer from '../components/MarkdownRenderer'
import Toc from '../components/Toc'
import { useToc } from '../hooks/useToc'
import { useAuth } from '../utils/auth'

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

  // 浏览器标签页显示文章标题
  useEffect(() => {
    if (post) {
      document.title = `${post.title} · Su777 的博客`
    }
    return () => {
      document.title = "Su777 的博客 · Su777's Blog"
    }
  }, [post])

  const { headings, activeId } = useToc(articleRef, post?.content ?? '')
  const { loggedIn } = useAuth()

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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-sm
          bg-green-600 hover:bg-green-700 text-white rounded transition-colors mb-8"
      >
        <ArrowLeft size={13} />
        返回列表
      </Link>

      <div className="flex gap-12">
        <article className="flex-1 min-w-0">
          {/* 文章头部（洛谷风格） */}
          <header className="mb-8 animate-fade-in">
            <h1 className="font-article font-bold text-3xl md:text-4xl text-ink leading-[1.3] mb-4">
              {!post.public && <span className="mr-2">🔒</span>}
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
              <span className="font-article">
                作者 <span className="text-ink">Su777</span>
              </span>
              <span className="text-line">|</span>
              <time className="font-article">
                发布时间 {formatDate(post.created_at)}
              </time>
              {post.updated_at !== post.created_at && (
                <>
                  <span className="text-line">|</span>
                  <time className="font-article">
                    更新于 {formatDate(post.updated_at)}
                  </time>
                </>
              )}
            </div>
            {(post.category || post.tags.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.category && (
                  <span className="tag-chip tag-category">
                    {post.category}
                  </span>
                )}
                {post.tags.map((t) => (
                  <span key={t} className="tag-chip tag-algo">
                    #{t}
                  </span>
                ))}
              </div>
            )}
            {loggedIn && (
              <div className="flex items-center gap-2 mt-4">
                <Link
                  to={`/posts/${post.id}/edit`}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-sm
                    bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  <Pencil size={13} />
                  编辑
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-sm
                    bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  <Trash2 size={13} />
                  删除
                </button>
              </div>
            )}
            <div className="border-t border-line mt-6" />
          </header>

          {/* 摘要高亮框 */}
          {post.excerpt && (
            <div className="mb-8 rounded-r-lg border-l-4 border-clay bg-clay/5 px-5 py-4">
              <p className="font-mono text-xs text-clay/80 uppercase tracking-wider mb-1.5">
                摘要
              </p>
              <p className="font-serif text-base text-ink/80 leading-relaxed">
                {post.excerpt}
              </p>
            </div>
          )}

          {/* 正文 */}
          <div ref={articleRef}>
            <MarkdownRenderer content={post.content} />
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

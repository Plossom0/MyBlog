import { Link } from 'react-router-dom'
import type { PostMeta } from '../../shared/types'
import { formatDate } from '../utils/format'

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 将文本中命中的关键词标红加粗
function Highlight({ text, query }: { text: string; query: string }) {
  const terms = query.trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return <>{text}</>
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi')
  const testPattern = new RegExp(
    `^(?:${terms.map(escapeRegExp).join('|')})$`,
    'i',
  )
  const parts = text.split(pattern)
  return (
    <>
      {parts.map((part, i) =>
        testPattern.test(part) ? (
          <mark key={i} className="text-clay font-bold bg-transparent">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

export default function PostCard({
  post,
  index,
  query,
  snippet,
}: {
  post: PostMeta
  index: number
  query?: string
  snippet?: string | null
}) {
  const q = query?.trim() || ''
  return (
    <article
      className="group animate-fade-up border-b border-line/60 last:border-0 pb-8 mb-8"
      style={{ animationDelay: `${Math.min(index * 70, 560)}ms` }}
    >
      <Link to={`/posts/${post.id}`} className="block">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="font-mono text-sm text-muted">
            #{String(post.id).padStart(3, '0')}
          </span>
          <time className="font-mono text-sm text-muted">
            {formatDate(post.created_at)}
          </time>
        </div>
        <h2 className="font-title-zh font-semibold text-2xl md:text-[1.75rem] text-ink leading-tight mb-3 group-hover:text-clay transition-colors duration-200">
          {q ? <Highlight text={post.title} query={q} /> : post.title}
        </h2>
        {snippet ? (
          <p className="text-ink/70 leading-relaxed mb-3">
            <span className="text-muted/40">… </span>
            <Highlight text={snippet} query={q} />
            <span className="text-muted/40"> …</span>
          </p>
        ) : post.excerpt ? (
          <p className="excerpt-fade text-ink/70 leading-relaxed mb-3">
            {q ? <Highlight text={post.excerpt} query={q} /> : post.excerpt}
          </p>
        ) : null}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <span key={t} className="tag-chip">
                #{t}
              </span>
            ))}
          </div>
        )}
      </Link>
    </article>
  )
}

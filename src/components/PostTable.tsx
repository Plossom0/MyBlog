import { Link } from 'react-router-dom'
import type { PostMeta } from '../../shared/types'
import { formatDate } from '../utils/format'

export default function PostTable({
  title,
  posts,
}: {
  title: string
  posts: PostMeta[]
}) {
  if (posts.length === 0) return null

  return (
    <div className="mb-10">
      <h2 className="font-display font-bold text-xl text-ink mb-3 flex items-center gap-2">
        {title}
        <span className="text-sm font-normal text-muted">({posts.length})</span>
      </h2>
      <div className="overflow-x-auto scroll-ink border border-line rounded-lg overflow-hidden">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-20" />
            <col className="w-[200px]" />
            <col className="w-32" />
            <col className="w-32" />
            <col className="w-[400px]" />
          </colgroup>
          <thead>
            <tr className="border-b-2 border-line bg-surface">
              <th className="text-left px-3 py-2 font-article text-sm font-medium text-muted">编号</th>
              <th className="text-left px-3 py-2 font-article text-sm font-medium text-muted">标题</th>
              <th className="text-left px-3 py-2 font-article text-sm font-medium text-muted">创建日期</th>
              <th className="text-left px-3 py-2 font-article text-sm font-medium text-muted">修改日期</th>
              <th className="text-left px-3 py-2 font-article text-sm font-medium text-muted">算法标签</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-line/60 hover:bg-surface/50 transition-colors cursor-pointer">
                <td className="px-3 py-2.5 font-article text-sm text-muted truncate">
                  #{String(post.id).padStart(3, '0')}
                </td>
                <td className="px-3 py-2.5 break-words">
                  <Link
                    to={`/posts/${post.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-display text-sm text-ink hover:text-clay transition-colors"
                  >
                    {!post.public && <span className="mr-1">🔒</span>}
                    {post.title}
                  </Link>
                </td>
                <td className="px-3 py-2.5 font-article text-sm text-muted truncate">
                  {formatDate(post.created_at)}
                </td>
                <td className="px-3 py-2.5 font-article text-sm text-muted truncate">
                  {formatDate(post.updated_at)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1 overflow-hidden">
                    {post.tags.map((t) => (
                      <span key={t} className="tag-chip tag-algo">
                        #{t}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

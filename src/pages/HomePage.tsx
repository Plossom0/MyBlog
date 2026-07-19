import { useEffect, useState, useMemo } from 'react'
import type { PostMeta, PostSearchResult, TagWithCount, CategoryWithCount } from '../../shared/types'
import { fetchPosts, fetchTags, fetchCategories, searchPosts } from '../utils/api'
import { useAuth } from '../utils/auth'
import PostTable from '../components/PostTable'
import SearchBar from '../components/SearchBar'
import TagFilter from '../components/TagFilter'

export default function HomePage() {
  const { loggedIn } = useAuth()
  const [posts, setPosts] = useState<PostMeta[]>([])
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PostSearchResult[] | null>(
    null,
  )

  // 加载标签与分类（登录态变化时重新加载，以反映非公开文章的计数）
  useEffect(() => {
    fetchTags()
      .then(setTags)
      .catch(() => {})
    fetchCategories()
      .then(setCategories)
      .catch(() => {})
  }, [loggedIn])

  // 按标签/分类加载文章（登录态变化时重新加载）
  useEffect(() => {
    setLoading(true)
    setError('')
    fetchPosts(activeTag ?? undefined, activeCategory ?? undefined)
      .then((p) => {
        setPosts(p)
        if (!activeTag && !activeCategory) {
          setTotalCount(p.length)
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [activeTag, activeCategory, loggedIn])

  // 搜索（防抖）
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setSearchResults(null)
      return
    }
    const timer = setTimeout(() => {
      searchPosts(q)
        .then((res) => {
          setSearchResults(res)
        })
        .catch(() => {
          setSearchResults([])
        })
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const displayPosts = searchResults ?? posts
  const isSearching = searchResults !== null

  // 按分类分组，分类内按创建时间倒序
  const grouped = useMemo(() => {
    const groups: Record<string, PostMeta[]> = {}
    for (const post of displayPosts) {
      const cat = post.category || '未分类'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(post)
    }
    const entries = Object.entries(groups)
    entries.sort(([a], [b]) => {
      // 未分类排在最后
      if (a === '未分类') return 1
      if (b === '未分类') return -1
      return a.localeCompare(b, 'zh-CN')
    })
    return entries
  }, [displayPosts])

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 font-article">
      {/* 页头 */}
      <header className="mb-10 animate-fade-in">
        <h1 className="font-article font-extrabold text-4xl md:text-5xl text-ink leading-none mb-3">
          Su777 的博客
        </h1>
        <p className="font-article font-bold text-lg text-muted">
          Su777's Blog
        </p>
      </header>

      {/* 搜索 */}
      <div className="mb-6">
        <SearchBar value={query} onChange={setQuery} />
      </div>

      {/* 标签筛选（搜索时隐藏）*/}
      {!isSearching && (
        <div className="mb-10">
          <TagFilter
            tags={tags}
            categories={categories}
            activeTag={activeTag}
            activeCategory={activeCategory}
            onSelectTag={setActiveTag}
            onSelectCategory={setActiveCategory}
            totalCount={totalCount}
          />
        </div>
      )}

      {/* 内容区 */}
      {error ? (
        <p className="font-article text-sm text-clay">{error}</p>
      ) : loading ? (
        <LoadingTables />
      ) : displayPosts.length === 0 ? (
        <EmptyState isSearching={isSearching} />
      ) : (
        <div>
          {isSearching && (
            <p className="font-article text-sm text-muted mb-6">
              找到 {displayPosts.length} 篇相关文章
            </p>
          )}
          {grouped.map(([cat, catPosts]) => (
            <PostTable key={cat} title={cat} posts={catPosts} />
          ))}
        </div>
      )}
    </div>
  )
}

function LoadingTables() {
  return (
    <div className="mb-10">
      <div className="h-6 w-32 bg-line rounded mb-4 animate-pulse" />
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-full bg-line/40 rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}

function EmptyState({ isSearching }: { isSearching: boolean }) {
  return (
    <div className="text-center py-20">
      <p className="font-article text-2xl text-ink/40 mb-2">
        {isSearching ? '未找到相关文章' : '这里还很安静'}
      </p>
      <p className="font-article text-muted">
        {isSearching ? '换个关键词试试？' : '去「写作」写下第一篇吧。'}
      </p>
    </div>
  )
}

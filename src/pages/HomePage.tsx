import { useEffect, useState } from 'react'
import type { PostMeta, PostSearchResult, TagWithCount } from '../../shared/types'
import { fetchPosts, fetchTags, searchPosts } from '../utils/api'
import PostCard from '../components/PostCard'
import SearchBar from '../components/SearchBar'
import TagFilter from '../components/TagFilter'

export default function HomePage() {
  const [posts, setPosts] = useState<PostMeta[]>([])
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PostSearchResult[] | null>(
    null,
  )
  const [searchedQuery, setSearchedQuery] = useState('')

  // 初次加载标签
  useEffect(() => {
    fetchTags()
      .then(setTags)
      .catch(() => {})
  }, [])

  // 按标签加载文章
  useEffect(() => {
    setLoading(true)
    setError('')
    fetchPosts(activeTag ?? undefined)
      .then(setPosts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [activeTag])

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
          setSearchedQuery(q)
        })
        .catch(() => {
          setSearchResults([])
          setSearchedQuery(q)
        })
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const displayPosts = searchResults ?? posts
  const isSearching = searchResults !== null

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* 页头 */}
      <header className="mb-10 animate-fade-in">
        <h1 className="font-title-zh font-extrabold text-4xl md:text-5xl text-ink leading-none mb-3">
          <img src="/uploads/username.png" alt="Su777" className="inline-block h-[1em] align-middle" /> 的博客
        </h1>
        <p className="font-display font-bold text-lg text-muted">
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
          <TagFilter tags={tags} active={activeTag} onSelect={setActiveTag} />
        </div>
      )}

      {/* 内容区 */}
      {error ? (
        <p className="font-mono text-sm text-clay">{error}</p>
      ) : loading ? (
        <LoadingList />
      ) : displayPosts.length === 0 ? (
        <EmptyState isSearching={isSearching} />
      ) : (
        <div>
          {isSearching && (
            <p className="font-mono text-xs text-muted mb-6">
              找到 {displayPosts.length} 篇相关文章
            </p>
          )}
          {displayPosts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              index={i}
              query={isSearching ? searchedQuery : undefined}
              snippet={'snippet' in post ? post.snippet : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LoadingList() {
  return (
    <div className="space-y-8">
      {[0, 1, 2].map((i) => (
        <div key={i} className="border-b border-line/60 pb-8 animate-pulse">
          <div className="h-3 w-24 bg-line rounded mb-3" />
          <div className="h-7 w-3/4 bg-line rounded mb-3" />
          <div className="h-4 w-full bg-line/60 rounded mb-2" />
          <div className="h-4 w-2/3 bg-line/60 rounded" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ isSearching }: { isSearching: boolean }) {
  return (
    <div className="text-center py-20">
      <p className="font-display text-2xl text-ink/40 mb-2">
        {isSearching ? '未找到相关文章' : '这里还很安静'}
      </p>
      <p className="font-serif text-muted">
        {isSearching ? '换个关键词试试？' : '去「写作」写下第一篇吧。'}
      </p>
    </div>
  )
}

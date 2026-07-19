import type { TagWithCount, CategoryWithCount } from '../../shared/types'

export default function TagFilter({
  tags,
  categories,
  activeTag,
  activeCategory,
  onSelectTag,
  onSelectCategory,
  totalCount,
}: {
  tags: TagWithCount[]
  categories: CategoryWithCount[]
  activeTag: string | null
  activeCategory: string | null
  onSelectTag: (tag: string | null) => void
  onSelectCategory: (category: string | null) => void
  totalCount: number
}) {
  if (tags.length === 0 && categories.length === 0) return null

  function selectTag(tag: string | null) {
    onSelectTag(tag)
    if (tag) onSelectCategory(null)
  }

  function selectCategory(cat: string | null) {
    onSelectCategory(cat)
    if (cat) onSelectTag(null)
  }

  const allActive = activeTag === null && activeCategory === null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            selectTag(null)
            onSelectCategory(null)
          }}
          className={`tag-chip ${allActive ? 'tag-algo-active' : 'tag-algo'}`}
        >
          全部
          <span className="opacity-60 ml-0.5">{totalCount}</span>
        </button>
        {categories.map((c) => (
          <button
            key={c.name}
            onClick={() => selectCategory(activeCategory === c.name ? null : c.name)}
            className={`tag-chip ${activeCategory === c.name ? 'tag-category-active' : 'tag-category'}`}
          >
            {c.name}
            <span className="opacity-60 ml-0.5">{c.count}</span>
          </button>
        ))}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((t) => (
            <button
              key={t.name}
              onClick={() => selectTag(activeTag === t.name ? null : t.name)}
              className={`tag-chip ${activeTag === t.name ? 'tag-algo-active' : 'tag-algo'}`}
            >
              #{t.name}
              <span className="opacity-60 ml-0.5">{t.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

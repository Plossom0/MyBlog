import type { TagWithCount } from '../../shared/types'

export default function TagFilter({
  tags,
  active,
  onSelect,
}: {
  tags: TagWithCount[]
  active: string | null
  onSelect: (tag: string | null) => void
}) {
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`tag-chip ${active === null ? 'tag-chip-active' : ''}`}
      >
        全部
      </button>
      {tags.map((t) => (
        <button
          key={t.name}
          onClick={() => onSelect(active === t.name ? null : t.name)}
          className={`tag-chip ${active === t.name ? 'tag-chip-active' : ''}`}
        >
          #{t.name}
          <span className="opacity-60 ml-0.5">{t.count}</span>
        </button>
      ))}
    </div>
  )
}

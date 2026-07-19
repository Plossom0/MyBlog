import { Search } from 'lucide-react'

export default function SearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-0 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索文章标题与正文…"
        className="w-full bg-transparent border-0 border-b border-line pl-7 pr-2 py-2
          font-article text-base text-ink placeholder:text-muted/60
          focus:outline-none focus:border-clay transition-colors"
      />
    </div>
  )
}

import type { Heading } from '../hooks/useToc'

const indentMap: Record<number, string> = {
  2: 'pl-4',
  3: 'pl-6',
  4: 'pl-8',
  5: 'pl-10',
  6: 'pl-12',
}

export default function Toc({
  headings,
  activeId,
  onJump,
}: {
  headings: Heading[]
  activeId: string
  onJump: (id: string) => void
}) {
  if (headings.length === 0) return null
  return (
    <nav className="text-sm">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted mb-3">
        目录
      </p>
      <ul className="space-y-1 border-l border-line">
        {headings.map((h) => (
          <li key={h.id}>
            <button
              onClick={() => onJump(h.id)}
              className={`block text-left leading-snug py-1 -ml-px border-l-2 transition-colors cursor-pointer ${
                indentMap[h.level] ?? 'pl-4'
              } ${
                activeId === h.id
                  ? 'border-clay text-clay font-medium'
                  : 'border-transparent text-muted hover:text-ink hover:border-clay/40'
              }`}
            >
              <span dangerouslySetInnerHTML={{ __html: h.html }} />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

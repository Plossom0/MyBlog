import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="max-w-prose mx-auto px-6 py-32 text-center">
      <p className="font-display font-bold text-7xl text-clay/30 mb-4">404</p>
      <p className="font-display text-2xl text-ink mb-2">页面走失了</p>
      <p className="font-serif text-muted mb-8">
        你寻找的文字或许从未被写下，或许已被抹去。
      </p>
      <Link
        to="/"
        className="font-mono text-sm text-clay hover:underline underline-offset-4"
      >
        ← 回到 Su777 的博客
      </Link>
    </div>
  )
}

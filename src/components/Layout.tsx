import { Link, Outlet, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { PenLine, BookOpen } from 'lucide-react'

const HOME_URL = 'https://www.luogu.com.cn/user/785752'

export default function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isUpload = location.pathname === '/upload'
  const [avatarError, setAvatarError] = useState(false)

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <header className="border-b border-line/60 backdrop-blur-sm bg-paper/85 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            {avatarError ? (
              <div className="w-10 h-10 rounded-full bg-clay/15 border border-line flex items-center justify-center font-display font-bold text-clay text-sm">
                S
              </div>
            ) : (
              <img
                src="/uploads/avatar.png"
                alt="Su777"
                onError={() => setAvatarError(true)}
                className="w-10 h-10 rounded-full object-cover border border-line group-hover:border-clay transition-colors"
              />
            )}
            <div className="flex flex-col">
              <span className="font-title-zh font-bold text-xl text-ink tracking-tight leading-none group-hover:text-clay transition-colors">
                <img src="/uploads/username.png" alt="Su777" className="inline-block h-[1em] align-middle" /> 的博客
              </span>
              <span className="font-mono text-[10px] text-muted tracking-[0.15em] mt-0.5">
                Su777's Blog
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <NavItem
              to="/"
              active={isHome}
              icon={<BookOpen size={15} />}
              label="博文"
            />
            <NavItem
              to="/upload"
              active={isUpload}
              icon={<PenLine size={15} />}
              label="写作"
            />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line/60 mt-20">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <p className="font-mono text-xs text-muted">
            © {new Date().getFullYear()} <img src="/uploads/username.png" alt="Su777" className="inline-block h-[1em] align-middle" /> 的博客
          </p>
          <a
            href={HOME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display italic text-sm text-muted hover:text-clay transition-colors"
          >
            洛谷个人主页
          </a>
        </div>
      </footer>
    </div>
  )
}

function NavItem({
  to,
  active,
  icon,
  label,
}: {
  to: string
  active: boolean
  icon: ReactNode
  label: string
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-mono tracking-wide transition-colors ${
        active
          ? 'text-clay bg-clay/10'
          : 'text-ink/60 hover:text-ink hover:bg-ink/5'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

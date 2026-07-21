import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { PenLine, BookOpen, LogIn, LogOut, ShieldCheck, Terminal, Sun, Moon } from 'lucide-react'
import { useAuth } from '../utils/auth'
import AuthModal from './AuthModal'

const HOME_URL = 'https://www.luogu.com.cn/user/785752'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const isUpload = location.pathname === '/upload'
  const [avatarError, setAvatarError] = useState(false)

  const { loggedIn, username, passwordSet, statusLoaded, loadStatus, logout } =
    useAuth()
  const [authOpen, setAuthOpen] = useState(false)

  // 主题切换
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('light')) {
      return 'light'
    }
    return 'dark'
  })

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    if (next === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    localStorage.setItem('theme', next)
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      {/* 玻璃态导航栏 */}
      <header className="border-b border-line/60 backdrop-blur-xl bg-paper/70 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            {avatarError ? (
              <div className="w-10 h-10 rounded-lg bg-clay/15 border border-clay/30 flex items-center justify-center font-display font-bold text-clay text-sm">
                S
              </div>
            ) : (
              <img
                src="/res/avatar.png"
                alt="Su777"
                onError={() => setAvatarError(true)}
                className="w-10 h-10 rounded-lg object-cover border border-line group-hover:border-clay/60 transition-colors"
              />
            )}
            <div className="flex flex-col">
              <span className="font-title-zh font-bold text-xl text-ink tracking-tight leading-none group-hover:text-clay transition-colors">
                Su777 的博客
              </span>
              <span className="font-mono text-xs text-muted tracking-[0.15em] mt-0.5 flex items-center gap-1">
                <Terminal size={10} className="text-clay/60" />
                Su777's Blog
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1">
              <NavItem
                to="/"
                active={isHome}
                icon={<BookOpen size={15} />}
                label="文章列表"
              />
              {loggedIn && (
                <NavItem
                  to="/upload"
                  active={isUpload}
                  icon={<PenLine size={15} />}
                  label="写作"
                />
              )}
            </nav>

            {/* 右上角：主题切换滑块 + 登录情况 */}
            <div className="h-6 w-px bg-line" />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />

            {statusLoaded && loggedIn ? (
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-accent text-lg leading-none">
                  {username}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent/15 text-accent font-mono text-xs font-bold border border-accent/30 leading-none">
                  root
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-mono text-sm text-muted hover:text-clay hover:bg-clay/10 transition-colors cursor-pointer"
                  title="登出"
                >
                  <LogOut size={14} />
                  登出
                </button>
              </div>
            ) : statusLoaded && !passwordSet ? (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-clay text-paper font-mono text-sm hover:bg-clay/80 transition-colors cursor-pointer"
              >
                <ShieldCheck size={14} />
                设置密码
              </button>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-sm text-muted hover:text-clay hover:bg-clay/10 transition-colors cursor-pointer"
              >
                <LogIn size={14} />
                管理员登录
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line/60 mt-20 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <p className="font-mono text-sm text-muted">
            © {new Date().getFullYear()} Su777 的博客
          </p>
          <a
            href={HOME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-muted hover:text-clay transition-colors"
          >
            洛谷个人主页
          </a>
        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-mono tracking-wide transition-all duration-200 cursor-pointer ${
        active
          ? 'text-clay bg-clay/10 border border-clay/30'
          : 'text-muted hover:text-ink hover:bg-surface border border-transparent'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: 'dark' | 'light'
  onToggle: () => void
}) {
  const isLight = theme === 'light'
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-mono tracking-wide transition-all duration-200 cursor-pointer text-muted hover:text-ink hover:bg-surface border border-transparent cursor-pointer"
      title={isLight ? '切换到深色模式' : '切换到浅色模式'}
      aria-label="切换主题"
    >
      {isLight ? <Sun size={15} /> : <Moon size={15} />}
      {isLight ? '浅色模式' : '深色模式'}
    </button>
  )
}

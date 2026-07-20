import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { PenLine, BookOpen, LogIn, LogOut, ShieldCheck } from 'lucide-react'
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

  // 启动时拉取鉴权状态（含 token 有效性校验）
  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

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
                src="/res/avatar.png"
                alt="Su777"
                onError={() => setAvatarError(true)}
                className="w-10 h-10 rounded-full object-cover border border-line group-hover:border-clay transition-colors"
              />
            )}
            <div className="flex flex-col">
              <span className="font-title-zh font-bold text-xl text-ink tracking-tight leading-none group-hover:text-clay transition-colors">
                Su777 的博客
              </span>
              <span className="font-mono text-[10px] text-muted tracking-[0.15em] mt-0.5">
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

            {/* 右上角登录情况 */}
            <div className="h-6 w-px bg-line" />
            {statusLoaded && loggedIn ? (
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-[#9c3dcf] text-lg">
                  {username}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#9c3dcf] text-white font-mono text-xs font-bold">
                  root
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-xs text-ink/60 hover:text-clay hover:bg-clay/5 transition-colors"
                  title="登出"
                >
                  <LogOut size={13} />
                  登出
                </button>
              </div>
            ) : statusLoaded && !passwordSet ? (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-clay text-paper font-mono text-xs hover:bg-clay/90 transition-colors"
              >
                <ShieldCheck size={13} />
                设置密码
              </button>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs text-ink/60 hover:text-clay hover:bg-clay/5 transition-colors"
              >
                <LogIn size={13} />
                管理员登录
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line/60 mt-20">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <p className="font-mono text-xs text-muted">
            © {new Date().getFullYear()} Su777 的博客
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

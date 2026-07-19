import { useEffect, useRef, useState } from 'react'
import { X, KeyRound, ShieldCheck } from 'lucide-react'
import { useAuth } from '../utils/auth'

export default function AuthModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { passwordSet, setup, login } = useAuth()
  // setup 模式：尚未设置密码；login 模式：已设置密码
  const isSetup = !passwordSet

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 打开时重置并聚焦
  useEffect(() => {
    if (open) {
      setUsername('')
      setPassword('')
      setConfirm('')
      setError('')
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Esc 关闭
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!username.trim()) {
      setError('请输入用户名')
      return
    }
    if (password.length < 4) {
      setError('密码至少 4 位')
      return
    }
    if (isSetup && password !== confirm) {
      setError('两次输入的密码不一致')
      return
    }
    setLoading(true)
    try {
      if (isSetup) {
        await setup(username.trim(), password)
      } else {
        await login(username.trim(), password)
      }
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-paper border border-line rounded-lg shadow-xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2">
            {isSetup ? (
              <ShieldCheck size={18} className="text-clay" />
            ) : (
              <KeyRound size={18} className="text-clay" />
            )}
            <h2 className="font-display font-bold text-lg text-ink">
              {isSetup ? '设置管理员账号' : '管理员登录'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {isSetup && (
            <p className="font-mono text-xs text-muted leading-relaxed">
              首次使用：设置管理员用户名和密码。密码以 MD5 形式存储于后端，不会保存明文。
            </p>
          )}

          <div>
            <label className="block font-mono text-xs text-muted mb-1.5">
              用户名
            </label>
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-paper border border-line rounded font-mono text-sm text-ink focus:outline-none focus:border-clay transition-colors"
              placeholder={isSetup ? '设置用户名' : '请输入用户名'}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-muted mb-1.5">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-paper border border-line rounded font-mono text-sm text-ink focus:outline-none focus:border-clay transition-colors"
              placeholder={isSetup ? '设置密码（至少 4 位）' : '请输入密码'}
              autoComplete={isSetup ? 'new-password' : 'current-password'}
            />
          </div>

          {isSetup && (
            <div>
              <label className="block font-mono text-xs text-muted mb-1.5">
                确认密码
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-2 bg-paper border border-line rounded font-mono text-sm text-ink focus:outline-none focus:border-clay transition-colors"
                placeholder="再次输入密码"
                autoComplete="new-password"
              />
            </div>
          )}

          {error && (
            <p className="font-mono text-xs text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-clay hover:bg-clay/90 disabled:opacity-50 text-paper font-mono text-sm rounded transition-colors"
          >
            {loading ? '处理中…' : isSetup ? '设置并登录' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}

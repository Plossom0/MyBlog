import { create } from 'zustand'
import type { AuthStatus, LoginResponse } from '../../shared/types'

const TOKEN_KEY = 'blog_admin_token'

interface AuthState {
  // 来自 localStorage，用于发起受保护请求
  token: string | null
  // 由后端校验后的登录态
  loggedIn: boolean
  username: string | null
  // 是否已设置过密码（决定显示“设置密码”还是“登录”）
  passwordSet: boolean
  statusLoaded: boolean
  loadStatus: () => Promise<void>
  setup: (username: string, password: string) => Promise<void>
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  // 本地清空（收到 401 时调用，不发起网络请求）
  clearLocal: () => void
}

export const useAuth = create<AuthState>((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY),
  loggedIn: false,
  username: null,
  passwordSet: false,
  statusLoaded: false,
  loadStatus: async () => {
    const token = get().token
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    try {
      const res = await fetch('/api/auth/status', { headers })
      const data: AuthStatus = await res.json()
      if (token && !data.loggedIn) {
        // token 已失效
        localStorage.removeItem(TOKEN_KEY)
        set({
          token: null,
          loggedIn: false,
          username: null,
          passwordSet: data.passwordSet,
          statusLoaded: true,
        })
      } else {
        set({
          passwordSet: data.passwordSet,
          loggedIn: data.loggedIn,
          username: data.username,
          statusLoaded: true,
        })
      }
    } catch {
      set({ statusLoaded: true })
    }
  },
  setup: async (username, password) => {
    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.error || '设置失败')
    }
    const data: LoginResponse = await res.json()
    localStorage.setItem(TOKEN_KEY, data.token)
    set({
      token: data.token,
      loggedIn: true,
      username: data.username,
      passwordSet: true,
    })
  },
  login: async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.error || '登录失败')
    }
    const data: LoginResponse = await res.json()
    localStorage.setItem(TOKEN_KEY, data.token)
    set({ token: data.token, loggedIn: true, username: data.username })
  },
  logout: async () => {
    const token = get().token
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    localStorage.removeItem(TOKEN_KEY)
    set({ token: null, loggedIn: false, username: null })
  },
  clearLocal: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ token: null, loggedIn: false, username: null })
  },
}))

// 受保护请求携带的 Authorization 头
export function authHeader(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

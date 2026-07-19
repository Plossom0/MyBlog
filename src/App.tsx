import { Routes, Route, Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import PostDetailPage from './pages/PostDetailPage'
import UploadPage from './pages/UploadPage'
import EditPage from './pages/EditPage'
import NotFoundPage from './pages/NotFoundPage'
import { useAuth } from './utils/auth'

// 路由级鉴权：未登录访问写作/编辑页时返回“无权访问”
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loggedIn, statusLoaded } = useAuth()
  if (!statusLoaded) {
    return (
      <div className="max-w-prose mx-auto px-6 py-20 text-center">
        <p className="font-mono text-sm text-muted">校验权限中…</p>
      </div>
    )
  }
  if (!loggedIn) {
    return (
      <div className="max-w-prose mx-auto px-6 py-20 text-center">
        <p className="font-display text-2xl text-clay mb-3">无权访问</p>
        <p className="font-serif text-muted mb-6">
          该页面仅超级管理员可访问，请先登录。
        </p>
        <Link to="/" className="font-mono text-sm text-muted hover:text-clay">
          ← 返回首页
        </Link>
      </div>
    )
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route
          path="/posts/:id/edit"
          element={
            <ProtectedRoute>
              <EditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

// 前后端共享的类型定义

export interface PostMeta {
  id: number
  title: string
  excerpt: string | null
  cover_image_url: string | null
  category: string | null
  public: boolean
  created_at: string
  updated_at: string
  tags: string[]
}

export interface PostDetail extends PostMeta {
  content: string
}

export interface PostSearchResult extends PostMeta {
  snippet: string | null
}

export interface TagWithCount {
  name: string
  count: number
}

export interface CategoryWithCount {
  name: string
  count: number
}

export interface FrontmatterData {
  title?: string
  tags?: string[]
  excerpt?: string
  cover_image_url?: string
  category?: string
}

export interface CreatePostResponse {
  id: number
}

export interface DeletePostResponse {
  success: true
}

export interface UploadImageResponse {
  url: string
}

// ============ 鉴权相关 ============

export interface AuthStatus {
  passwordSet: boolean
  loggedIn: boolean
  username: string | null
}

export interface LoginResponse {
  token: string
  username: string
}

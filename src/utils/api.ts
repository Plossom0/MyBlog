import type {
  PostMeta,
  PostDetail,
  PostSearchResult,
  TagWithCount,
} from '../../shared/types'

const BASE = '/api'

async function handle<T>(res: Response, fallbackMsg: string): Promise<T> {
  if (!res.ok) {
    let msg = fallbackMsg
    try {
      const body = await res.json()
      if (body?.error) msg = body.error
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}

export function fetchPosts(tag?: string): Promise<PostMeta[]> {
  const url = tag ? `${BASE}/posts?tag=${encodeURIComponent(tag)}` : `${BASE}/posts`
  return fetch(url).then((r) => handle<PostMeta[]>(r, '获取文章列表失败'))
}

export function fetchPost(id: number): Promise<PostDetail> {
  return fetch(`${BASE}/posts/${id}`).then((r) =>
    handle<PostDetail>(r, '获取文章失败'),
  )
}

export function fetchTags(): Promise<TagWithCount[]> {
  return fetch(`${BASE}/tags`).then((r) => handle<TagWithCount[]>(r, '获取标签失败'))
}

export function searchPosts(q: string): Promise<PostSearchResult[]> {
  return fetch(`${BASE}/search?q=${encodeURIComponent(q)}`).then((r) =>
    handle<PostSearchResult[]>(r, '搜索失败'),
  )
}

export interface CreatePostPayload {
  file: File
  title?: string
  tags: string[]
  excerpt?: string
  cover_image_url?: string
}

export function createPost(payload: CreatePostPayload): Promise<{ id: number }> {
  const form = new FormData()
  form.append('file', payload.file)
  if (payload.title) form.append('title', payload.title)
  form.append('tags', JSON.stringify(payload.tags))
  if (payload.excerpt) form.append('excerpt', payload.excerpt)
  if (payload.cover_image_url) form.append('cover_image_url', payload.cover_image_url)
  return fetch(`${BASE}/posts`, { method: 'POST', body: form }).then((r) =>
    handle<{ id: number }>(r, '上传失败'),
  )
}

export interface UpdatePostPayload {
  title: string
  content: string
  tags: string[]
  excerpt?: string | null
  cover_image_url?: string | null
}

export function updatePost(
  id: number,
  payload: UpdatePostPayload,
): Promise<{ id: number }> {
  return fetch(`${BASE}/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((r) => handle<{ id: number }>(r, '更新失败'))
}

export function deletePost(id: number): Promise<{ success: true }> {
  return fetch(`${BASE}/posts/${id}`, { method: 'DELETE' }).then((r) =>
    handle<{ success: true }>(r, '删除失败'),
  )
}

export function uploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData()
  form.append('image', file)
  return fetch(`${BASE}/upload/image`, { method: 'POST', body: form }).then((r) =>
    handle<{ url: string }>(r, '图片上传失败'),
  )
}

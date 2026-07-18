import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import matter from 'gray-matter'
import {
  insertPost,
  updatePost,
  deletePost,
  getPostById,
  syncPostTags,
  getTagsForPost,
} from './repository'
import type { FrontmatterData, PostDetail } from '../shared/types'

// ============ Frontmatter 解析 ============

export function parseMarkdownFile(raw: string): {
  frontmatter: FrontmatterData
  content: string
} {
  const { data, content } = matter(raw)
  const frontmatter: FrontmatterData = {
    title: typeof data.title === 'string' ? data.title : undefined,
    excerpt: typeof data.excerpt === 'string' ? data.excerpt : undefined,
    cover_image_url:
      typeof data.cover_image_url === 'string' ? data.cover_image_url : undefined,
    tags: Array.isArray(data.tags)
      ? data.tags.map((t) => String(t)).filter(Boolean)
      : undefined,
  }
  return { frontmatter, content }
}

// ============ 文章创建（合并 frontmatter 与表单输入）============

export interface CreatePostInput {
  fileBuffer: Buffer
  // 表单输入（作为 frontmatter 的兜底）
  title?: string
  tags?: string[]
  excerpt?: string
  cover_image_url?: string
}

// 从正文首个 H1 提取标题，并将其从正文中移除避免重复
function extractFirstH1(md: string): { title: string; content: string } {
  const lines = md.split('\n')
  const idx = lines.findIndex((l) => /^#{1}\s+/.test(l))
  if (idx === -1) return { title: '', content: md }
  const title = lines[idx].replace(/^#{1}\s+/, '').trim()
  const rest = lines.slice(0, idx).concat(lines.slice(idx + 1)).join('\n')
  return { title, content: rest.replace(/^\n+/, '') }
}

export function createPost(input: CreatePostInput): number {
  let { frontmatter, content } = parseMarkdownFile(
    input.fileBuffer.toString('utf-8'),
  )

  // 标题优先级：frontmatter > 表单输入 > 正文首个 H1 > 无标题
  let title = frontmatter.title || input.title || ''
  if (!title) {
    const extracted = extractFirstH1(content)
    if (extracted.title) {
      title = extracted.title
      content = extracted.content
    }
  }
  if (!title) title = '无标题'

  const tags = frontmatter.tags ?? input.tags ?? []
  const excerpt = frontmatter.excerpt ?? input.excerpt ?? null
  const cover_image_url =
    frontmatter.cover_image_url ?? input.cover_image_url ?? null

  const id = insertPost({ title, content, excerpt, cover_image_url })
  syncPostTags(id, tags)
  return id
}

export interface UpdatePostInput {
  title: string
  content: string
  tags: string[]
  excerpt?: string | null
  cover_image_url?: string | null
}

export function updatePostById(id: number, input: UpdatePostInput): boolean {
  const ok = updatePost(id, {
    title: input.title,
    content: input.content,
    excerpt: input.excerpt ?? null,
    cover_image_url: input.cover_image_url ?? null,
  })
  if (ok) syncPostTags(id, input.tags)
  return ok
}

export function removePost(id: number): boolean {
  return deletePost(id)
}

export function getPostDetail(id: number): PostDetail | null {
  const row = getPostById(id)
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    excerpt: row.excerpt,
    cover_image_url: row.cover_image_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags: getTagsForPost(row.id),
  }
}

// ============ 图片上传 ============

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']

export function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

export function saveImage(file: UploadedFile): string {
  ensureUploadDir()
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    throw new Error(`不支持的图片类型: ${file.mimetype}`)
  }
  const ext = path.extname(file.originalname) || '.png'
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
  const fullPath = path.join(UPLOAD_DIR, name)
  fs.writeFileSync(fullPath, file.buffer)
  return `/uploads/${name}`
}

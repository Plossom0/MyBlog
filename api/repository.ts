import { db } from './db'
import type { PostMeta, PostSearchResult, TagWithCount } from '../shared/types'

// ============ 文章查询 ============

interface PostRow {
  id: number
  title: string
  content: string
  excerpt: string | null
  cover_image_url: string | null
  created_at: string
  updated_at: string
}

export function insertPost(data: {
  title: string
  content: string
  excerpt?: string | null
  cover_image_url?: string | null
}): number {
  const stmt = db.prepare(
    `INSERT INTO posts (title, content, excerpt, cover_image_url) VALUES (?, ?, ?, ?)`,
  )
  const result = stmt.run(
    data.title,
    data.content,
    data.excerpt ?? null,
    data.cover_image_url ?? null,
  )
  return result.lastInsertRowid as number
}

export function updatePost(
  id: number,
  data: {
    title: string
    content: string
    excerpt?: string | null
    cover_image_url?: string | null
  },
): boolean {
  const stmt = db.prepare(
    `UPDATE posts SET title = ?, content = ?, excerpt = ?, cover_image_url = ?,
     updated_at = datetime('now') WHERE id = ?`,
  )
  const result = stmt.run(
    data.title,
    data.content,
    data.excerpt ?? null,
    data.cover_image_url ?? null,
    id,
  )
  return result.changes > 0
}

export function deletePost(id: number): boolean {
  const stmt = db.prepare(
    `UPDATE posts SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL`,
  )
  const result = stmt.run(id)
  return result.changes > 0
}

export function getPostById(id: number): PostRow | undefined {
  return db
    .prepare(`SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL`)
    .get(id) as PostRow | undefined
}

export function getAllPostIds(): { id: number }[] {
  return db
    .prepare(
      `SELECT id FROM posts WHERE deleted_at IS NULL ORDER BY created_at DESC`,
    )
    .all() as { id: number }[]
}

export function getPostsByTag(tagName: string): { id: number }[] {
  return db
    .prepare(
      `SELECT p.id FROM posts p
       JOIN post_tags pt ON pt.post_id = p.id
       JOIN tags t ON t.id = pt.tag_id
       WHERE t.name = ? AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC`,
    )
    .all(tagName) as { id: number }[]
}

export function searchPostIds(query: string): { id: number }[] {
  const ftsQuery = query.split(/\s+/).filter(Boolean).join(' ')
  if (!ftsQuery) return []

  // 短查询（<3 字符）trigram 无法匹配，降级为 LIKE
  const charLen = [...query].length
  if (charLen < 3) {
    return db
      .prepare(
        `SELECT id FROM posts WHERE (title LIKE ? OR content LIKE ?) AND deleted_at IS NULL ORDER BY created_at DESC`,
      )
      .all(`%${query}%`, `%${query}%`) as { id: number }[]
  }

  return db
    .prepare(
      `SELECT f.rowid as id FROM posts_fts f
       JOIN posts p ON p.id = f.rowid
       WHERE f.posts_fts MATCH ? AND p.deleted_at IS NULL
       ORDER BY rank`,
    )
    .all(ftsQuery) as { id: number }[]
}

// 去除 Markdown 语法，得到纯文本用于生成摘要片段
function stripMarkdown(s: string): string {
  return s
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~#>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// 无概述时，取正文（去掉标题行）首段纯文本，超长则截断
function makeExcerpt(content: string, maxLen = 120): string {
  const withoutHeadings = content
    .split('\n')
    .filter((l) => !/^\s{0,3}#{1,6}\s/.test(l))
    .join('\n')
  const firstPara = withoutHeadings.split(/\n\s*\n/)[0] ?? withoutHeadings
  const plain = stripMarkdown(firstPara)
  if (plain.length <= maxLen) return plain
  return plain.slice(0, maxLen).trim()
}

// 在正文纯文本中定位首个命中关键词，截取前后窗口作为摘要片段
function makeSnippet(content: string, terms: string[]): string | null {
  if (terms.length === 0) return null
  const plain = stripMarkdown(content)
  const lower = plain.toLowerCase()
  let earliest = -1
  let matchedLen = 0
  for (const t of terms) {
    const idx = lower.indexOf(t.toLowerCase())
    if (idx !== -1 && (earliest === -1 || idx < earliest)) {
      earliest = idx
      matchedLen = t.length
    }
  }
  if (earliest === -1) return null
  const before = 40
  const after = 60
  const start = Math.max(0, earliest - before)
  const end = Math.min(plain.length, earliest + matchedLen + after)
  return plain.slice(start, end)
}

export function searchPostsWithSnippet(query: string): PostSearchResult[] {
  const ids = searchPostIds(query)
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const stmt = db.prepare(
    `SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL`,
  )
  return ids
    .map((x) => stmt.get(x.id) as PostRow | undefined)
    .filter((r): r is PostRow => r !== undefined)
    .map((r) => ({
      ...buildPostMeta(r),
      snippet: makeSnippet(r.content, terms),
    }))
}

// ============ 标签查询 ============

export function getOrCreateTagId(name: string): number {
  const existing = db
    .prepare(`SELECT id FROM tags WHERE name = ?`)
    .get(name) as { id: number } | undefined
  if (existing) return existing.id
  const result = db.prepare(`INSERT INTO tags (name) VALUES (?)`).run(name)
  return result.lastInsertRowid as number
}

export function syncPostTags(postId: number, tagNames: string[]): void {
  db.prepare(`DELETE FROM post_tags WHERE post_id = ?`).run(postId)
  const insertStmt = db.prepare(
    `INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)`,
  )
  for (const name of tagNames) {
    const trimmed = name.trim()
    if (!trimmed) continue
    const tagId = getOrCreateTagId(trimmed)
    insertStmt.run(postId, tagId)
  }
}

export function getTagsForPost(postId: number): string[] {
  const rows = db
    .prepare(
      `SELECT t.name FROM tags t
       JOIN post_tags pt ON pt.tag_id = t.id
       WHERE pt.post_id = ?
       ORDER BY t.name`,
    )
    .all(postId) as { name: string }[]
  return rows.map((r) => r.name)
}

export function getAllTagsWithCount(): TagWithCount[] {
  return db
    .prepare(
      `SELECT t.name as name, COUNT(p.id) as count FROM tags t
       LEFT JOIN post_tags pt ON pt.tag_id = t.id
       LEFT JOIN posts p ON p.id = pt.post_id AND p.deleted_at IS NULL
       GROUP BY t.id, t.name
       HAVING COUNT(p.id) > 0
       ORDER BY count DESC, t.name ASC`,
    )
    .all() as TagWithCount[]
}

// ============ 组装带标签的文章元数据 ============

export function buildPostMeta(row: PostRow): PostMeta {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt ?? makeExcerpt(row.content),
    cover_image_url: row.cover_image_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags: getTagsForPost(row.id),
  }
}

export function buildPostMetas(ids: number[]): PostMeta[] {
  const stmt = db.prepare(
    `SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL`,
  )
  return ids
    .map((id) => stmt.get(id) as PostRow | undefined)
    .filter((r): r is PostRow => r !== undefined)
    .map(buildPostMeta)
}

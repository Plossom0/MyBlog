import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import {
  getAllPostIds,
  getPostsByTag,
  buildPostMetas,
  getAllTagsWithCount,
  searchPostsWithSnippet,
} from './repository'
import {
  createPost,
  updatePostById,
  removePost,
  getPostDetail,
  saveImage,
} from './services'
import type {
  CreatePostResponse,
  DeletePostResponse,
  UploadImageResponse,
} from '../shared/types'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// GET /api/posts?tag=xxx  博客列表（可选按标签筛选）
router.get('/posts', (req: Request, res: Response) => {
  const tag = req.query.tag as string | undefined
  const ids = tag ? getPostsByTag(tag) : getAllPostIds()
  res.json(buildPostMetas(ids.map((x) => x.id)))
})

// GET /api/posts/:id  博客详情（含 md 原文）
router.get('/posts/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: '无效的文章 ID' })
    return
  }
  const post = getPostDetail(id)
  if (!post) {
    res.status(404).json({ error: '文章不存在' })
    return
  }
  res.json(post)
})

// POST /api/posts  上传 md 博客（multipart/form-data）
// 字段：file(md文件), title?, tags?(JSON字符串), excerpt?, cover_image_url?
router.post('/posts', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: '缺少 md 文件' })
    return
  }
  let tags: string[] = []
  if (req.body.tags) {
    try {
      tags = JSON.parse(req.body.tags)
    } catch {
      tags = []
    }
  }
  const id = createPost({
    fileBuffer: req.file.buffer,
    title: req.body.title,
    tags,
    excerpt: req.body.excerpt,
    cover_image_url: req.body.cover_image_url,
  })
  const response: CreatePostResponse = { id }
  res.status(201).json(response)
})

// PUT /api/posts/:id  编辑博客（application/json）
router.put('/posts/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: '无效的文章 ID' })
    return
  }
  const { title, content, tags, excerpt, cover_image_url } = req.body
  if (!title || !content) {
    res.status(400).json({ error: '标题和正文不能为空' })
    return
  }
  const ok = updatePostById(id, {
    title,
    content,
    tags: Array.isArray(tags) ? tags : [],
    excerpt: excerpt ?? null,
    cover_image_url: cover_image_url ?? null,
  })
  if (!ok) {
    res.status(404).json({ error: '文章不存在' })
    return
  }
  res.json({ id })
})

// DELETE /api/posts/:id  删除博客
router.delete('/posts/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: '无效的文章 ID' })
    return
  }
  const ok = removePost(id)
  if (!ok) {
    res.status(404).json({ error: '文章不存在' })
    return
  }
  const response: DeletePostResponse = { success: true }
  res.json(response)
})

// GET /api/tags  标签列表（含文章数）
router.get('/tags', (_req: Request, res: Response) => {
  res.json(getAllTagsWithCount())
})

// GET /api/search?q=xxx  全文搜索
router.get('/search', (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim()
  if (!q) {
    res.json([])
    return
  }
  try {
    res.json(searchPostsWithSnippet(q))
  } catch {
    // FTS5 对特殊字符敏感，出错时降级为空结果
    res.json([])
  }
})

// POST /api/upload/image  图片上传
router.post('/upload/image', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: '缺少图片文件' })
    return
  }
  try {
    const url = saveImage(req.file)
    const response: UploadImageResponse = { url }
    res.status(201).json(response)
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
  }
})

export default router

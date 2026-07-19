import { Router, type Request, type Response, type NextFunction } from 'express'
import multer from 'multer'
import {
  getAllPostIds,
  getPostsByTag,
  getPostsByCategory,
  buildPostMetas,
  getAllTagsWithCount,
  getAllCategoriesWithCount,
  searchPostsWithSnippet,
} from './repository'
import {
  createPost,
  updatePostById,
  removePost,
  getPostDetail,
  saveImage,
} from './services'
import {
  isPasswordSet,
  setPassword,
  login,
  verifyToken,
  logout,
  getPasswordStatus,
} from './auth'
import type {
  CreatePostResponse,
  DeletePostResponse,
  UploadImageResponse,
  AuthStatus,
  LoginResponse,
} from '../shared/types'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// 从请求头提取 Bearer token
function extractToken(req: Request): string | undefined {
  const auth = req.headers.authorization
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7)
  return undefined
}

// 鉴权中间件：仅超级管理员可通过
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!verifyToken(extractToken(req))) {
    res.status(401).json({ error: '无权访问，请先登录' })
    return
  }
  next()
}

// ============ 鉴权路由 ============

// GET /api/auth/status  查询登录/设置状态（公开）
router.get('/auth/status', (req: Request, res: Response) => {
  const loggedIn = verifyToken(extractToken(req))
  const { passwordSet, username } = getPasswordStatus()
  const body: AuthStatus = {
    passwordSet,
    loggedIn,
    username: loggedIn ? username : null,
  }
  res.json(body)
})

// POST /api/auth/setup  首次设置用户名和密码（仅未设置时可用）
router.post('/auth/setup', (req: Request, res: Response) => {
  if (isPasswordSet()) {
    res.status(400).json({ error: '密码已设置，请直接登录' })
    return
  }
  const { username, password } = req.body
  if (typeof username !== 'string' || !username.trim()) {
    res.status(400).json({ error: '请输入用户名' })
    return
  }
  if (typeof password !== 'string' || password.length < 4) {
    res.status(400).json({ error: '密码至少 4 位' })
    return
  }
  const { token, username: name } = setPassword(username.trim(), password)
  const body: LoginResponse = { token, username: name }
  res.status(201).json(body)
})

// POST /api/auth/login  登录（用户名 + md5 校验）
router.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body
  if (typeof username !== 'string' || !username.trim()) {
    res.status(400).json({ error: '请输入用户名' })
    return
  }
  if (typeof password !== 'string' || !password) {
    res.status(400).json({ error: '请输入密码' })
    return
  }
  if (!isPasswordSet()) {
    res.status(400).json({ error: '尚未设置密码' })
    return
  }
  const result = login(username.trim(), password)
  if (!result) {
    res.status(401).json({ error: '用户名或密码错误' })
    return
  }
  const body: LoginResponse = { token: result.token, username: result.username }
  res.json(body)
})

// POST /api/auth/logout  登出
router.post('/auth/logout', (req: Request, res: Response) => {
  const token = extractToken(req)
  if (token) logout(token)
  res.json({ success: true })
})

// ============ 博客路由 ============

// GET /api/posts?tag=xxx&category=yyy  博客列表（可选按标签/分类筛选）
router.get('/posts', (req: Request, res: Response) => {
  const loggedIn = verifyToken(extractToken(req))
  const publicOnly = !loggedIn
  const tag = req.query.tag as string | undefined
  const category = req.query.category as string | undefined
  let ids: { id: number }[]
  if (category) {
    ids = getPostsByCategory(category, publicOnly)
  } else if (tag) {
    ids = getPostsByTag(tag, publicOnly)
  } else {
    ids = getAllPostIds(publicOnly)
  }
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
  // 非公开文章仅登录用户可查看
  if (!post.public && !verifyToken(extractToken(req))) {
    res.status(401).json({ error: '无权访问，请先登录' })
    return
  }
  res.json(post)
})

// POST /api/posts  上传 md 博客（multipart/form-data）—— 需登录
// 字段：file(md文件), title?, tags?(JSON字符串), excerpt?, cover_image_url?
router.post(
  '/posts',
  requireAuth,
  upload.single('file'),
  (req: Request, res: Response) => {
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
      category: req.body.category,
      public: req.body.public !== 'false' && req.body.public !== false,
    })
    const response: CreatePostResponse = { id }
    res.status(201).json(response)
  },
)

// PUT /api/posts/:id  编辑博客（application/json）—— 需登录
router.put('/posts/:id', requireAuth, (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: '无效的文章 ID' })
    return
  }
  const { title, content, tags, excerpt, cover_image_url, category, public: isPublic } = req.body
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
    category: category ?? null,
    public: isPublic !== false,
  })
  if (!ok) {
    res.status(404).json({ error: '文章不存在' })
    return
  }
  res.json({ id })
})

// DELETE /api/posts/:id  删除博客 —— 需登录
router.delete('/posts/:id', requireAuth, (req: Request, res: Response) => {
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
router.get('/tags', (req: Request, res: Response) => {
  const publicOnly = !verifyToken(extractToken(req))
  res.json(getAllTagsWithCount(publicOnly))
})

// GET /api/categories  分类列表（含文章数）
router.get('/categories', (req: Request, res: Response) => {
  const publicOnly = !verifyToken(extractToken(req))
  res.json(getAllCategoriesWithCount(publicOnly))
})

// GET /api/search?q=xxx  全文搜索
router.get('/search', (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim()
  if (!q) {
    res.json([])
    return
  }
  const publicOnly = !verifyToken(extractToken(req))
  try {
    res.json(searchPostsWithSnippet(q, publicOnly))
  } catch {
    // FTS5 对特殊字符敏感，出错时降级为空结果
    res.json([])
  }
})

// POST /api/upload/image  图片上传 —— 需登录
router.post(
  '/upload/image',
  requireAuth,
  upload.single('image'),
  (req: Request, res: Response) => {
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
  },
)

export default router

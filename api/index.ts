import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { initDb } from './db'
import { ensureUploadDir } from './services'
import router from './routes'

const app = express()
const PORT = Number(process.env.PORT) || 3001

// 中间件
app.use(cors())
app.use(express.json({ limit: '20mb' }))

// 初始化数据库与上传目录
initDb()
ensureUploadDir()

// 静态文件：图片上传目录
const uploadsDir = path.resolve(process.cwd(), 'uploads')
app.use('/uploads', express.static(uploadsDir))

// API 路由
app.use('/api', router)

// 生产环境：托管前端构建产物（dist/），与 API 同源，避免部署时反向代理缺失导致 /api 不可达
const distDir = path.resolve(process.cwd(), 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  // SPA 回退：非 /api、/uploads 的 GET 请求交给前端路由
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

// 全局错误处理
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error('[ERROR]', err.message)
    res.status(500).json({ error: '服务器内部错误' })
  },
)

app.listen(PORT, () => {
  console.log(`\n  后端服务已启动: http://localhost:${PORT}\n  API 文档见 /api/posts\n`)
})

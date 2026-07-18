import express from 'express'
import cors from 'cors'
import path from 'path'
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

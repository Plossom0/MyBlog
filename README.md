# Su777 的博客

基于 Express + React + SQLite 的个人博客系统，支持 Markdown 写作、双标签分类、文章可见性控制等功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 后端 | Express + better-sqlite3 + multer |
| 数据库 | SQLite（WAL 模式，支持 FTS5 全文搜索） |
| Markdown | react-markdown + remark-gfm + KaTeX + highlight.js |

## 功能特性

### 文章管理
- Markdown 写作，支持代码高亮、LaTeX 公式、图片上传
- 导入 `.md` 文件（自动解析 frontmatter）
- 全文搜索（FTS5 trigram 分词，支持中文）
- 文章软删除

### 双标签系统
- **算法标签**（深蓝色）：一篇文章可添加多个
- **分类标签**（紫色）：每篇文章仅一个
- 首页按分类分组展示，支持标签/分类互斥筛选

### 鉴权与可见性
- 登录需用户名 + 密码双因素验证，均存储于数据库（MD5 哈希）
- 文章可设为「公众可见」或「仅登录可见」
- 非公开文章对未登录用户隐藏，直接访问返回 401

### UI 设计
- 参考洛谷文章页风格，使用苹方/微软雅黑等中文无衬线字体
- 首页表格布局（编号/标题/日期/标签）
- 内容页洛谷风格排版（深色标题、蓝色链接）
- 自定义 favicon（圆角裁剪）

## 快速开始

### 环境要求

- Node.js >= 18
- npm

### 安装

```bash
npm install
```

### 启动开发服务

```bash
npm run dev:all
```

同时启动前端（5173）和后端（3001），前端自动代理 API 请求到后端。

### 首次使用

1. 访问 `http://localhost:5173`
2. 点击右上角「设置密码」
3. 设置管理员用户名和密码
4. 登录后即可写作、编辑、删除文章

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
MyBlog/
├── api/                # 后端
│   ├── auth.ts         # 鉴权逻辑（登录/登出/token 校验）
│   ├── db.ts           # 数据库初始化与表结构
│   ├── index.ts        # Express 服务入口
│   ├── repository.ts   # 数据查询层
│   ├── routes.ts       # API 路由定义
│   └── services.ts     # 业务逻辑层
├── src/                # 前端
│   ├── components/     # 组件（AuthModal, PostTable, PostForm 等）
│   ├── hooks/          # 自定义 Hooks
│   ├── pages/          # 页面（HomePage, PostDetailPage, EditPage 等）
│   └── utils/          # 工具函数（api, auth, format）
├── shared/             # 前后端共享类型定义
├── data/               # SQLite 数据库文件（gitignore）
├── uploads/            # 上传的图片（gitignore）
└── public/             # 静态资源（favicon.svg）
```

## API 概览

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/posts` | 文章列表（支持 `?tag=` / `?category=` 筛选） | 公开 |
| GET | `/api/posts/:id` | 文章详情 | 非公开文章需登录 |
| POST | `/api/posts` | 上传文章 | 需登录 |
| PUT | `/api/posts/:id` | 编辑文章 | 需登录 |
| DELETE | `/api/posts/:id` | 删除文章 | 需登录 |
| GET | `/api/tags` | 算法标签列表 | 公开 |
| GET | `/api/categories` | 分类列表 | 公开 |
| GET | `/api/search?q=` | 全文搜索 | 公开 |
| POST | `/api/upload/image` | 上传图片 | 需登录 |
| GET | `/api/auth/status` | 查询登录状态 | 公开 |
| POST | `/api/auth/setup` | 首次设置账号 | 仅未设置时 |
| POST | `/api/auth/login` | 登录 | 公开 |
| POST | `/api/auth/logout` | 登出 | 公开 |

## 数据备份

导出所有文章为 Markdown 文件：

```bash
npx tsx -e "
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
const db = new Database('data/blog.db', { readonly: true })
const posts = db.prepare('SELECT * FROM posts WHERE deleted_at IS NULL').all()
fs.mkdirSync('backup', { recursive: true })
posts.forEach(p => fs.writeFileSync(\`backup/\${p.id}-\${p.title}.md\`, p.content))
console.log(\`导出 \${posts.length} 篇\`)
"
```

## License

MIT

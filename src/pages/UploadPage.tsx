import { useNavigate } from 'react-router-dom'
import { createPost } from '../utils/api'
import PostForm from '../components/PostForm'

export default function UploadPage() {
  const navigate = useNavigate()

  async function handleSubmit(data: {
    title: string
    content: string
    tags: string[]
    category: string | null
    public: boolean
    excerpt: string | null
  }) {
    // 将编辑后的正文构造为 md 文件上传
    const file = new File([data.content], 'post.md', { type: 'text/markdown' })
    const { id } = await createPost({
      file,
      title: data.title,
      tags: data.tags,
      category: data.category ?? undefined,
      public: data.public,
      excerpt: data.excerpt ?? undefined,
    })
    navigate(`/posts/${id}`)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-10 animate-fade-in">
        <h1 className="font-display font-bold text-3xl text-ink mb-2">
          写作
        </h1>
        <p className="font-article text-muted">
          导入 md 文件或直接书写，支持代码高亮、LaTeX 公式与图片。
        </p>
      </header>
      <PostForm submitLabel="发布文章" onSubmit={handleSubmit} />
    </div>
  )
}

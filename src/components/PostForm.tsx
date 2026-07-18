import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { FileUp, ImagePlus, Loader2 } from 'lucide-react'
import { uploadImage } from '../utils/api'

interface PostFormProps {
  initialTitle?: string
  initialTags?: string[]
  initialExcerpt?: string | null
  initialContent?: string
  submitLabel: string
  onSubmit: (data: {
    title: string
    content: string
    tags: string[]
    excerpt: string | null
  }) => Promise<void>
}

// 简单的客户端 frontmatter 解析（导入文件时预填表单）
function parseFrontmatter(raw: string): {
  title?: string
  tags?: string[]
  excerpt?: string
  content: string
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) return { content: raw }
  const yaml = match[1]
  const content = raw.slice(match[0].length)
  const result: { title?: string; tags?: string[]; excerpt?: string; content: string } = {
    content,
  }
  for (const line of yaml.split('\n')) {
    const m = /^(\w+):\s*(.*)$/.exec(line)
    if (!m) continue
    const [, key, rawVal] = m
    let val: string | string[] = rawVal.trim().replace(/^["']|["']$/g, '')
    if (typeof val === 'string' && val.startsWith('[') && val.endsWith(']')) {
      val = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    }
    if (key === 'title' || key === 'excerpt') {
      result[key] = val as string
    } else if (key === 'tags') {
      result.tags = val as string[]
    }
  }
  return result
}

export default function PostForm({
  initialTitle = '',
  initialTags = [],
  initialExcerpt = '',
  initialContent = '',
  submitLabel,
  onSubmit,
}: PostFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [tags, setTags] = useState(initialTags.join(', '))
  const [excerpt, setExcerpt] = useState(initialExcerpt ?? '')
  const [content, setContent] = useState(initialContent)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const raw = String(reader.result)
      const parsed = parseFrontmatter(raw)
      if (parsed.title) setTitle(parsed.title)
      if (parsed.tags) setTags(parsed.tags.join(', '))
      if (parsed.excerpt) setExcerpt(parsed.excerpt)
      setContent(parsed.content)
      setInfo(`已导入 ${file.name}`)
      setError('')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleUploadImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setInfo('图片上传中…')
    setError('')
    try {
      const { url } = await uploadImage(file)
      const insertText = `![${file.name.replace(/\.[^.]+$/, '')}](${url})`
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newContent = content.slice(0, start) + insertText + content.slice(end)
        setContent(newContent)
        requestAnimationFrame(() => {
          textarea.focus()
          textarea.selectionStart = textarea.selectionEnd = start + insertText.length
        })
      } else {
        setContent((c) => c + '\n' + insertText)
      }
      setInfo(`图片已插入：${url}`)
    } catch (err) {
      setError((err as Error).message)
    }
    e.target.value = ''
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('标题和正文不能为空')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({
        title: title.trim(),
        content,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        excerpt: excerpt.trim() || null,
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 标题 */}
      <div>
        <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-muted mb-2">
          标题
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="为这篇文章起个名字…"
          className="w-full bg-transparent border-0 border-b border-line pb-2
            font-display text-2xl text-ink placeholder:text-muted/40
            focus:outline-none focus:border-clay transition-colors"
        />
      </div>

      {/* 标签 + 摘要 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-muted mb-2">
            标签（逗号分隔）
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="随笔, 技术, 笔记"
            className="w-full bg-transparent border-b border-line py-1.5
              font-serif text-base text-ink placeholder:text-muted/40
              focus:outline-none focus:border-clay transition-colors"
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-muted mb-2">
            摘要（可选）
          </label>
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="一句话概述…"
            className="w-full bg-transparent border-b border-line py-1.5
              font-serif text-base text-ink placeholder:text-muted/40
              focus:outline-none focus:border-clay transition-colors"
          />
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono
            border border-line text-ink/70 rounded-md hover:border-clay hover:text-clay transition-colors"
        >
          <FileUp size={14} />
          导入 md 文件
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,text/markdown"
          onChange={handleImportFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono
            border border-line text-ink/70 rounded-md hover:border-clay hover:text-clay transition-colors"
        >
          <ImagePlus size={14} />
          上传图片
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleUploadImage}
          className="hidden"
        />
        {info && <span className="font-mono text-xs text-moss">{info}</span>}
      </div>

      {/* 正文编辑区 */}
      <div>
        <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-muted mb-2">
          正文（Markdown）
        </label>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="在此书写或导入 md 文件… 支持代码块、LaTeX 公式、图片。"
          className="w-full min-h-[420px] bg-ink/[0.02] border border-line rounded-lg p-4
            font-mono text-sm text-ink leading-relaxed
            focus:outline-none focus:border-clay focus:bg-paper transition-colors scroll-ink"
          spellCheck={false}
        />
      </div>

      {/* 错误与提交 */}
      {error && (
        <p className="font-mono text-sm text-clay bg-clay/10 px-3 py-2 rounded-md">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 px-6 py-2.5 font-mono text-sm tracking-wide
          bg-clay text-paper rounded-md hover:bg-clay/90 disabled:opacity-50
          transition-colors"
      >
        {submitting && <Loader2 size={14} className="animate-spin" />}
        {submitting ? '提交中…' : submitLabel}
      </button>
    </form>
  )
}

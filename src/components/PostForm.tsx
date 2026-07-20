import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'
import { FileUp, ImagePlus, Loader2, Plus, X, ChevronDown } from 'lucide-react'
import { uploadImage, fetchCategories } from '../utils/api'
import MarkdownRenderer from './MarkdownRenderer'

interface PostFormProps {
  initialTitle?: string
  initialTags?: string[]
  initialCategory?: string | null
  initialPublic?: boolean
  initialExcerpt?: string | null
  initialContent?: string
  submitLabel: string
  onSubmit: (data: {
    title: string
    content: string
    tags: string[]
    category: string | null
    public: boolean
    excerpt: string | null
  }) => Promise<void>
}

// 简单的客户端 frontmatter 解析（导入文件时预填表单）
function parseFrontmatter(raw: string): {
  title?: string
  tags?: string[]
  category?: string
  excerpt?: string
  content: string
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) return { content: raw }
  const yaml = match[1]
  const content = raw.slice(match[0].length)
  const result: { title?: string; tags?: string[]; category?: string; excerpt?: string; content: string } = {
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
    if (key === 'title' || key === 'excerpt' || key === 'category') {
      result[key] = val as string
    } else if (key === 'tags') {
      result.tags = val as string[]
    }
  }
  return result
}

// 统一输入框样式：封闭长方形边框，聚焦时蓝色高亮
const inputCls =
  'border border-line rounded-md px-3 py-2 font-serif text-base text-ink bg-paper placeholder:text-muted/40 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors'

export default function PostForm({
  initialTitle = '',
  initialTags = [],
  initialCategory = '',
  initialPublic = true,
  initialExcerpt = '',
  initialContent = '',
  submitLabel,
  onSubmit,
}: PostFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [tagList, setTagList] = useState<string[]>(initialTags.filter(Boolean))
  const [tagInput, setTagInput] = useState('')
  const [category, setCategory] = useState(initialCategory ?? '')
  const [categoryOptions, setCategoryOptions] = useState<string[]>(
    initialCategory ? [initialCategory] : [],
  )
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [catOpen, setCatOpen] = useState(false)
  const [confirmingCat, setConfirmingCat] = useState<string | null>(null)
  const [showCatInput, setShowCatInput] = useState(false)
  const [catInput, setCatInput] = useState('')
  const [isPublic, setIsPublic] = useState(initialPublic)
  const [excerpt, setExcerpt] = useState(initialExcerpt ?? '')
  const [content, setContent] = useState(initialContent)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const syncingRef = useRef(false)
  const catDropdownRef = useRef<HTMLDivElement>(null)
  // 同步滚动锚点：编辑器像素位置 <-> 预览像素位置（按标题对齐）
  const anchorsRef = useRef<{ e: number; p: number }[]>([])

  // 加载已有分类（含计数），并入默认项与初始分类
  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        setCategoryOptions((prev) =>
          Array.from(new Set([...prev, ...cats.map((c) => c.name)])),
        )
        setCategoryCounts(Object.fromEntries(cats.map((c) => [c.name, c.count])))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (initialCategory && !categoryOptions.includes(initialCategory)) {
      setCategoryOptions((prev) => Array.from(new Set([...prev, initialCategory!])))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategory])

  // 点击外部关闭分类下拉
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        catDropdownRef.current &&
        !catDropdownRef.current.contains(e.target as Node)
      ) {
        setCatOpen(false)
        setShowCatInput(false)
        setConfirmingCat(null)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  // 计算同步滚动锚点：按标题把编辑器与预览的对应位置配对
  useLayoutEffect(() => {
    const editor = editorRef.current
    const preview = previewRef.current
    if (!editor || !preview) return
    const lines = content.split('\n')
    const headingIdx: number[] = []
    lines.forEach((l, i) => {
      if (/^\s{0,3}#{1,6}\s/.test(l)) headingIdx.push(i)
    })
    const previewHeadings = Array.from(
      preview.querySelectorAll('h1,h2,h3,h4,h5,h6'),
    ) as HTMLElement[]
    const n = Math.min(headingIdx.length, previewHeadings.length)
    const totalLines = lines.length || 1
    const lineH = editor.scrollHeight / totalLines
    const anchors: { e: number; p: number }[] = [{ e: 0, p: 0 }]
    for (let i = 0; i < n; i++) {
      anchors.push({
        e: headingIdx[i] * lineH,
        p: previewHeadings[i].offsetTop,
      })
    }
    anchors.push({ e: editor.scrollHeight, p: preview.scrollHeight })
    anchorsRef.current = anchors
  }, [content])

  // 两栏同步滚动：按标题锚点插值，做到内容对内容（标题对标题）
  function syncScroll(source: 'editor' | 'preview') {
    if (syncingRef.current) return
    syncingRef.current = true
    const editor = editorRef.current
    const preview = previewRef.current
    const anchors = anchorsRef.current
    if (!editor || !preview || anchors.length < 2) {
      requestAnimationFrame(() => {
        syncingRef.current = false
      })
      return
    }
    if (source === 'editor') {
      const s = editor.scrollTop
      let i = 0
      while (i < anchors.length - 2 && anchors[i + 1].e <= s) i++
      const a0 = anchors[i]
      const a1 = anchors[i + 1]
      const t = a1.e === a0.e ? 0 : (s - a0.e) / (a1.e - a0.e)
      preview.scrollTop = a0.p + t * (a1.p - a0.p)
    } else {
      const s = preview.scrollTop
      let i = 0
      while (i < anchors.length - 2 && anchors[i + 1].p <= s) i++
      const a0 = anchors[i]
      const a1 = anchors[i + 1]
      const t = a1.p === a0.p ? 0 : (s - a0.p) / (a1.p - a0.p)
      editor.scrollTop = a0.e + t * (a1.e - a0.e)
    }
    requestAnimationFrame(() => {
      syncingRef.current = false
    })
  }

  // ============ 标签：空格/回车添加 ============
  function commitTag() {
    const t = tagInput.trim()
    if (t && !tagList.includes(t)) {
      setTagList([...tagList, t])
    }
    setTagInput('')
  }
  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitTag()
    } else if (e.key === 'Backspace' && tagInput === '' && tagList.length > 0) {
      setTagList(tagList.slice(0, -1))
    }
  }
  function removeTag(t: string) {
    setTagList(tagList.filter((x) => x !== t))
  }

  // ============ 分类：+ 添加自定义 / × 删除 ============
  function commitCategory() {
    const c = catInput.trim()
    if (c && !categoryOptions.includes(c)) {
      setCategoryOptions([...categoryOptions, c])
    }
    setCategory(c)
    setCatInput('')
    setShowCatInput(false)
  }
  function handleCatKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitCategory()
    } else if (e.key === 'Escape') {
      setShowCatInput(false)
      setCatInput('')
    }
  }
  function deleteCategoryOption(o: string) {
    setCategoryOptions((prev) => prev.filter((x) => x !== o))
    if (category === o) setCategory('')
    setConfirmingCat(null)
  }

  function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const raw = String(reader.result)
      const parsed = parseFrontmatter(raw)
      if (parsed.title) setTitle(parsed.title)
      if (parsed.tags) setTagList(parsed.tags)
      if (parsed.category) setCategory(parsed.category)
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
      const textarea = editorRef.current
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
        tags: tagList,
        category: category.trim() || null,
        public: isPublic,
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
      <div className="flex items-center gap-4">
        <label className="w-16 shrink-0 font-serif text-sm font-medium text-ink/70">
          标题
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="为这篇文章起个名字…"
          className={`flex-1 ${inputCls}`}
        />
      </div>

      {/* 摘要 */}
      <div className="flex items-center gap-4">
        <label className="w-16 shrink-0 font-serif text-sm font-medium text-ink/70">
          摘要
        </label>
        <input
          type="text"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="一句话概述…"
          className={`flex-1 ${inputCls}`}
        />
      </div>

      {/* 标签：输入框 + 下方 chips（深蓝色，与首页一致） */}
      <div>
        <div className="flex items-center gap-4">
          <label className="w-16 shrink-0 font-serif text-sm font-medium text-ink/70">
            标签
          </label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="输入后按回车添加…"
            className={`flex-1 ${inputCls}`}
          />
        </div>
        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 ml-20">
            {tagList.map((t) => (
              <span
                key={t}
                className="tag-chip tag-algo inline-flex items-center gap-1 cursor-default"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="inline-flex items-center justify-center -mr-0.5
                    hover:opacity-70 transition-opacity"
                  aria-label={`删除标签 ${t}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 分类：自定义下拉单选（含计数）+ 删除 + 新增 */}
      <div className="flex items-center gap-4">
        <label className="w-16 shrink-0 font-serif text-sm font-medium text-ink/70">
          分类
        </label>
        <div className="relative flex-1" ref={catDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setCatOpen((v) => !v)
              setShowCatInput(false)
            }}
            className={`w-full ${inputCls} flex items-center justify-between text-left`}
          >
            <span>{category || '未分类'}</span>
            <ChevronDown size={16} className="text-muted shrink-0" />
          </button>
          {catOpen && (
            <div className="absolute z-20 mt-1 w-full bg-paper border border-line rounded-md shadow-lg max-h-64 overflow-auto scroll-ink">
              <button
                type="button"
                onClick={() => {
                  setCategory('')
                  setCatOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left
                  font-serif text-base text-ink hover:bg-ink/5 transition-colors"
              >
                <span>未分类</span>
              </button>
              {categoryOptions.map((o) => {
                const count = categoryCounts[o] ?? 0
                return (
                  <div
                    key={o}
                    className="group flex items-center justify-between px-3 py-2 hover:bg-ink/5 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setCategory(o)
                        setCatOpen(false)
                        setConfirmingCat(null)
                      }}
                      className="flex-1 text-left font-serif text-base text-ink"
                    >
                      {o}{' '}
                      <span className="text-muted text-sm">({count})</span>
                    </button>
                    {count === 0 &&
                      (confirmingCat === o ? (
                        <button
                          type="button"
                          onClick={() => deleteCategoryOption(o)}
                          className="ml-2 text-xs font-mono text-clay hover:underline"
                        >
                          确认删除
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingCat(o)}
                          className="ml-2 text-muted/50 hover:text-clay transition-colors"
                          aria-label={`删除分类 ${o}`}
                        >
                          <X size={14} />
                        </button>
                      ))}
                  </div>
                )
              })}
              {showCatInput ? (
                <div className="flex items-center gap-2 px-3 py-2 border-t border-line">
                  <input
                    type="text"
                    value={catInput}
                    onChange={(e) => setCatInput(e.target.value)}
                    onKeyDown={handleCatKeyDown}
                    placeholder="新分类名，回车确认"
                    autoFocus
                    className="flex-1 bg-transparent border-b border-line py-1
                      font-serif text-base text-ink placeholder:text-muted/40
                      focus:outline-none focus:border-clay transition-colors"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCatInput(true)}
                  className="w-full flex items-center gap-1.5 px-3 py-2
                    font-serif text-sm text-muted hover:text-clay transition-colors border-t border-line"
                >
                  <Plus size={14} /> 新增分类
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 公众可见 */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4 accent-[#9c3dcf]"
          />
          <span className="font-serif text-sm font-medium text-ink/70">
            公众可见
          </span>
          <span className="font-serif text-xs text-muted">
            （取消勾选后仅登录用户可查看）
          </span>
        </label>
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

      {/* 正文：两栏 Markdown 编辑器（左源码 / 右预览，同步滚动） */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block font-serif text-sm font-medium text-ink/70">
            正文（Markdown）
          </label>
          <span className="font-mono text-[10px] text-muted tracking-wider">
            源码 / 预览
          </span>
        </div>
        <div className="flex h-[calc(100vh-360px)] min-h-[500px] border border-line rounded-lg overflow-hidden bg-paper">
          <textarea
            ref={editorRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onScroll={() => syncScroll('editor')}
            placeholder="在此书写或导入 md 文件… 支持代码块、LaTeX 公式、图片。"
            className="w-1/2 h-full min-h-0 bg-ink/[0.02] p-4 resize-none
              font-mono text-sm text-ink leading-relaxed
              focus:outline-none focus:bg-paper transition-colors scroll-ink
              border-r border-line"
            spellCheck={false}
          />
          <div
            ref={previewRef}
            onScroll={() => syncScroll('preview')}
            className="relative w-1/2 h-full min-h-0 overflow-auto p-4 scroll-ink"
          >
            {content.trim() ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-muted/50 text-sm font-serif italic">
                预览区…
              </p>
            )}
          </div>
        </div>
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

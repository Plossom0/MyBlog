// 日期格式化：将 SQLite 的 datetime 字符串转为友好显示
export function formatDate(raw: string): string {
  const d = new Date(raw.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return raw
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

// 从 markdown 正文中提取摘要（取首个段落，截断）
export function excerptFromContent(md: string, max = 120): string {
  const lines = md.split('\n')
  let inCode = false
  for (const line of lines) {
    if (line.trim().startsWith('```')) inCode = !inCode
    if (inCode) continue
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---')) continue
    const clean = trimmed.replace(/[*_`~\[\]()#>]/g, '').trim()
    if (clean.length > 0) {
      return clean.length > max ? clean.slice(0, max) + '…' : clean
    }
  }
  return ''
}

// 生成 slug（与 rehype-slug 的 github-slugger 兼容）
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

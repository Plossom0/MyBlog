import { useEffect, useState } from 'react'

export interface Heading {
  id: string
  html: string
  level: number
}

// 从已渲染的文章容器中提取 h2~h6 标题，并用 IntersectionObserver 追踪当前章节
export function useToc(
  containerRef: React.RefObject<HTMLElement>,
  content: string,
) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const els = Array.from(
      container.querySelectorAll('h2, h3, h4, h5, h6'),
    ) as HTMLHeadingElement[]
    // 用 innerHTML 保留已渲染的 LaTeX/行内格式，使目录能渲染公式
    const items: Heading[] = els.map((el) => ({
      id: el.id,
      html: el.innerHTML,
      level: Number(el.tagName[1]),
    }))
    setHeadings(items)
    setActiveId(items[0]?.id ?? '')

    if (els.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )
        if (visible[0]) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-90px 0px -70% 0px', threshold: 0 },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [containerRef, content])

  return { headings, activeId }
}

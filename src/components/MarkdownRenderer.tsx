import ReactMarkdown from 'react-markdown'
import { memo } from 'react'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'

// 默认使用 highlight.js 的 common 语言包（含 cpp/c/javascript/typescript/python/java/bash/json 等）
// detect:true 让没有标语言的代码块自动识别；aliases 补充 C++ 等常见别名
function MarkdownRendererBase({ content }: { content: string }) {
  return (
    <div className="prose-blog">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[
          rehypeKatex,
          [
            rehypeHighlight,
            {
              detect: true,
              aliases: {
                cpp: ['c++', 'cc', 'cxx', 'hpp', 'hxx', 'hh'],
                c: ['h'],
                javascript: ['js', 'jsx'],
                typescript: ['ts', 'tsx'],
                python: ['py'],
                bash: ['sh', 'shell', 'zsh'],
                csharp: ['c#', 'cs'],
                html: ['html5'],
              },
            },
          ],
          rehypeSlug,
        ]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// memo：content 不变时跳过昂贵的 markdown 重新解析（避免表单其它状态变化导致卡顿）
const MarkdownRenderer = memo(MarkdownRendererBase)
export default MarkdownRenderer

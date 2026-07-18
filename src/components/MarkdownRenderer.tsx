import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'

export default function MarkdownRenderer({
  content,
}: {
  content: string
}) {
  return (
    <div className="prose-blog">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeSlug]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

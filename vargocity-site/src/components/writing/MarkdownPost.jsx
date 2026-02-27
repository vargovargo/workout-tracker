import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownPost({ post, backPath, backLabel }) {
  if (!post) return <p className="text-sm" style={{ color: '#8A8A8A' }}>Post not found.</p>
  return (
    <article className="max-w-2xl">
      <div className="mb-8">
        <Link to={backPath}
          className="text-xs transition-colors hover:text-[#1A1A1A]"
          style={{ color: '#8A8A8A' }}>
          ← {backLabel}
        </Link>
      </div>

      {post.book && (
        <div className="mb-4 px-4 py-3 rounded"
          style={{ backgroundColor: '#F4F4F0', border: '1px solid #E5E5E0' }}>
          <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{post.book}</p>
          <p className="text-xs" style={{ color: '#4A4A4A' }}>{post.book_author}</p>
        </div>
      )}

      <h1 className="text-2xl font-semibold mb-2 tracking-tight" style={{ color: '#1A1A1A' }}>
        {post.title}
      </h1>
      <p className="text-sm mb-8" style={{ color: '#8A8A8A' }}>
        {post.date}
        {post.source === 'newsletter' && ' · Originally sent via TinyLetter'}
      </p>

      <div className="prose prose-sm max-w-none"
        style={{ color: '#4A4A4A', lineHeight: '1.75' }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
  )
}

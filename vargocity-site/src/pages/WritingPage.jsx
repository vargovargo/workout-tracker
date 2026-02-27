import { useState, useEffect } from 'react'
import { Routes, Route, useParams, Link } from 'react-router-dom'
import SectionHeader from '../components/shared/SectionHeader'
import TabBar from '../components/shared/TabBar'
import PostCard from '../components/writing/PostCard'
import MarkdownPost from '../components/writing/MarkdownPost'
import { loadBlogPosts, loadNewsletterPosts, loadVreadingsPosts } from '../lib/loadContent'

const tabs = [
  { id: 'blog', label: 'Blog' },
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'reading', label: 'Reading' },
]

function PostList({ posts, basePath, loading }) {
  if (loading) return <p className="text-sm py-12 text-center" style={{ color: '#8A8A8A' }}>Loading…</p>
  if (!posts.length) return <p className="text-sm py-12 text-center" style={{ color: '#8A8A8A' }}>Nothing here yet.</p>
  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.slug} post={post} basePath={basePath} />
      ))}
    </div>
  )
}

function WritingIndex() {
  const [tab, setTab] = useState('blog')
  const [blog, setBlog] = useState([])
  const [newsletter, setNewsletter] = useState([])
  const [vreadings, setVreadings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([loadBlogPosts(), loadNewsletterPosts(), loadVreadingsPosts()]).then(([b, n, v]) => {
      setBlog(b)
      setNewsletter(n)
      setVreadings(v)
      setLoading(false)
    })
  }, [])

  const current = { blog, newsletter, reading: vreadings }[tab] || []
  const basePath = { blog: '/writing/blog', newsletter: '/writing/newsletter', reading: '/writing/reading' }[tab]

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <SectionHeader
        label="Writing"
        title="Blog, Letters & Reading"
        description="Essays and notes, dispatches from the newsletter, and a reading journal."
      />
      <div className="mb-8">
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>
      <PostList posts={current} basePath={basePath} loading={loading} />
    </div>
  )
}

function SinglePost({ source, backPath, backLabel, loader }) {
  const { slug } = useParams()
  const [post, setPost] = useState(null)

  useEffect(() => {
    loader().then(posts => {
      setPost(posts.find(p => p.slug === slug) || null)
    })
  }, [slug])

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <MarkdownPost post={post} backPath={backPath} backLabel={backLabel} />
    </div>
  )
}

export default function WritingPage() {
  return (
    <Routes>
      <Route index element={<WritingIndex />} />
      <Route path="blog/:slug" element={
        <SinglePost source="blog" backPath="/writing" backLabel="Writing"
          loader={loadBlogPosts} />
      } />
      <Route path="newsletter/:slug" element={
        <SinglePost source="newsletter" backPath="/writing" backLabel="Writing"
          loader={loadNewsletterPosts} />
      } />
      <Route path="reading/:slug" element={
        <SinglePost source="reading" backPath="/writing" backLabel="Writing"
          loader={loadVreadingsPosts} />
      } />
    </Routes>
  )
}

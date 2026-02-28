// Vite's import.meta.glob lets us load all markdown files at build time

// Blog posts
const blogModules = import.meta.glob('../content/blog/*.md', { query: '?raw', import: 'default' })
// Newsletter
const newsletterModules = import.meta.glob('../content/newsletter/*.md', { query: '?raw', import: 'default' })
// VReadings
const vreadingsModules = import.meta.glob('../content/vreadings/*.md', { query: '?raw', import: 'default' })

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { frontmatter: {}, content: raw }
  const frontmatterStr = match[1]
  const content = match[2].trim()
  const frontmatter = {}
  frontmatterStr.split('\n').forEach(line => {
    const [key, ...rest] = line.split(':')
    if (key && rest.length) {
      let val = rest.join(':').trim()
      // Remove surrounding quotes
      val = val.replace(/^["']|["']$/g, '')
      // Parse arrays: ["a", "b"]
      if (val.startsWith('[')) {
        try {
          frontmatter[key.trim()] = JSON.parse(val)
        } catch {
          frontmatter[key.trim()] = val
        }
      } else {
        frontmatter[key.trim()] = val
      }
    }
  })
  return { frontmatter, content }
}

function pathToSlug(path) {
  return path.split('/').pop().replace('.md', '')
}

async function loadAll(modules) {
  const posts = []
  for (const [path, loader] of Object.entries(modules)) {
    const raw = await loader()
    const { frontmatter, content } = parseFrontmatter(raw)
    posts.push({
      slug: pathToSlug(path),
      content,
      title: frontmatter.title || '',
      date: frontmatter.date || '',
      tags: frontmatter.tags || [],
      excerpt: frontmatter.excerpt || '',
      source: frontmatter.source || '',
      book: frontmatter.book || '',
      book_author: frontmatter.book_author || '',
    })
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date))
}

export async function loadBlogPosts() { return loadAll(blogModules) }
export async function loadNewsletterPosts() { return loadAll(newsletterModules) }
export async function loadVreadingsPosts() { return loadAll(vreadingsModules) }

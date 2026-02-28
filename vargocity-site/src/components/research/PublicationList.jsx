import { useState } from 'react'
import publications from '../../data/publications.json'

const sorted = [...publications].sort((a, b) => b.year - a.year)

const allTags = [...new Set(publications.flatMap(p => p.tags))].sort()

export default function PublicationList() {
  const [activeTag, setActiveTag] = useState(null)

  const filtered = activeTag
    ? sorted.filter(p => p.tags.includes(activeTag))
    : sorted

  return (
    <div>
      {/* Tag filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTag(null)}
          className="px-3 py-1 text-xs rounded-full transition-colors"
          style={{
            backgroundColor: !activeTag ? '#1A1A1A' : '#FFFFFF',
            color: !activeTag ? '#FFFFFF' : '#8A8A8A',
            border: '1px solid #E5E5E0',
            cursor: 'pointer',
          }}
        >
          All
        </button>
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag === activeTag ? null : tag)}
            className="px-3 py-1 text-xs rounded-full transition-colors"
            style={{
              backgroundColor: activeTag === tag ? '#1A1A1A' : '#FFFFFF',
              color: activeTag === tag ? '#FFFFFF' : '#8A8A8A',
              border: '1px solid #E5E5E0',
              cursor: 'pointer',
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Publications */}
      <div className="space-y-0" style={{ border: '1px solid #E5E5E0' }}>
        {filtered.map((pub, i) => (
          <div key={pub.id}
            style={{ borderBottom: i < filtered.length - 1 ? '1px solid #E5E5E0' : 'none' }}
            className="p-5 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {pub.url ? (
                  <a href={pub.url} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline"
                    style={{ color: '#1A1A1A' }}>
                    {pub.title}
                  </a>
                ) : (
                  <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                    {pub.title}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: '#4A4A4A' }}>
                  {pub.venue} · {pub.year}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {pub.tags.filter(t => t === 'climate-equity' || t === 'health-equity').map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-xs rounded"
                      style={{ backgroundColor: '#F0F0EC', color: '#4A4A4A' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold tabular-nums" style={{ color: '#1A1A1A' }}>
                  {pub.citations}
                </p>
                <p className="text-xs" style={{ color: '#8A8A8A' }}>cited</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

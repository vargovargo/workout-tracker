export default function ToolCard({ tool }) {
  return (
    <div style={{ border: '1px solid #E5E5E0', backgroundColor: '#FFFFFF' }}
      className="p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>{tool.name}</h3>
        <span className="text-xs px-2 py-0.5 rounded"
          style={{
            backgroundColor: tool.status === 'live' ? '#F0F0EC' : '#FAFAF8',
            color: '#8A8A8A',
            border: '1px solid #E5E5E0',
          }}>
          {tool.status === 'live' ? 'Live' : 'In Progress'}
        </span>
      </div>
      <p className="text-sm leading-relaxed mb-4" style={{ color: '#4A4A4A' }}>{tool.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {tool.tech.map(t => (
          <span key={t} className="text-xs px-2 py-0.5 rounded"
            style={{ backgroundColor: '#F4F4F0', color: '#4A4A4A' }}>
            {t}
          </span>
        ))}
      </div>
      {tool.url && (
        <a href={tool.url} target="_blank" rel="noopener noreferrer"
          className="text-xs transition-colors hover:text-[#1A1A1A]"
          style={{ color: '#8A8A8A' }}>
          Open app →
        </a>
      )}
    </div>
  )
}

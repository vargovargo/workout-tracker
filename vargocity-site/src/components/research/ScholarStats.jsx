import scholar from '../../data/scholar.json'

export default function ScholarStats() {
  return (
    <div style={{ border: '1px solid #E5E5E0', backgroundColor: '#FFFFFF' }}
      className="p-6 flex flex-wrap gap-8 items-end">
      <div>
        <p className="text-3xl font-semibold tabular-nums" style={{ color: '#1A1A1A' }}>
          {scholar.citations.toLocaleString()}
        </p>
        <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: '#8A8A8A' }}>
          Citations
        </p>
      </div>
      <div>
        <p className="text-3xl font-semibold tabular-nums" style={{ color: '#1A1A1A' }}>
          {scholar.h_index}
        </p>
        <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: '#8A8A8A' }}>
          h-index
        </p>
      </div>
      <div>
        <p className="text-3xl font-semibold tabular-nums" style={{ color: '#1A1A1A' }}>
          {scholar.i10_index}
        </p>
        <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: '#8A8A8A' }}>
          i10-index
        </p>
      </div>
      <div className="ml-auto">
        <a href={scholar.profile_url} target="_blank" rel="noopener noreferrer"
          className="text-xs transition-colors"
          style={{ color: '#8A8A8A' }}>
          View on Google Scholar →
        </a>
        <p className="text-xs mt-0.5" style={{ color: '#B0B0A8' }}>
          Updated {scholar.last_updated}
        </p>
      </div>
    </div>
  )
}

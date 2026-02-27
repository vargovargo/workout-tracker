import peaks from '../../data/peaks.json'

const sorted = [...peaks].sort((a, b) => new Date(a.date) - new Date(b.date))

export default function PeakTimeline() {
  if (sorted.length === 0) {
    return <p className="text-sm py-12 text-center" style={{ color: '#8A8A8A' }}>No peaks logged yet.</p>
  }
  return (
    <div className="relative">
      <div className="absolute left-2.5 top-0 bottom-0 w-px" style={{ backgroundColor: '#E5E5E0' }} />
      <div className="space-y-8">
        {sorted.map((peak, i) => (
          <div key={peak.id} className="relative pl-10">
            <div className="absolute left-0 top-1 w-5 h-5 rounded-full border"
              style={{ backgroundColor: '#FAFAF8', borderColor: '#E5E5E0' }} />
            <p className="text-xs tabular-nums mb-0.5" style={{ color: '#8A8A8A' }}>{peak.date}</p>
            <div className="flex items-baseline gap-3">
              <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{peak.name}</h3>
              <span className="text-xs tabular-nums" style={{ color: '#8A8A8A' }}>
                {peak.elevation_ft?.toLocaleString()} ft
              </span>
            </div>
            {(peak.route || peak.yds_class) && (
              <p className="text-xs mt-0.5" style={{ color: '#4A4A4A' }}>
                {[peak.route, peak.yds_class].filter(Boolean).join(' · ')}
              </p>
            )}
            {peak.team?.length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: '#4A4A4A' }}>
                with {peak.team.join(', ')}
              </p>
            )}
            {peak.notes && (
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#4A4A4A' }}>
                {peak.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

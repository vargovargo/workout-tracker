import peaks from '../../data/peaks.json'

const sorted = [...peaks].sort((a, b) => new Date(b.date) - new Date(a.date))

export default function PeakGrid() {
  if (sorted.length === 0) {
    return <p className="text-sm py-12 text-center" style={{ color: '#8A8A8A' }}>No peaks logged yet.</p>
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ border: '1px solid #E5E5E0', backgroundColor: '#E5E5E0' }}>
      {sorted.map((peak) => (
        <div key={peak.id} className="p-5" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{peak.name}</h3>
            <span className="text-xs tabular-nums shrink-0" style={{ color: '#8A8A8A' }}>
              {peak.elevation_ft?.toLocaleString()} ft
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: '#8A8A8A' }}>
            {peak.date} {peak.yds_class && `· ${peak.yds_class}`}
          </p>
          {peak.team?.length > 0 && (
            <p className="text-xs mt-1" style={{ color: '#4A4A4A' }}>
              with {peak.team.join(', ')}
            </p>
          )}
          {peak.notes && (
            <p className="text-xs mt-2 leading-relaxed" style={{ color: '#4A4A4A' }}>
              {peak.notes.length > 120 ? peak.notes.slice(0, 120) + '…' : peak.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

import peaks from '../../data/peaks.json'

const sorted = [...peaks].sort((a, b) => b.elevation_ft - a.elevation_ft)

const MAX_BARS = 20

export default function ElevationChart() {
  if (sorted.length === 0) return null
  const display = sorted.slice(0, MAX_BARS)
  const maxElev = display[0]?.elevation_ft || 1

  return (
    <div>
      <p className="text-xs font-medium mb-4 uppercase tracking-wider" style={{ color: '#8A8A8A' }}>
        By Elevation
      </p>
      <div className="space-y-2">
        {display.map((peak) => (
          <div key={peak.id} className="flex items-center gap-3">
            <div className="w-28 shrink-0 text-right">
              <span className="text-xs" style={{ color: '#4A4A4A' }}>{peak.name}</span>
            </div>
            <div className="flex-1 h-5 relative" style={{ backgroundColor: '#F4F4F0' }}>
              <div
                className="h-full"
                style={{
                  width: `${(peak.elevation_ft / maxElev) * 100}%`,
                  backgroundColor: '#1A1A1A',
                }}
              />
            </div>
            <span className="text-xs tabular-nums w-16 shrink-0" style={{ color: '#8A8A8A' }}>
              {peak.elevation_ft?.toLocaleString()} ft
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

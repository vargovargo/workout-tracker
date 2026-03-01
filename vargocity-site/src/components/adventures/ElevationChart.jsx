import { peaksByElevation, climbedPeaks } from '../../data/spsUtils'

const climbedIds = new Set(climbedPeaks.map(p => p.id))

export default function ElevationChart() {
  if (peaksByElevation.length === 0) return null

  const maxElev = peaksByElevation[0].elevation

  return (
    <div>
      <div className="flex items-center gap-6 mb-5">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#8A8A8A' }}>
          All 248 SPS Peaks by Elevation
        </p>
        <div className="flex items-center gap-4 ml-auto">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: '#1A1A1A' }}>
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#1A1A1A' }} />
            Climbed
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: '#8A8A8A' }}>
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#E5E5E0' }} />
            On the list
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {peaksByElevation.map((peak) => {
          const climbed = climbedIds.has(peak.id)
          return (
            <div key={peak.id} className="flex items-center gap-3">
              <div className="w-36 shrink-0 text-right">
                <span
                  className="text-xs"
                  style={{ color: climbed ? '#1A1A1A' : '#C0C0BA', fontWeight: climbed ? 600 : 400 }}
                >
                  {peak.name}
                </span>
              </div>
              <div className="flex-1 h-4 relative" style={{ backgroundColor: '#F4F4F0' }}>
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${(peak.elevation / maxElev) * 100}%`,
                    backgroundColor: climbed ? '#1A1A1A' : '#E5E5E0',
                  }}
                />
              </div>
              <span
                className="text-xs tabular-nums w-16 shrink-0"
                style={{ color: climbed ? '#4A4A4A' : '#C0C0BA' }}
              >
                {peak.elevation.toLocaleString()} ft
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

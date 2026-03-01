import { climbedPeaks } from '../../data/spsUtils'

// Most recently climbed first
const sorted = [...climbedPeaks].sort((a, b) => {
  const aLast = a.ascents.at(-1)?.date || ''
  const bLast = b.ascents.at(-1)?.date || ''
  return bLast.localeCompare(aLast)
})

function StravaLink({ url }) {
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Strava activity (private — log in to view)"
      className="inline-flex items-center gap-1 text-xs mt-2"
      style={{ color: '#FC4C02' }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
      </svg>
      Strava
    </a>
  )
}

export default function PeakGrid() {
  if (sorted.length === 0) {
    return (
      <p className="text-sm py-12 text-center" style={{ color: '#8A8A8A' }}>
        No peaks logged yet.
      </p>
    )
  }
  return (
    <div
      className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px"
      style={{ border: '1px solid #E5E5E0', backgroundColor: '#E5E5E0' }}
    >
      {sorted.map((peak) => {
        const lastAscent = peak.ascents.at(-1)
        const displayDate = lastAscent?.date
          ? new Date(lastAscent.date + 'T00:00:00').toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
            })
          : null
        return (
          <div key={peak.id} className="p-5" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{peak.name}</h3>
              <span className="text-xs tabular-nums shrink-0" style={{ color: '#8A8A8A' }}>
                {peak.elevation.toLocaleString()} ft
              </span>
            </div>
            {displayDate && (
              <p className="text-xs mt-1" style={{ color: '#8A8A8A' }}>
                {displayDate}
                {peak.routes?.length > 0 && ` · ${peak.routes[0].description}`}
              </p>
            )}
            {lastAscent?.notes && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: '#4A4A4A' }}>
                {lastAscent.notes.length > 120
                  ? lastAscent.notes.slice(0, 120) + '…'
                  : lastAscent.notes}
              </p>
            )}
            {peak.ascents.length > 1 && (
              <p className="text-xs mt-1" style={{ color: '#8A8A8A' }}>
                {peak.ascents.length} ascents
              </p>
            )}
            <StravaLink url={lastAscent?.strava_url} />
          </div>
        )
      })}
    </div>
  )
}

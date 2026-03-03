import { allAscents } from '../../data/spsUtils'

function StravaLink({ url }) {
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Strava activity (private — log in to view)"
      className="inline-flex items-center gap-1 text-xs"
      style={{ color: '#FC4C02' }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
      </svg>
      Strava
    </a>
  )
}

export default function PeakTimeline() {
  if (allAscents.length === 0) {
    return (
      <p className="text-sm py-12 text-center" style={{ color: '#8A8A8A' }}>
        No ascents logged yet.
      </p>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-2.5 top-0 bottom-0 w-px" style={{ backgroundColor: '#E5E5E0' }} />
      <div className="space-y-8">
        {allAscents.map((ascent, i) => {
          const { peak } = ascent
          const displayDate = new Date(ascent.date + 'T00:00:00').toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          })
          return (
            <div key={`${peak.id}-${ascent.date}-${i}`} className="relative pl-10">
              <div
                className="absolute left-0 top-1 w-5 h-5 rounded-full border-2"
                style={{ backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' }}
              />
              <p className="text-xs tabular-nums mb-0.5" style={{ color: '#8A8A8A' }}>
                {displayDate}
              </p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
                  {peak.name}
                </h3>
                <span className="text-xs tabular-nums" style={{ color: '#8A8A8A' }}>
                  {peak.elevation.toLocaleString()} ft
                </span>
                <StravaLink url={ascent.strava_url} />
              </div>
              {peak.routes?.length > 0 && (
                <p className="text-xs mt-0.5" style={{ color: '#4A4A4A' }}>
                  {peak.routes.map(r => r.description).join(' · ')}
                </p>
              )}
              {ascent.notes && (
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#4A4A4A' }}>
                  {ascent.notes}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

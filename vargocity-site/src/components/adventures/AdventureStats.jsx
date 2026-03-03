import { climbedPeaks, highestClimbed, SPS_TOTAL } from '../../data/spsUtils'
import countries from '../../data/countries.json'

export default function AdventureStats({ section }) {
  if (section === 'peaks') {
    return (
      <div className="flex flex-wrap gap-8 py-6" style={{ borderBottom: '1px solid #E5E5E0' }}>
        <div>
          <p className="text-2xl font-semibold tabular-nums" style={{ color: '#1A1A1A' }}>
            {climbedPeaks.length}
            <span className="text-base font-normal" style={{ color: '#8A8A8A' }}>
              {' '}/ {SPS_TOTAL}
            </span>
          </p>
          <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#8A8A8A' }}>SPS Peaks Climbed</p>
        </div>
        {highestClimbed > 0 && (
          <div>
            <p className="text-2xl font-semibold tabular-nums" style={{ color: '#1A1A1A' }}>
              {highestClimbed.toLocaleString()}
              <span className="text-sm font-normal"> ft</span>
            </p>
            <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#8A8A8A' }}>Highest Summit</p>
          </div>
        )}
      </div>
    )
  }

  const continents = [...new Set(countries.map(c => c.continent))].length
  return (
    <div className="flex flex-wrap gap-8 py-6" style={{ borderBottom: '1px solid #E5E5E0' }}>
      <div>
        <p className="text-2xl font-semibold tabular-nums" style={{ color: '#1A1A1A' }}>{countries.length}</p>
        <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#8A8A8A' }}>Countries</p>
      </div>
      <div>
        <p className="text-2xl font-semibold tabular-nums" style={{ color: '#1A1A1A' }}>{continents}</p>
        <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#8A8A8A' }}>Continents</p>
      </div>
    </div>
  )
}

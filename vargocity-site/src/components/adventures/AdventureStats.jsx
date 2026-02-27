import peaks from '../../data/peaks.json'
import countries from '../../data/countries.json'

export default function AdventureStats({ section }) {
  if (section === 'peaks') {
    const highest = peaks.reduce((best, p) => p.elevation_ft > best ? p.elevation_ft : best, 0)
    const totalGain = peaks.reduce((sum, p) => sum + (p.vertical_gain_ft || 0), 0)
    return (
      <div className="flex flex-wrap gap-8 py-6" style={{ borderBottom: '1px solid #E5E5E0' }}>
        <div>
          <p className="text-2xl font-semibold tabular-nums" style={{ color: '#1A1A1A' }}>{peaks.length}</p>
          <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#8A8A8A' }}>Peaks Summited</p>
        </div>
        {highest > 0 && (
          <div>
            <p className="text-2xl font-semibold tabular-nums" style={{ color: '#1A1A1A' }}>{highest.toLocaleString()}<span className="text-sm font-normal"> ft</span></p>
            <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#8A8A8A' }}>Highest Summit</p>
          </div>
        )}
        {totalGain > 0 && (
          <div>
            <p className="text-2xl font-semibold tabular-nums" style={{ color: '#1A1A1A' }}>{totalGain.toLocaleString()}<span className="text-sm font-normal"> ft</span></p>
            <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#8A8A8A' }}>Total Vertical Gain</p>
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

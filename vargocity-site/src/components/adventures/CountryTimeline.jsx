import countries from '../../data/countries.json'

const sorted = [...countries].sort((a, b) => a.year_first_visited - b.year_first_visited)

// Group by decade
const byDecade = sorted.reduce((acc, c) => {
  const decade = Math.floor(c.year_first_visited / 10) * 10
  const key = `${decade}s`
  if (!acc[key]) acc[key] = []
  acc[key].push(c)
  return acc
}, {})

export default function CountryTimeline() {
  if (sorted.length === 0) {
    return <p className="text-sm py-12 text-center" style={{ color: '#8A8A8A' }}>No countries logged yet.</p>
  }
  return (
    <div className="space-y-8">
      {Object.entries(byDecade).map(([decade, items]) => (
        <div key={decade}>
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#8A8A8A' }}>
            {decade}
          </p>
          <div className="space-y-2">
            {items.map((c) => (
              <div key={c.iso} className="flex items-start gap-4">
                <span className="text-xs tabular-nums w-8 pt-px" style={{ color: '#8A8A8A' }}>
                  {c.year_first_visited}
                </span>
                <div>
                  <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{c.name}</span>
                  {c.cities?.length > 0 && (
                    <span className="text-xs ml-2" style={{ color: '#4A4A4A' }}>
                      {c.cities.join(', ')}
                    </span>
                  )}
                  {c.notes && (
                    <p className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>{c.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

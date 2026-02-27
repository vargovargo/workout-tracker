import AnimatedCounter from '../shared/AnimatedCounter'
import scholar from '../../data/scholar.json'
import peaks from '../../data/peaks.json'
import countries from '../../data/countries.json'
import publications from '../../data/publications.json'

const stats = [
  { value: scholar.citations, label: 'Citations', suffix: '+' },
  { value: peaks.length, label: 'Sierra Peaks' },
  { value: countries.length, label: 'Countries' },
  { value: publications.length, label: 'Publications', suffix: '+' },
]

export default function StatsBar() {
  return (
    <section style={{ borderTop: '1px solid #E5E5E0', borderBottom: '1px solid #E5E5E0' }}
      className="py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map(({ value, label, suffix }) => (
            <div key={label}>
              <p className="text-2xl font-semibold tabular-nums" style={{ color: '#1A1A1A' }}>
                <AnimatedCounter value={value} />{suffix || ''}
              </p>
              <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: '#8A8A8A' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

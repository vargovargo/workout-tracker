const milestones = [
  {
    year: '2001',
    role: 'B.S. Chemical Engineering',
    org: 'University of Michigan',
    note: 'Where the habit of precision measurement began.',
  },
  {
    year: '2009',
    role: 'MCRP + MPH (dual degree)',
    org: 'Georgia Tech & Emory University',
    note: 'Pioneered this joint degree program connecting urban planning to public health.',
  },
  {
    year: '2012',
    role: 'PhD, City & Regional Planning',
    org: 'Georgia Institute of Technology',
    note: 'Dissertation on how cities plan for extreme heat — and who bears the risk when they don\'t.',
  },
  {
    year: '2012',
    role: 'Assistant Scientist',
    org: 'Global Health Institute & Nelson Institute, UW–Madison',
    note: 'Postdoctoral research on cities, climate, and environmental health.',
  },
  {
    year: '2015',
    role: 'Founder & Director, UniverCity Alliance',
    org: 'University of Wisconsin–Madison',
    note: 'Built a cross-campus initiative connecting UW research to Wisconsin communities. Mission: equity, democracy, sustainability.',
    equity: true,
  },
  {
    year: '2019',
    role: 'Lead Scientist, Climate Change & Health Equity',
    org: 'California Department of Public Health',
    note: 'Subject matter expert for the state\'s COVID-19 Health Equity Metric. Research on wildfire smoke, extreme heat, and who bears the burden.',
    equity: true,
  },
  {
    year: '2022',
    role: 'Senior Researcher, Community Development',
    org: 'Federal Reserve Bank of San Francisco',
    note: 'Researching how climate risk intersects with economic opportunity in lower-income communities.',
    equity: true,
  },
]

export default function CareerTimeline() {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-2.5 top-0 bottom-0 w-px" style={{ backgroundColor: '#E5E5E0' }} />

      <div className="space-y-8">
        {milestones.map((m, i) => (
          <div key={i} className="relative pl-10">
            {/* Node */}
            <div className="absolute left-0 top-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#FAFAF8', border: `1px solid ${m.equity ? '#1A1A1A' : '#E5E5E0'}` }}>
              {m.equity && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1A1A1A' }} />}
            </div>

            <p className="text-xs font-medium tabular-nums mb-0.5" style={{ color: '#8A8A8A' }}>
              {m.year}
            </p>
            <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
              {m.role}
            </p>
            <p className="text-sm" style={{ color: '#4A4A4A' }}>
              {m.org}
            </p>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: '#8A8A8A' }}>
              {m.note}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

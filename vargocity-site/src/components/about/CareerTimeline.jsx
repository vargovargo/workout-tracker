const milestones = [
  {
    year: '2001',
    role: 'B.S. Chemical Engineering',
    org: 'University of Michigan',
    note: 'Where the habit of precise measurement began — and the lesson that learning how to learn matters more than any specific content.',
  },
  {
    year: '2009',
    role: 'MCRP + MPH (dual degree)',
    org: 'Georgia Tech & Emory University',
    note: 'Pioneered this joint degree program connecting urban planning to public health — two fields asking the same question about who thrives in the built environment.',
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
    note: 'Postdoctoral research on cities, climate, and environmental health — working alongside Jonathan Patz, whose IPCC contributions helped earn the 2007 Nobel Peace Prize.',
  },
  {
    year: '2015',
    role: 'Founder & Director, UniverCity Alliance',
    org: 'University of Wisconsin–Madison',
    note: 'Built a cross-campus initiative connecting UW research to Wisconsin communities. Twenty-nine partnerships. Joel Rogers — MacArthur Fellow and architect of the High Road framework — was across campus; his argument that economic and environmental wellbeing aren\'t trade-offs has never left me.',
  },
  {
    year: '2019',
    role: 'Lead Scientist, Climate Change & Health Equity',
    org: 'California Department of Public Health',
    note: 'Research on wildfire smoke, extreme heat, and the communities that bear the burden — and why that burden is distributed the way it is.',
  },
  {
    year: '2020',
    role: 'Lead, COVID-19 Modeling & Forecasting',
    org: 'California Department of Public Health',
    note: 'Pulled from the climate team to lead the state\'s COVID-19 modeling effort. Built a public forecasting dashboard drawing on data ensembles from hundreds of citizen scientists. Developed the COVID-19 Health Equity Metric to direct state resources toward the communities at greatest risk. Working with DJ Patil — the first U.S. Chief Data Scientist — sharpened a framework for the ethics of data science that I carry into every project since.',
  },
  {
    year: '2022',
    role: 'Senior Researcher, Community Development',
    org: 'Federal Reserve Bank of San Francisco',
    note: 'Researching how climate risk intersects with economic opportunity in lower-income communities. Same question, new institution.',
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
            <div className="absolute left-0 top-1 w-5 h-5 rounded-full"
              style={{ backgroundColor: '#FAFAF8', border: '1px solid #E5E5E0' }} />

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

const themes = [
  {
    id: 'climate-equity',
    title: 'Climate Equity',
    description: 'The burdens of climate change — wildfire smoke, extreme heat, flooding, displacement — do not fall equally. My research makes those disparities legible and advocates for policy that addresses root causes.',
    quote: '"The unequal nature of those impacts demands attention to the root causes of climate-related suffering."',
    highlight: true,
  },
  {
    id: 'urban-health',
    title: 'Urban Health',
    description: 'How the built environment shapes human health. Walkability, green space, housing density, transit access — design choices that determine whether healthy choices are easy choices.',
  },
  {
    id: 'sustainable-urbanism',
    title: 'Sustainable Urbanism',
    description: 'Cities are humanity\'s dominant habitat. They can sustain the planet\'s life support systems or degrade them. Good urban planning does both: builds for people and builds for the planet.',
  },
  {
    id: 'metro-sapiens',
    title: 'Metro Sapiens',
    description: 'The central provocation of my early work: we are becoming an urban species. More than half of humanity now lives in cities. Understanding that habitat — and designing it well — is the challenge of our century.',
  },
  {
    id: 'technology-society',
    title: 'Technology & Society',
    description: 'The question I\'ve spent a career asking — who bears the cost of powerful systems, and what can change that — applies equally to AI. Causal inference, disparity measurement, and policy translation don\'t care which domain you\'re in.',
  },
]

export default function ThemeCards() {
  return (
    <div className="grid sm:grid-cols-2 gap-px" style={{ border: '1px solid #E5E5E0', backgroundColor: '#E5E5E0' }}>
      {themes.map((t) => (
        <div key={t.id} className="p-6" style={{ backgroundColor: '#FFFFFF' }}>
          <h3 className="text-base font-semibold mb-2" style={{ color: '#1A1A1A' }}>
            {t.title}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: '#4A4A4A' }}>
            {t.description}
          </p>
          {t.quote && (
            <blockquote className="mt-4 pl-3 text-sm italic leading-relaxed"
              style={{ color: '#4A4A4A', borderLeft: '2px solid #E5E5E0' }}>
              {t.quote}
            </blockquote>
          )}
        </div>
      ))}
    </div>
  )
}

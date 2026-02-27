import SectionHeader from '../components/shared/SectionHeader'
import ThemeCards from '../components/research/ThemeCards'
import ScholarStats from '../components/research/ScholarStats'
import PublicationList from '../components/research/PublicationList'

const media = [
  { outlet: 'NASA Applied Sciences', title: 'Watching Wildfire Smoke Impacts for Healthier Communities', url: 'https://appliedsciences.nasa.gov/our-impact/people/watching-wildfire-smoke-impacts-healthier-communities' },
  { outlet: 'Smithsonian Magazine', title: 'Humans Are Becoming City-Dwelling Metro Sapiens', url: 'https://www.smithsonianmag.com/science-nature/humans-are-becoming-city-dwelling-metro-sapiens-180953449/' },
  { outlet: 'Scientific American', title: 'Urban Planning and Public Health', url: '' },
  { outlet: 'FedCommunities', title: 'Unveiling the Effects of Wildfire Smoke on Vulnerable Communities', url: 'https://fedcommunities.org/unveiling-effects-wildfire-smoke-vulnerable-communities/' },
  { outlet: 'HuffPost', title: 'Author archive', url: 'https://www.huffpost.com/author/jason-vargo' },
]

export default function ResearchPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <SectionHeader
        label="Research"
        title="Urban Health & Climate Equity"
        description="I study how climate risk, urban design, and economic systems shape who thrives and who doesn't — and what policies can change those outcomes."
      />

      {/* Research Themes */}
      <section className="mb-14">
        <h2 className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: '#8A8A8A' }}>
          Research Themes
        </h2>
        <ThemeCards />
      </section>

      {/* Scholar Stats */}
      <section className="mb-14">
        <h2 className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: '#8A8A8A' }}>
          Google Scholar
        </h2>
        <ScholarStats />
      </section>

      {/* Publications */}
      <section className="mb-14">
        <h2 className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: '#8A8A8A' }}>
          Selected Publications
        </h2>
        <PublicationList />
      </section>

      {/* Media */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: '#8A8A8A' }}>
          Media & Press
        </h2>
        <div className="space-y-0" style={{ border: '1px solid #E5E5E0' }}>
          {media.map((m, i) => (
            <div key={i}
              style={{ borderBottom: i < media.length - 1 ? '1px solid #E5E5E0' : 'none' }}
              className="px-5 py-4 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: '#8A8A8A' }}>{m.outlet}</p>
                  {m.url ? (
                    <a href={m.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm hover:underline" style={{ color: '#1A1A1A' }}>
                      {m.title}
                    </a>
                  ) : (
                    <p className="text-sm" style={{ color: '#1A1A1A' }}>{m.title}</p>
                  )}
                </div>
                {m.url && (
                  <span className="text-xs shrink-0" style={{ color: '#8A8A8A' }}>↗</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

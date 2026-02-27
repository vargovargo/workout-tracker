import { useState } from 'react'
import SectionHeader from '../components/shared/SectionHeader'
import TabBar from '../components/shared/TabBar'
import AdventureStats from '../components/adventures/AdventureStats'
import PeakGrid from '../components/adventures/PeakGrid'
import PeakTimeline from '../components/adventures/PeakTimeline'
import ElevationChart from '../components/adventures/ElevationChart'
import WorldMap from '../components/adventures/WorldMap'
import CountryTimeline from '../components/adventures/CountryTimeline'

const tabs = [
  { id: 'peaks', label: 'Sierra Peaks' },
  { id: 'countries', label: 'Countries Visited' },
]

const peakViews = [
  { id: 'grid', label: 'Grid' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'chart', label: 'Elevation' },
]

export default function AdventuresPage() {
  const [tab, setTab] = useState('peaks')
  const [peakView, setPeakView] = useState('grid')

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <SectionHeader
        label="Adventures"
        title="Sierra Peaks & Far Places"
        description="A log of summits in the Sierra Nevada and countries visited — the personal rate of change."
      />

      <div className="mb-8">
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === 'peaks' && (
        <div>
          <AdventureStats section="peaks" />

          {/* Peak sub-view switcher */}
          <div className="flex gap-3 my-6">
            {peakViews.map(v => (
              <button
                key={v.id}
                onClick={() => setPeakView(v.id)}
                className="text-xs px-3 py-1.5 rounded transition-colors"
                style={{
                  backgroundColor: peakView === v.id ? '#1A1A1A' : '#FFFFFF',
                  color: peakView === v.id ? '#FFFFFF' : '#8A8A8A',
                  border: '1px solid #E5E5E0',
                  cursor: 'pointer',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          {peakView === 'grid' && <PeakGrid />}
          {peakView === 'timeline' && <PeakTimeline />}
          {peakView === 'chart' && <ElevationChart />}
        </div>
      )}

      {tab === 'countries' && (
        <div>
          <AdventureStats section="countries" />
          <div className="mt-6 mb-8">
            <WorldMap />
          </div>
          <CountryTimeline />
        </div>
      )}
    </div>
  )
}

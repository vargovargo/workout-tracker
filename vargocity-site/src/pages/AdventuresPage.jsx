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
        description="The window for hard adventuring is finite. A log of Sierra summits and far places — and what I've done with it so far."
      />

      <div className="mb-8">
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === 'peaks' && (
        <div>
          <AdventureStats section="peaks" />

          {/* SPS list context */}
          <p className="text-sm leading-relaxed mt-6" style={{ color: '#4A4A4A' }}>
            The <strong>Sierra Peaks Section (SPS) List</strong> is a roster of 248 peaks maintained
            by the Angeles Chapter of the Sierra Club — a lifetime project for most who attempt it.
            The peaks span the length of the Sierra Nevada, from the volcanic tableland near Mammoth
            to the granite walls of Sequoia. About half require technical scrambling (Class 3–4);
            a handful demand ropes.
          </p>

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

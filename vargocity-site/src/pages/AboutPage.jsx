import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import SectionHeader from '../components/shared/SectionHeader'
import CareerTimeline from '../components/about/CareerTimeline'
import TEDxSpotlight from '../components/about/TEDxSpotlight'

// Import the about markdown as raw text via Vite's ?raw suffix
import aboutRaw from '../content/about.md?raw'

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <SectionHeader label="About" title="In Motion" />

      <div className="grid lg:grid-cols-5 gap-16">
        {/* Narrative prose */}
        <div className="lg:col-span-3">
          <div className="prose prose-sm max-w-none"
            style={{ color: '#4A4A4A', lineHeight: '1.85' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {aboutRaw}
            </ReactMarkdown>
          </div>
        </div>

        {/* Timeline sidebar */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold mb-6 uppercase tracking-wider"
            style={{ color: '#8A8A8A' }}>
            Career
          </h2>
          <CareerTimeline />
        </div>
      </div>

      {/* TEDx */}
      <div className="mt-16">
        <TEDxSpotlight />
      </div>
    </div>
  )
}

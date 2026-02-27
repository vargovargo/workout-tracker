import { useState } from 'react'
import SectionHeader from '../components/shared/SectionHeader'
import TabBar from '../components/shared/TabBar'
import ToolCard from '../components/making/ToolCard'
import FurnitureCard from '../components/making/FurnitureCard'
import tools from '../data/tools.json'
import furniture from '../data/furniture.json'

const tabs = [
  { id: 'software', label: 'Software Tools' },
  { id: 'furniture', label: 'Furniture & Design' },
]

export default function MakingPage() {
  const [tab, setTab] = useState('software')

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <SectionHeader
        label="Making"
        title="Code & Wood"
        description="Software tools and furniture built from salvaged materials. Two different practices, same impulse: make something useful out of what you have."
      />

      <div className="mb-8">
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === 'software' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {tools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
        </div>
      )}

      {tab === 'furniture' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {furniture.map(item => <FurnitureCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}

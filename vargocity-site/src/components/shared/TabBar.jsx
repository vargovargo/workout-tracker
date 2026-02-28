export default function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ borderBottom: '1px solid #E5E5E0' }} className="flex gap-0">
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="px-4 py-3 text-sm transition-colors relative"
            style={{ color: isActive ? '#1A1A1A' : '#8A8A8A', fontWeight: isActive ? '500' : '400', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: '#1A1A1A' }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

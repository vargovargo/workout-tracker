import React from 'react'

const TABS = [
  { id: 'dashboard',  label: 'This Week',  icon: DashboardIcon },
  { id: 'progress',   label: 'Progress',   icon: ProgressIcon },
  { id: 'activities', label: 'Activities', icon: ActivitiesIcon },
  { id: 'history',    label: 'History',    icon: HistoryIcon },
]

function DashboardIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function PlusIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

function HistoryIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  )
}

function ActivitiesIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <line x1="5" y1="18" x2="5" y2="12" />
      <line x1="10" y1="18" x2="10" y2="8" />
      <line x1="15" y1="18" x2="15" y2="5" />
      <line x1="20" y1="18" x2="20" y2="10" />
    </svg>
  )
}

function ProgressIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <polygon points="12 3 20 9 20 15 12 21 4 15 4 9" />
      <polygon points="12 7 16.5 10.5 16.5 13.5 12 17 7.5 13.5 7.5 10.5" />
    </svg>
  )
}

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav
      className="flex-shrink-0 bg-slate-900 border-t border-slate-700"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="flex">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 min-h-[56px] transition-colors ${
                active ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              <Icon active={active} />
              <span className={`text-xs font-medium ${active ? 'text-blue-400' : 'text-slate-500'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

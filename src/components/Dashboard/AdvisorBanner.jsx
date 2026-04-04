import React from 'react'
import { useApp } from '../../App.jsx'

const TONE_CONFIG = {
  push:     { bg: 'bg-green-900/20',  border: 'border-green-800/50',  badge: 'bg-green-900/50 text-green-300 border-green-700',    label: 'Push week' },
  recover:  { bg: 'bg-red-900/20',    border: 'border-red-800/50',    badge: 'bg-red-900/50 text-red-300 border-red-700',          label: 'Recovery week' },
  maintain: { bg: 'bg-slate-800',     border: 'border-slate-700',     badge: 'bg-yellow-900/50 text-yellow-300 border-yellow-700', label: 'Maintain' },
}

export default function AdvisorBanner() {
  const { report, openAdvisor } = useApp()
  if (!report) return null

  const { overallTone, focusThisWeek = [] } = report
  const { bg, border, badge, label } = TONE_CONFIG[overallTone] ?? TONE_CONFIG.maintain
  const focus = focusThisWeek.slice(0, 2)

  return (
    <button
      onClick={openAdvisor}
      className={`mx-4 mt-3 p-3 rounded-xl ${bg} border ${border} text-left w-[calc(100%-2rem)] active:opacity-70`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">🤖</span>
          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${badge}`}>
            {label}
          </span>
        </div>
        <span className="text-xs text-slate-500">Full report →</span>
      </div>
      {focus.length > 0 && (
        <ul className="flex flex-col gap-1">
          {focus.map((item, i) => (
            <li key={i} className="text-xs text-slate-300 flex gap-1.5">
              <span className="text-slate-500 shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </button>
  )
}

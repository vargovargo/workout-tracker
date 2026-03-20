import React from 'react'
import { weekLabel } from '../../utils/weekUtils.js'

export default function WeekHeader({ weekKey, onShowAdvisor, hasReport }) {
  const label = weekLabel(weekKey)
  return (
    <div className="px-4 pt-5 pb-2 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">This Week</p>
        <h1 className="text-xl font-bold text-white mt-0.5">{label}</h1>
      </div>
      {hasReport && (
        <button
          onClick={onShowAdvisor}
          className="mt-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 active:opacity-70"
        >
          <span className="text-sm">🤖</span>
          <span className="text-xs font-medium text-slate-300">AI Rec</span>
        </button>
      )}
    </div>
  )
}

import React from 'react'
import { WORKOUT_CONFIG } from '../../config.js'

export default function SubtypePicker({ categoryKey, onSelect, onBack }) {
  const cfg = WORKOUT_CONFIG[categoryKey]

  return (
    <div className="px-4 pt-6 pb-4 slide-up">
      <button onClick={onBack} className="flex items-center gap-1 text-slate-400 text-sm mb-5">
        <span>‹</span> Back
      </button>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-4xl">{cfg.icon}</span>
        <div>
          <h2 className="text-xl font-bold text-white">{cfg.label}</h2>
          <p className="text-sm text-slate-400">Pick a type</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {cfg.subtypes.map((sub) => (
          <button
            key={sub}
            onClick={() => onSelect(sub)}
            className={`flex items-center justify-between px-5 py-4 rounded-2xl border ${cfg.bgClass} ${cfg.borderClass} active:scale-95 transition-transform`}
          >
            <span className={`text-base font-semibold capitalize ${cfg.accentClass}`}>{sub}</span>
            <span className="text-slate-500">›</span>
          </button>
        ))}
        <button
          onClick={() => onSelect(undefined)}
          className="flex items-center justify-between px-5 py-4 rounded-2xl border bg-slate-800 border-slate-700 active:scale-95 transition-transform"
        >
          <span className="text-base font-semibold text-slate-300">General / Other</span>
          <span className="text-slate-500">›</span>
        </button>
      </div>
    </div>
  )
}

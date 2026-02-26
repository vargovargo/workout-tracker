import React from 'react'
import { WORKOUT_CONFIG } from '../../config.js'

export default function CategoryPicker({ onSelect }) {
  return (
    <div className="px-4 pt-6 pb-4">
      <h2 className="text-xl font-bold text-white mb-1">Log Workout</h2>
      <p className="text-sm text-slate-400 mb-5">What did you do?</p>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(WORKOUT_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border ${cfg.bgClass} ${cfg.borderClass} active:scale-95 transition-transform`}
            style={{ minHeight: 120 }}
          >
            <span className="text-4xl">{cfg.icon}</span>
            <span className={`text-sm font-bold ${cfg.accentClass}`}>{cfg.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

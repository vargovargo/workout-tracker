import React from 'react'
import { WORKOUT_CONFIG } from '../../config.js'

// Build a flat list of all selectable activities grouped by category
const GROUPS = Object.entries(WORKOUT_CONFIG).map(([catKey, cfg]) => ({
  catKey,
  cfg,
  items: cfg.subtypes.length > 0
    ? cfg.subtypes.map((sub) => ({ label: sub, subtype: sub, icon: cfg.subtypeIcons?.[sub] ?? cfg.icon }))
    : [{ label: cfg.label, subtype: null, icon: cfg.icon }],
}))

export default function FlatActivityPicker({ onSelect }) {
  return (
    <div className="px-4 pt-5 pb-4">
      <h2 className="text-xl font-bold text-white mb-0.5">Log Workout</h2>
      <p className="text-sm text-slate-400 mb-5">What did you do?</p>

      <div className="flex flex-col gap-5">
        {GROUPS.map(({ catKey, cfg, items }) => (
          <div key={catKey}>
            {/* Section header — only show for categories that have subtypes */}
            {cfg.subtypes.length > 0 && (
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${cfg.accentClass}`}>
                {cfg.icon} {cfg.label}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {items.map(({ label, subtype, icon }) => (
                <button
                  key={label}
                  onClick={() => onSelect(catKey, subtype)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl border ${cfg.bgClass} ${cfg.borderClass} active:scale-95 transition-transform`}
                >
                  <span className="text-lg">{icon}</span>
                  <span className={`text-sm font-semibold capitalize ${cfg.accentClass}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

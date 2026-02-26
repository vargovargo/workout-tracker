import React from 'react'
import { WORKOUT_CONFIG } from '../../config.js'
import { getSuggestions } from '../../utils/suggestionUtils.js'
import { useApp } from '../../App.jsx'

export default function SuggestionBanner({ weekSessions }) {
  const { setTab } = useApp()
  const suggestions = getSuggestions(weekSessions)

  if (suggestions.length === 0) {
    return (
      <div className="mx-4 mt-3 mb-1 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
        <p className="text-sm font-semibold text-emerald-400">🎉 All targets hit this week!</p>
        <p className="text-xs text-slate-400 mt-0.5">Great work — keep that streak alive.</p>
      </div>
    )
  }

  return (
    <div className="mx-4 mt-3 mb-1 p-4 rounded-xl bg-slate-800 border border-slate-700">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
        Suggested today
      </p>
      <div className="flex flex-col gap-2">
        {suggestions.map(({ key, cfg, remaining }) => (
          <button
            key={key}
            onClick={() => setTab('log')}
            className={`flex items-center gap-3 p-2 rounded-lg ${cfg.bgClass} active:scale-95 transition-transform`}
          >
            <span className="text-xl">{cfg.icon}</span>
            <div className="flex-1 text-left">
              <p className={`text-sm font-semibold ${cfg.accentClass}`}>{cfg.label}</p>
              <p className="text-xs text-slate-400">
                {remaining} session{remaining !== 1 ? 's' : ''} remaining
              </p>
            </div>
            <span className="text-slate-500">›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

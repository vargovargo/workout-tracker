import React, { useState } from 'react'
import { WORKOUT_CONFIG } from '../../config.js'

const CATEGORY_KEYS = Object.keys(WORKOUT_CONFIG)

export default function WeekMinutesChart({ weekSessions }) {
  const [expandedKey, setExpandedKey] = useState(null)

  const totals = {}
  for (const key of CATEGORY_KEYS) {
    totals[key] = weekSessions
      .filter((s) => s.category === key)
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
  }

  const maxMins = Math.max(...Object.values(totals), 1)
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)

  function toggle(key) {
    setExpandedKey((prev) => (prev === key ? null : key))
  }

  return (
    <div className="mx-4 mt-3 p-4 rounded-xl bg-slate-800 border border-slate-700">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Weekly Minutes
        </p>
        {grandTotal > 0 && (
          <p className="text-xs font-semibold text-slate-400">
            {grandTotal} min total
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {CATEGORY_KEYS.map((key) => {
          const cfg = WORKOUT_CONFIG[key]
          const mins = totals[key]
          const pct = (mins / maxMins) * 100
          const isExpanded = expandedKey === key
          const categorySessions = weekSessions
            .filter((s) => s.category === key)
            .sort(
              (a, b) =>
                new Date(b.occurredAt || b.loggedAt) -
                new Date(a.occurredAt || a.loggedAt)
            )

          return (
            <div key={key}>
              <div
                className={`flex items-center gap-3 ${mins > 0 ? 'cursor-pointer' : ''}`}
                onClick={() => mins > 0 && toggle(key)}
              >
                <span className="text-base w-5 text-center flex-shrink-0">{cfg.icon}</span>
                <span className="text-xs font-medium text-slate-400 w-20 flex-shrink-0 truncate">
                  {cfg.label}
                </span>
                <div className="flex-1 h-3 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: mins > 0 ? `${pct}%` : '0%',
                      backgroundColor: cfg.arcColor,
                      minWidth: mins > 0 ? '6px' : '0',
                    }}
                  />
                </div>
                <span
                  className="text-xs font-semibold w-12 text-right flex-shrink-0"
                  style={{ color: mins > 0 ? cfg.arcColor : '#475569' }}
                >
                  {mins > 0 ? `${mins}m` : '—'}
                </span>
              </div>

              {isExpanded && (
                <div className="mt-2 ml-8 flex flex-col gap-1.5">
                  {categorySessions.map((s) => {
                    const subtypeIcon = s.subtype && cfg.subtypeIcons?.[s.subtype]
                    const date = new Date(s.occurredAt || s.loggedAt)
                    const dateStr = date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-xs text-slate-400"
                      >
                        <span className="flex items-center gap-1">
                          {subtypeIcon && <span>{subtypeIcon}</span>}
                          <span>{s.subtype || cfg.label}</span>
                        </span>
                        <span className="text-slate-500">{dateStr}</span>
                        <span style={{ color: cfg.arcColor }}>{s.durationMinutes}m</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

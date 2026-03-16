import React, { useState } from 'react'
import { WORKOUT_CONFIG } from '../../config.js'
import { toDateString } from '../../utils/weekUtils.js'

const CATEGORY_COLORS = {
  strength:    '#60a5fa',
  cardio:      '#22d3ee',
  mobility:    '#34d399',
  mindfulness: '#a78bfa',
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Returns last 52 weeks of Monday-aligned dates
function buildWeeks() {
  const today = new Date()
  // Find the most recent Sunday (end of last full week column)
  const dow = today.getDay() // 0=Sun
  // Align so last column ends at current week's Sunday
  const daysToSunday = (7 - dow) % 7
  const endSunday = new Date(today)
  endSunday.setDate(today.getDate() + daysToSunday)

  const weeks = []
  for (let w = 51; w >= 0; w--) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(endSunday)
      date.setDate(endSunday.getDate() - w * 7 - (6 - d))
      week.push(date)
    }
    weeks.push(week)
  }
  return weeks
}

// Group sessions by date string
function buildDayMap(sessions) {
  const map = {}
  for (const s of sessions) {
    const ds = toDateString(new Date(s.occurredAt || s.loggedAt))
    if (!map[ds]) map[ds] = []
    map[ds].push(s)
  }
  return map
}

// Dominant category and total minutes for a day
function daySummary(daySessions) {
  if (!daySessions || daySessions.length === 0) return null
  const minutes = daySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
  const catCounts = {}
  for (const s of daySessions) catCounts[s.category] = (catCounts[s.category] || 0) + 1
  const dominant = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0][0]
  return { minutes, dominant, sessions: daySessions }
}

// Opacity scaled by minutes (max ~120 min = full opacity)
function minutesToOpacity(minutes) {
  return Math.min(1, 0.25 + (minutes / 120) * 0.75)
}

export default function CalendarHeatmap({ sessions }) {
  const [tooltip, setTooltip] = useState(null)
  const weeks = buildWeeks()
  const dayMap = buildDayMap(sessions)
  const todayStr = toDateString(new Date())

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-0.5 min-w-max px-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((date, di) => {
              const ds = toDateString(date)
              const summary = daySummary(dayMap[ds])
              const isToday = ds === todayStr
              const isFuture = ds > todayStr

              let bg = 'bg-slate-800'
              let opacity = 1
              if (summary) {
                const color = CATEGORY_COLORS[summary.dominant]
                opacity = minutesToOpacity(summary.minutes)
                return (
                  <div
                    key={di}
                    className={`w-3 h-3 rounded-sm cursor-pointer transition-transform active:scale-90 ${isToday ? 'ring-1 ring-white' : ''}`}
                    style={{ backgroundColor: color, opacity }}
                    onClick={() => setTooltip(tooltip?.ds === ds ? null : { ds, ...summary })}
                  />
                )
              }

              return (
                <div
                  key={di}
                  className={`w-3 h-3 rounded-sm ${bg} ${isToday ? 'ring-1 ring-slate-600' : ''} ${isFuture ? 'opacity-20' : 'opacity-40'}`}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Day of week labels */}
      <div className="flex gap-0.5 mt-1 px-1">
        {weeks[0].map((date, di) => (
          <div key={di} className="w-3 text-center" style={{ fontSize: 6, color: '#64748b' }}>
            {di % 2 === 0 ? DAY_LABELS[di] : ''}
          </div>
        ))}
      </div>

      {/* Tooltip / day detail */}
      {tooltip && (
        <div className="mt-3 p-3 rounded-lg bg-slate-800 border border-slate-700 text-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-white">{tooltip.ds}</p>
            <p className="text-xs text-slate-400">{tooltip.minutes} min total</p>
          </div>
          {tooltip.sessions.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-300 mb-1">
              <span>{WORKOUT_CONFIG[s.category]?.icon}</span>
              <span className="capitalize">{s.subtype || s.category}</span>
              <span className="text-slate-500">{s.durationMinutes}m</span>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-3 mt-2 px-1 flex-wrap">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            <span style={{ fontSize: 9, color: '#64748b' }} className="capitalize">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

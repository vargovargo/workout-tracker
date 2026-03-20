import React, { useState } from 'react'
import { FITNESS_CONFIG } from '../../config.js'
import { toDateString } from '../../utils/weekUtils.js'

const CATEGORY_COLORS = {
  strength:    '#60a5fa',
  cardio:      '#22d3ee',
  mobility:    '#34d399',
  mindfulness: '#a78bfa',
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function buildWeeks(n = 26) {
  const today = new Date()
  const dow = today.getDay()
  const thisMonday = new Date(today)
  thisMonday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))

  const weeks = []
  for (let w = 0; w < n; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(thisMonday)
      date.setDate(thisMonday.getDate() - w * 7 + d)
      week.push(date)
    }
    weeks.push(week)
  }
  return weeks
}

function buildDayMap(sessions) {
  const map = {}
  for (const s of sessions) {
    const ds = toDateString(new Date(s.occurredAt || s.loggedAt))
    if (!map[ds]) map[ds] = []
    map[ds].push(s)
  }
  return map
}

function daySummary(daySessions) {
  if (!daySessions || daySessions.length === 0) return null
  const minutes = daySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
  const catCounts = {}
  for (const s of daySessions) catCounts[s.category] = (catCounts[s.category] || 0) + 1
  const dominant = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0][0]
  return { minutes, dominant, sessions: daySessions }
}

function minutesToOpacity(minutes) {
  return Math.min(1, 0.25 + (minutes / 120) * 0.75)
}

function monthLabel(week) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const firstDay = week[0]
  if (firstDay.getDate() <= 7) return months[firstDay.getMonth()]
  return null
}

export default function CalendarHeatmap({ sessions }) {
  const [tooltip, setTooltip] = useState(null) // { ds, minutes, dominant, sessions, weekIndex }
  const weeks = buildWeeks(26)
  const dayMap = buildDayMap(sessions)
  const todayStr = toDateString(new Date())

  function handleDayClick(ds, summary, wi) {
    if (tooltip?.ds === ds) {
      setTooltip(null)
    } else {
      setTooltip({ ds, ...summary, weekIndex: wi })
    }
  }

  return (
    <div className="w-full">
      {/* Legend — top */}
      <div className="flex gap-3 mb-3 flex-wrap">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            <span style={{ fontSize: 9, color: '#64748b' }} className="capitalize">{cat}</span>
          </div>
        ))}
      </div>

      {/* Day-of-week header */}
      <div className="flex items-center gap-1 mb-1">
        <div className="w-6 shrink-0" />
        <div className="grid grid-cols-7 gap-1 flex-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="text-center text-slate-500" style={{ fontSize: 9 }}>{label}</div>
          ))}
        </div>
      </div>

      {/* Weeks as rows */}
      <div className="flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <React.Fragment key={wi}>
            <div className="flex items-center gap-1">
              <div className="w-6 shrink-0 text-right" style={{ fontSize: 8, color: '#475569' }}>
                {monthLabel(week) ?? ''}
              </div>
              <div className="grid grid-cols-7 gap-1 flex-1">
                {week.map((date, di) => {
                  const ds = toDateString(date)
                  const summary = daySummary(dayMap[ds])
                  const isToday = ds === todayStr
                  const isFuture = ds > todayStr
                  const isSelected = tooltip?.ds === ds

                  if (summary) {
                    return (
                      <div
                        key={di}
                        className={`rounded-sm cursor-pointer aspect-square transition-all ${isToday ? 'ring-1 ring-white' : ''} ${isSelected ? 'ring-2 ring-white' : ''}`}
                        style={{
                          backgroundColor: CATEGORY_COLORS[summary.dominant],
                          opacity: minutesToOpacity(summary.minutes),
                        }}
                        onClick={() => handleDayClick(ds, summary, wi)}
                      />
                    )
                  }
                  return (
                    <div
                      key={di}
                      className={`rounded-sm aspect-square bg-slate-800 ${isToday ? 'ring-1 ring-slate-500' : ''} ${isFuture ? 'opacity-10' : 'opacity-40'}`}
                    />
                  )
                })}
              </div>
            </div>

            {/* Inline detail — appears right below the tapped week */}
            {tooltip?.weekIndex === wi && (
              <div className="ml-7 p-2.5 rounded-lg bg-slate-700/60 border border-slate-600 text-xs fade-in">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-semibold text-white">{tooltip.ds}</p>
                  <p className="text-slate-400">{tooltip.minutes} min total</p>
                </div>
                {tooltip.sessions.map((s, i) => {
                  const cfg = FITNESS_CONFIG[s.category]
                  const icon = (s.subtype && cfg?.subtypeIcons?.[s.subtype]) ?? cfg?.icon
                  return (
                    <div key={i} className="flex items-center gap-2 text-slate-300 mb-0.5">
                      <span>{icon}</span>
                      <span className="capitalize">{s.subtype || s.category}</span>
                      <span className="text-slate-500 ml-auto">{s.durationMinutes}m</span>
                    </div>
                  )
                })}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

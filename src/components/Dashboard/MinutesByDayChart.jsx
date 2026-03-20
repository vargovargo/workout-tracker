import React, { useState } from 'react'
import { FITNESS_CONFIG } from '../../config.js'
import { toDateString } from '../../utils/weekUtils.js'

const CATEGORY_KEYS = Object.keys(FITNESS_CONFIG)

// SVG layout constants
const W = 300
const H = 150
const TOP_PAD = 18   // room for value labels above bars
const BAR_H = 82     // total height available for bars
const AXIS_Y = TOP_PAD + BAR_H  // y=100
const N = 7
const COL_W = W / N  // ~42.9 px per column
const BAR_W = 24

export default function MinutesByDayChart({ sessions, onEdit }) {
  const todayStr = toDateString(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 6 + i)  // day[0] = 6 days ago, day[6] = today
    const dateStr = toDateString(d)

    const daySessions = sessions.filter(
      (s) => toDateString(new Date(s.occurredAt || s.loggedAt)) === dateStr
    )

    const mins = {}
    for (const key of CATEGORY_KEYS) {
      mins[key] = daySessions
        .filter((s) => s.category === key)
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
    }

    return {
      i,
      dateStr,
      dayNum: d.getDate(),
      label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      isToday: dateStr === todayStr,
      mins,
      total: Object.values(mins).reduce((a, b) => a + b, 0),
      sessions: daySessions,
    }
  })

  const maxTotal = Math.max(...days.map((d) => d.total), 30)

  const selDay = days.find((d) => d.dateStr === selectedDate) || null

  return (
    <div className="mx-4 mt-3 p-4 rounded-xl bg-slate-800 border border-slate-700">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
        Last 7 Days
      </p>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        {CATEGORY_KEYS.map((key) => (
          <span key={key} className="flex items-center gap-1 text-xs text-slate-400">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: FITNESS_CONFIG[key].arcColor }}
            />
            {FITNESS_CONFIG[key].label}
          </span>
        ))}
      </div>

      <div className="flex gap-3 items-start">

        {/* Chart — compresses when a day is selected */}
        <div
          className={`transition-all duration-300 ${selectedDate ? 'w-[55%]' : 'w-full'}`}
          style={{ minWidth: 0 }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
            {/* Today column highlight */}
            {days.map(({ i, isToday }) =>
              isToday ? (
                <rect
                  key={`hl-${i}`}
                  x={i * COL_W + 2}
                  y={TOP_PAD - 8}
                  width={COL_W - 4}
                  height={BAR_H + 8}
                  rx={5}
                  fill="rgba(59,130,246,0.10)"
                />
              ) : null
            )}

            {/* Selected column highlight */}
            {days.map(({ i, dateStr: ds, isToday }) =>
              ds === selectedDate && !isToday ? (
                <rect
                  key={`sel-${i}`}
                  x={i * COL_W + 2}
                  y={TOP_PAD - 8}
                  width={COL_W - 4}
                  height={BAR_H + 8}
                  rx={5}
                  fill="rgba(148,163,184,0.08)"
                  stroke="rgba(148,163,184,0.3)"
                  strokeWidth={1}
                />
              ) : null
            )}

            {/* Axis line */}
            <line x1={0} y1={AXIS_Y} x2={W} y2={AXIS_Y} stroke="#334155" strokeWidth={1} />

            {/* Stacked bars + value labels */}
            {days.map(({ i, dateStr: ds, mins, total, isToday }) => {
              const cx = i * COL_W + COL_W / 2
              const bx = cx - BAR_W / 2

              let yAcc = AXIS_Y
              const segments = []

              for (const key of CATEGORY_KEYS) {
                const m = mins[key]
                if (m === 0) continue
                const segH = (m / maxTotal) * BAR_H
                const segY = yAcc - segH
                segments.push({ key, bx, segY, segH, color: FITNESS_CONFIG[key].arcColor })
                yAcc = segY
              }

              const topY = total > 0 ? AXIS_Y - (total / maxTotal) * BAR_H : AXIS_Y

              return (
                <g
                  key={i}
                  onClick={() => total > 0 && setSelectedDate((prev) => prev === ds ? null : ds)}
                  style={{ cursor: total > 0 ? 'pointer' : 'default' }}
                >
                  {/* Full-column transparent hit area */}
                  <rect
                    x={i * COL_W}
                    y={TOP_PAD - 8}
                    width={COL_W}
                    height={BAR_H + 8}
                    fill="transparent"
                  />
                  {segments.map(({ key, bx, segY, segH, color }, si) => (
                    <rect
                      key={key}
                      x={bx}
                      y={segY}
                      width={BAR_W}
                      height={segH + (si < segments.length - 1 ? 1 : 0)}
                      rx={si === segments.length - 1 ? 3 : 0}
                      fill={color}
                      opacity={0.9}
                    />
                  ))}
                  {total > 0 && (
                    <text
                      x={cx}
                      y={topY - 3}
                      textAnchor="middle"
                      fontSize={9}
                      fill={isToday ? '#93c5fd' : '#64748b'}
                      fontWeight="600"
                    >
                      {total}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Day letter labels */}
            {days.map(({ i, label, isToday }) => (
              <text
                key={`dl-${i}`}
                x={i * COL_W + COL_W / 2}
                y={AXIS_Y + 14}
                textAnchor="middle"
                fontSize={11}
                fontWeight={isToday ? '700' : '500'}
                fill={isToday ? '#60a5fa' : '#64748b'}
              >
                {label}
              </text>
            ))}

            {/* Date number labels */}
            {days.map(({ i, dayNum, isToday }) => (
              <text
                key={`dd-${i}`}
                x={i * COL_W + COL_W / 2}
                y={AXIS_Y + 27}
                textAnchor="middle"
                fontSize={9}
                fill={isToday ? '#93c5fd' : '#475569'}
              >
                {dayNum}
              </text>
            ))}
          </svg>
        </div>

        {/* Detail panel — slides in when a day is selected */}
        {selDay && (
          <div className="flex-1 min-w-0 pt-1 slide-up">
            <p className="text-xs font-semibold text-slate-400 mb-2">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </p>
            <div className="space-y-2">
              {selDay.sessions.map((s) => {
                const cfg = FITNESS_CONFIG[s.category]
                const icon = (s.subtype && cfg.subtypeIcons?.[s.subtype]) ?? cfg.icon
                return (
                  <div
                    key={s.id}
                    className={`flex flex-col ${onEdit ? 'cursor-pointer active:opacity-60' : ''}`}
                    onClick={() => onEdit && onEdit(s)}
                  >
                    <span className={`text-xs font-medium ${cfg.accentClass}`}>
                      {(s.subtype && cfg.subtypeIcons?.[s.subtype]) || cfg.icon} {s.subtype || cfg.label}
                      {icon} {s.subtype || cfg.label}
                    </span>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {s.durationMinutes} min
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

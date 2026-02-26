import React from 'react'
import { WORKOUT_CONFIG } from '../../config.js'
import { weekKeyToMonday, toDateString } from '../../utils/weekUtils.js'

const CATEGORY_KEYS = Object.keys(WORKOUT_CONFIG)
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'Sa', 'Su']

// SVG layout constants
const W = 300
const H = 150
const TOP_PAD = 18   // room for value labels above bars
const BAR_H = 82     // total height available for bars
const AXIS_Y = TOP_PAD + BAR_H  // y=100
const BOT_H = 50     // room for day labels below axis
const N = 7
const COL_W = W / N  // ~42.9 px per column
const BAR_W = 24

export default function MinutesByDayChart({ weekKey, weekSessions }) {
  const monday = weekKeyToMonday(weekKey)
  const todayStr = toDateString(new Date())

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    const dateStr = toDateString(d)

    // Match sessions by their actual occurrence date (occurredAt preferred)
    const daySessions = weekSessions.filter((s) => {
      const sDate = toDateString(new Date(s.occurredAt || s.loggedAt))
      return sDate === dateStr
    })

    const mins = {}
    for (const key of CATEGORY_KEYS) {
      mins[key] = daySessions
        .filter((s) => s.category === key)
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
    }

    return {
      i,
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
      mins,
      total: Object.values(mins).reduce((a, b) => a + b, 0),
    }
  })

  const maxTotal = Math.max(...days.map((d) => d.total), 30)

  return (
    <div className="mx-4 mt-3 p-4 rounded-xl bg-slate-800 border border-slate-700">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
        Minutes by Day
      </p>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        {CATEGORY_KEYS.map((key) => (
          <span key={key} className="flex items-center gap-1 text-xs text-slate-400">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: WORKOUT_CONFIG[key].arcColor }}
            />
            {WORKOUT_CONFIG[key].label}
          </span>
        ))}
      </div>

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

        {/* Axis line */}
        <line x1={0} y1={AXIS_Y} x2={W} y2={AXIS_Y} stroke="#334155" strokeWidth={1} />

        {/* Stacked bars + value labels */}
        {days.map(({ i, mins, total, isToday, isFuture }) => {
          const cx = i * COL_W + COL_W / 2
          const bx = cx - BAR_W / 2

          let yAcc = AXIS_Y
          const segments = []
          let segCount = 0

          for (const key of CATEGORY_KEYS) {
            const m = mins[key]
            if (m === 0) continue
            const segH = (m / maxTotal) * BAR_H
            const segY = yAcc - segH
            // Round top corners only on the topmost (last) segment — we apply rx and
            // overlap by 1px between segments to avoid hairline gaps
            segments.push({ key, bx, segY, segH, color: WORKOUT_CONFIG[key].arcColor })
            yAcc = segY
            segCount++
          }

          const topY = total > 0 ? AXIS_Y - (total / maxTotal) * BAR_H : AXIS_Y

          return (
            <g key={i}>
              {segments.map(({ key, bx, segY, segH, color }, si) => (
                <rect
                  key={key}
                  x={bx}
                  y={segY}
                  width={BAR_W}
                  height={segH + (si < segments.length - 1 ? 1 : 0)}
                  rx={si === segments.length - 1 ? 3 : 0}
                  fill={color}
                  opacity={isFuture ? 0.3 : 0.9}
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
        {days.map(({ i, isToday }) => (
          <text
            key={`dl-${i}`}
            x={i * COL_W + COL_W / 2}
            y={AXIS_Y + 14}
            textAnchor="middle"
            fontSize={11}
            fontWeight={isToday ? '700' : '500'}
            fill={isToday ? '#60a5fa' : '#64748b'}
          >
            {DAY_LABELS[i]}
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
  )
}

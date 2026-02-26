import React, { useEffect, useRef } from 'react'
import { WORKOUT_CONFIG } from '../../config.js'
import { useApp } from '../../App.jsx'

const ARC_RADIUS = 36
const ARC_STROKE = 7
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS
// Arc spans 270° (from -135° to 135°)
const ARC_SPAN = (270 / 360) * ARC_CIRCUMFERENCE
const ARC_GAP = ARC_CIRCUMFERENCE - ARC_SPAN

export default function CategoryCard({ categoryKey, count }) {
  const cfg = WORKOUT_CONFIG[categoryKey]
  const { setTab } = useApp()
  const arcRef = useRef(null)

  const fraction = Math.min(count / cfg.weeklyTarget, 1)
  const done = count >= cfg.weeklyTarget

  const trackOffset = ARC_GAP / 2
  const fillLength = fraction * ARC_SPAN
  const fillOffset = ARC_CIRCUMFERENCE - fillLength - trackOffset

  // Color based on completion
  const arcColor = done ? '#34d399' : fraction > 0 ? cfg.arcColor : '#334155'

  useEffect(() => {
    const el = arcRef.current
    if (!el) return
    // Animate from 0 to fill
    el.style.setProperty('--arc-length', `${ARC_CIRCUMFERENCE - trackOffset}`)
    el.style.setProperty('--arc-remaining', `${fillOffset}`)
    el.style.strokeDashoffset = ARC_CIRCUMFERENCE - trackOffset
    // Force reflow
    void el.getBoundingClientRect()
    el.classList.add('arc-animated')
    return () => el.classList.remove('arc-animated')
  }, [count, fillOffset, trackOffset])

  return (
    <button
      onClick={() => setTab('log')}
      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border bg-slate-800 active:scale-95 transition-transform ${cfg.borderClass} ${done ? 'border-emerald-400/50' : ''}`}
      style={{ minHeight: 140 }}
    >
      {/* Arc SVG */}
      <svg width="96" height="96" viewBox="-4 -4 104 104" className="mb-1">
        {/* Track */}
        <circle
          cx="48" cy="48" r={ARC_RADIUS}
          fill="none"
          stroke="#1e293b"
          strokeWidth={ARC_STROKE}
          strokeDasharray={`${ARC_SPAN} ${ARC_GAP}`}
          strokeDashoffset={-trackOffset}
          strokeLinecap="round"
          transform="rotate(-225 48 48)"
        />
        {/* Fill */}
        <circle
          ref={arcRef}
          cx="48" cy="48" r={ARC_RADIUS}
          fill="none"
          stroke={arcColor}
          strokeWidth={ARC_STROKE}
          strokeDasharray={`${ARC_CIRCUMFERENCE}`}
          strokeDashoffset={ARC_CIRCUMFERENCE - trackOffset}
          strokeLinecap="round"
          transform="rotate(-225 48 48)"
          style={{ transition: 'stroke 0.3s' }}
        />
        {/* Icon + count in center */}
        <text x="48" y="42" textAnchor="middle" fontSize="22" dy="0.35em">{cfg.icon}</text>
        <text
          x="48" y="62"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill={done ? '#34d399' : '#e2e8f0'}
          dy="0.35em"
        >
          {count}/{cfg.weeklyTarget}
        </text>
      </svg>

      <span className={`text-sm font-semibold mt-0.5 ${done ? 'text-emerald-400' : 'text-slate-200'}`}>
        {cfg.label}
      </span>

      {done && (
        <span className="absolute top-2.5 right-2.5 text-emerald-400 text-base">✓</span>
      )}
    </button>
  )
}

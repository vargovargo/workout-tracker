import React, { useEffect, useRef } from 'react'
import { WORKOUT_CONFIG } from '../../config.js'
import { getCategoryProgress } from '../../utils/progressUtils.js'
import { useApp } from '../../App.jsx'

const R = 24
const STROKE = 6
const SIZE = 56
const CIRC = 2 * Math.PI * R
const SPAN = (270 / 360) * CIRC
const GAP = CIRC - SPAN

function Ring({ categoryKey, value, target, unit }) {
  const cfg = WORKOUT_CONFIG[categoryKey]
  const { setTab } = useApp()
  const arcRef = useRef(null)

  const fraction = target > 0 ? Math.min(value / target, 1) : 0
  const done = value >= target && target > 0

  const trackOffset = GAP / 2
  const fillLength = fraction * SPAN
  const fillOffset = CIRC - fillLength - trackOffset
  const arcColor = fraction > 0 ? cfg.arcColor : '#334155'

  useEffect(() => {
    const el = arcRef.current
    if (!el) return
    el.style.setProperty('--arc-length', `${CIRC - trackOffset}`)
    el.style.setProperty('--arc-remaining', `${fillOffset}`)
    el.style.strokeDashoffset = CIRC - trackOffset
    void el.getBoundingClientRect()
    el.classList.add('arc-animated')
    return () => el.classList.remove('arc-animated')
  }, [value, fillOffset, trackOffset])

  const displayValue = unit === 'minutes' ? `${value}m` : `${value}/${target}`

  return (
    <button
      onClick={() => setTab('log')}
      className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
    >
      <svg width={SIZE} height={SIZE} viewBox="-4 -4 60 60">
        {/* Track */}
        <circle
          cx="26" cy="26" r={R}
          fill="none" stroke="#1e293b" strokeWidth={STROKE}
          strokeDasharray={`${SPAN} ${GAP}`}
          strokeDashoffset={-trackOffset} strokeLinecap="round"
          transform="rotate(-225 26 26)"
        />
        {/* Fill */}
        <circle
          ref={arcRef}
          cx="26" cy="26" r={R}
          fill="none" stroke={arcColor} strokeWidth={STROKE}
          strokeDasharray={`${CIRC}`}
          strokeDashoffset={CIRC - trackOffset}
          strokeLinecap="round" transform="rotate(-225 26 26)"
          style={{ transition: 'stroke 0.3s' }}
        />
        <text x="26" y="23" textAnchor="middle" fontSize="14" dy="0.35em">{cfg.icon}</text>
        <text
          x="26" y="36" textAnchor="middle"
          fontSize="7.5" fontWeight="700"
          fill={done ? '#34d399' : '#94a3b8'}
          dy="0.35em"
        >{displayValue}</text>
      </svg>
      <span className={`text-xs font-medium leading-tight text-center ${done ? 'text-emerald-400' : 'text-slate-400'}`}>
        {cfg.label}
      </span>
    </button>
  )
}

export default function WeeklyRings({ weekSessions }) {
  const { settings } = useApp()

  return (
    <div className="mx-4 mt-3 p-4 rounded-xl bg-slate-800 border border-slate-700">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        This week
      </p>
      <div className="flex justify-between items-start">
        {Object.keys(WORKOUT_CONFIG).map((key) => {
          const { value, target, unit } = getCategoryProgress(weekSessions, key, settings)
          return <Ring key={key} categoryKey={key} value={value} target={target} unit={unit} />
        })}
      </div>
    </div>
  )
}

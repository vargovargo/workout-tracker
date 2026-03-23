import React, { useState, useMemo } from 'react'
import { useApp } from '../../App.jsx'
import { FITNESS_CONFIG } from '../../config.js'

const WINDOWS = [7, 14, 28]

function computeBreakdown(sessions, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const buckets = {}

  for (const s of sessions) {
    const t = new Date(s.occurredAt || s.loggedAt).getTime()
    if (t < cutoff) continue

    const subtype = s.subtype || null
    const key = `${s.category}::${subtype ?? '_unknown'}`

    if (!buckets[key]) {
      buckets[key] = { category: s.category, subtype, count: 0 }
    }
    buckets[key].count++
  }

  const categoryOrder = Object.keys(FITNESS_CONFIG)
  const grouped = {}

  for (const entry of Object.values(buckets)) {
    if (!grouped[entry.category]) grouped[entry.category] = []
    grouped[entry.category].push(entry)
  }

  return categoryOrder
    .filter((cat) => grouped[cat]?.length > 0)
    .map((cat) => ({
      category: cat,
      subtypes: (grouped[cat] || []).sort((a, b) => b.count - a.count),
    }))
}

function SubtypeRow({ category, subtype, count, maxCount }) {
  const cfg = FITNESS_CONFIG[category]
  const icon = (subtype && cfg?.subtypeIcons?.[subtype]) ?? cfg?.icon
  const displayName = subtype ?? cfg?.label
  const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-base w-6 text-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-300 mb-1.5 capitalize">{displayName}</p>
        <div className="relative h-2 rounded-full bg-slate-700/60 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{ width: `${barPct}%`, backgroundColor: cfg?.arcColor }}
          />
        </div>
      </div>
      <span className="text-sm font-semibold text-slate-200 w-7 text-right shrink-0">
        {count}×
      </span>
    </div>
  )
}

function CategoryBlock({ category, subtypes }) {
  const cfg = FITNESS_CONFIG[category]
  const maxCount = subtypes[0]?.count ?? 0
  const total = subtypes.reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: cfg?.arcColor }}>
          {cfg?.icon} {cfg?.label}
        </span>
        <span className="text-xs text-slate-500">{total} session{total !== 1 ? 's' : ''}</span>
      </div>
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 px-4 py-1">
        {subtypes.map(({ subtype, count }) => (
          <SubtypeRow
            key={subtype ?? '_unknown'}
            category={category}
            subtype={subtype}
            count={count}
            maxCount={maxCount}
          />
        ))}
      </div>
    </div>
  )
}

export default function ActivitiesView() {
  const { sessions } = useApp()
  const [days, setDays] = useState(28)

  const breakdown = useMemo(() => computeBreakdown(sessions, days), [sessions, days])

  return (
    <div className="pb-6 slide-up">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Activities</h2>
        <div className="flex gap-1.5">
          {WINDOWS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                days === d
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 active:bg-slate-700'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        {breakdown.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏋️</p>
            <p className="text-slate-400 text-sm">No activity in the last {days} days.</p>
          </div>
        ) : (
          breakdown.map(({ category, subtypes }) => (
            <CategoryBlock key={category} category={category} subtypes={subtypes} />
          ))
        )}
      </div>
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import { useApp } from '../../App.jsx'
import { FITNESS_CONFIG, SECONDARY_ATTRIBUTES, ACTIVITY_SECONDARY_SCORES } from '../../config.js'

const WINDOWS = [7, 14, 28]

// ─── Data helpers ─────────────────────────────────────────────────────────────

function getSubtypeKey(category, subtype) {
  return `${category}::${subtype ?? '_unknown'}`
}

function getActivityMeta(category, subtype) {
  const cfg = FITNESS_CONFIG[category]
  return {
    cfg,
    icon: (subtype && cfg?.subtypeIcons?.[subtype]) ?? cfg?.icon,
    displayName: subtype ?? cfg?.label,
  }
}

function getSecondaryScores(category, subtype) {
  const catScores = ACTIVITY_SECONDARY_SCORES[category]
  if (!catScores) return { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 0 }
  return catScores[subtype] || catScores._default
}

function computePrimaryBreakdown(sessions, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const buckets = {}

  for (const s of sessions) {
    const t = new Date(s.occurredAt || s.loggedAt).getTime()
    if (t < cutoff) continue
    const key = getSubtypeKey(s.category, s.subtype)
    if (!buckets[key]) buckets[key] = { category: s.category, subtype: s.subtype || null, count: 0 }
    buckets[key].count++
  }

  const grouped = {}
  for (const entry of Object.values(buckets)) {
    if (!grouped[entry.category]) grouped[entry.category] = []
    grouped[entry.category].push(entry)
  }

  return Object.keys(FITNESS_CONFIG)
    .filter((cat) => grouped[cat]?.length > 0)
    .map((cat) => ({
      category: cat,
      subtypes: (grouped[cat] || []).sort((a, b) => b.count - a.count),
    }))
}

function computeSecondaryBreakdown(sessions, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const seen = {}

  for (const s of sessions) {
    const t = new Date(s.occurredAt || s.loggedAt).getTime()
    if (t < cutoff) continue
    const key = getSubtypeKey(s.category, s.subtype)
    if (!seen[key]) seen[key] = { category: s.category, subtype: s.subtype || null, count: 0 }
    seen[key].count++
  }

  return Object.entries(SECONDARY_ATTRIBUTES).map(([attrKey, attr]) => {
    const activities = Object.values(seen)
      .map((entry) => ({
        ...entry,
        score: getSecondaryScores(entry.category, entry.subtype)[attrKey],
      }))
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score || b.count - a.count)

    return { attrKey, attr, activities }
  })
}

// ─── Score modal ──────────────────────────────────────────────────────────────

function ActivityScoreModal({ category, subtype, onClose }) {
  const { icon, displayName, cfg } = getActivityMeta(category, subtype)
  const scores = getSecondaryScores(category, subtype)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-800 rounded-t-2xl border border-slate-700 p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />

        {/* Activity header */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="text-white font-semibold capitalize">{displayName}</p>
            <p className="text-xs text-slate-400">{cfg?.icon} {cfg?.label}</p>
          </div>
        </div>

        {/* Secondary scores */}
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
          Secondary Attribute Scores
        </p>
        <div className="flex flex-col gap-3">
          {Object.entries(SECONDARY_ATTRIBUTES).map(([key, attr]) => {
            const score = scores[key]
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300">
                    {attr.icon} {attr.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{score} / 3</span>
                </div>
                <div className="relative h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{ width: `${(score / 3) * 100}%`, backgroundColor: attr.arcColor }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{attr.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Primary view ─────────────────────────────────────────────────────────────

function SubtypeRow({ category, subtype, count, maxCount, onInfo }) {
  const { cfg, icon, displayName } = getActivityMeta(category, subtype)
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
      <button
        onClick={() => onInfo(category, subtype)}
        className="w-6 h-6 flex items-center justify-center rounded-full text-slate-500 active:text-slate-300 transition-colors shrink-0"
        aria-label={`Scores for ${displayName}`}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="8.5" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12" y1="11" x2="12" y2="16" />
        </svg>
      </button>
    </div>
  )
}

function PrimaryView({ breakdown, onInfo }) {
  return (
    <>
      {breakdown.map(({ category, subtypes }) => {
        const cfg = FITNESS_CONFIG[category]
        const maxCount = subtypes[0]?.count ?? 0
        const total = subtypes.reduce((sum, s) => sum + s.count, 0)
        return (
          <div key={category} className="mb-4">
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
                  onInfo={onInfo}
                />
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}

// ─── Secondary view ───────────────────────────────────────────────────────────

function SecondaryActivityRow({ category, subtype, score, count, onInfo }) {
  const { icon, displayName } = getActivityMeta(category, subtype)
  const barPct = (score / 3) * 100

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-base w-6 text-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-slate-300 capitalize">{displayName}</p>
          <span className="text-xs text-slate-500">{count}×</span>
        </div>
        <div className="relative h-2 rounded-full bg-slate-700/60 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{ width: `${barPct}%`, backgroundColor: FITNESS_CONFIG[category]?.arcColor }}
          />
        </div>
      </div>
      {/* Score pips */}
      <div className="flex gap-0.5 shrink-0">
        {[1, 2, 3].map((pip) => (
          <div
            key={pip}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: pip <= score ? FITNESS_CONFIG[category]?.arcColor : '#334155' }}
          />
        ))}
      </div>
      <button
        onClick={() => onInfo(category, subtype)}
        className="w-6 h-6 flex items-center justify-center rounded-full text-slate-500 active:text-slate-300 transition-colors shrink-0"
        aria-label={`Scores for ${displayName}`}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="8.5" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12" y1="11" x2="12" y2="16" />
        </svg>
      </button>
    </div>
  )
}

function SecondaryView({ breakdown, onInfo }) {
  const hasAny = breakdown.some((b) => b.activities.length > 0)

  if (!hasAny) return null

  return (
    <>
      {breakdown.map(({ attrKey, attr, activities }) => {
        if (activities.length === 0) return null
        return (
          <div key={attrKey} className="mb-4">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: attr.arcColor }}>
                {attr.icon} {attr.label}
              </span>
            </div>
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 px-4 py-1">
              {activities.map(({ category, subtype, score, count }) => (
                <SecondaryActivityRow
                  key={getSubtypeKey(category, subtype)}
                  category={category}
                  subtype={subtype}
                  score={score}
                  count={count}
                  onInfo={onInfo}
                />
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ActivitiesView() {
  const { sessions, report, openAdvisor } = useApp()
  const [days, setDays] = useState(28)
  const [view, setView] = useState('primary')
  const [scoreModal, setScoreModal] = useState(null) // { category, subtype }

  const primaryBreakdown = useMemo(() => computePrimaryBreakdown(sessions, days), [sessions, days])
  const secondaryBreakdown = useMemo(() => computeSecondaryBreakdown(sessions, days), [sessions, days])

  const isEmpty = primaryBreakdown.length === 0

  function handleInfo(category, subtype) {
    setScoreModal({ category, subtype })
  }

  return (
    <div className="pb-6 slide-up">
      {/* Header row */}
      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Activities</h2>
        {report && (
          <button
            onClick={openAdvisor}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 active:opacity-70"
          >
            <span className="text-sm">🤖</span>
            <span className="text-xs font-medium text-slate-300">AI Rec</span>
          </button>
        )}
      </div>

      {/* Controls row */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div className="flex gap-1">
          {['primary', 'secondary'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors capitalize ${
                view === v
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 active:bg-slate-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
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
        {isEmpty ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏋️</p>
            <p className="text-slate-400 text-sm">No activity in the last {days} days.</p>
          </div>
        ) : view === 'primary' ? (
          <PrimaryView breakdown={primaryBreakdown} onInfo={handleInfo} />
        ) : (
          <SecondaryView breakdown={secondaryBreakdown} onInfo={handleInfo} />
        )}
      </div>

      {scoreModal && (
        <ActivityScoreModal
          category={scoreModal.category}
          subtype={scoreModal.subtype}
          onClose={() => setScoreModal(null)}
        />
      )}
    </div>
  )
}

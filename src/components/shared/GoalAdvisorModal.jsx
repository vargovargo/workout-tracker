import React from 'react'

const STATUS_STYLES = {
  low:      'text-red-400 bg-red-900/30 border-red-700/50',
  building: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
  good:     'text-green-400 bg-green-900/30 border-green-700/50',
  strong:   'text-cyan-400 bg-cyan-900/30 border-cyan-700/50',
}

const ATTR_ICONS = {
  aerobicBase: '🫀',
  peakOutput:  '⚡',
  structural:  '🏗️',
  restoration: '🌊',
}

const ATTR_LABELS = {
  aerobicBase: 'Aerobic Base',
  peakOutput:  'Peak Output',
  structural:  'Structural',
  restoration: 'Restoration',
}

function ToneBadge({ tone }) {
  const styles = {
    push:     'bg-green-900/50 text-green-300 border-green-700',
    recover:  'bg-red-900/50 text-red-300 border-red-700',
    maintain: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  }
  return (
    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${styles[tone] ?? styles.maintain}`}>
      {tone}
    </span>
  )
}

function AcwrBar({ acwr }) {
  if (acwr == null) return null
  const pct = Math.min(Math.max((acwr / 2) * 100, 0), 100)
  const { color, label, description } = acwr > 1.5
    ? { color: 'bg-red-500',    label: '⚠️ Pushing too hard',   description: "This week's load is much higher than your recent baseline — back off to reduce injury risk." }
    : acwr > 1.3
    ? { color: 'bg-yellow-500', label: '⚠️ Slightly elevated',  description: 'Training a bit harder than usual. Fine short-term, but watch for fatigue.' }
    : acwr < 0.8
    ? { color: 'bg-yellow-500', label: '↓ Undertraining',       description: "This week is well below your normal load. Good for recovery, but don't stay here too long." }
    : { color: 'bg-green-500',  label: '✅ Well-balanced',      description: "This week's load is right in line with your recent baseline." }
  return (
    <div className="bg-slate-800 rounded-xl p-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400 font-medium">Training load ratio <span className="text-white font-bold">{acwr.toFixed(2)}</span></span>
        <span className="font-semibold text-slate-300">{label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-700 mb-2">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>
  )
}

export default function GoalAdvisorModal({ report, onClose }) {
  if (!report) return null

  const {
    balanceAssessment = {},
    primaryGap,
    focusThisWeek = [],
    reasoning,
    secondaryAlerts = [],
    trajectoryNote,
    overallTone,
    analysis,
    generatedAt,
  } = report

  const date = generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center fade-in"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border-t border-slate-700 rounded-t-3xl slide-up overflow-y-auto"
        style={{ maxHeight: '88vh', paddingBottom: 'calc(var(--safe-bottom) + 1rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-slate-900 z-10">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        <div className="px-5 pt-2 pb-4">
          {/* Header */}
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Fitness Advisor</h2>
              {date && <p className="text-xs text-slate-500">Last run {date}</p>}
            </div>
            <button onClick={onClose} className="text-slate-400 text-sm font-medium">Done</button>
          </div>

          {/* Tone + primary gap */}
          <div className="flex items-center gap-2 mb-3">
            <ToneBadge tone={overallTone} />
          </div>

          {primaryGap && (
            <div className="mb-4 px-3 py-2.5 rounded-xl bg-yellow-900/20 border border-yellow-700/40">
              <p className="text-xs font-bold text-yellow-400 uppercase tracking-wide mb-1">Primary gap</p>
              <p className="text-xs text-yellow-200 leading-relaxed">{primaryGap}</p>
            </div>
          )}

          {/* ACWR */}
          {analysis?.acwr != null && (
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Training load</p>
              <AcwrBar acwr={analysis.acwr} />
            </div>
          )}

          {/* Balance assessment */}
          {Object.keys(balanceAssessment).length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Secondary balance</p>
              <div className="flex flex-col gap-2">
                {Object.entries(balanceAssessment).map(([attr, data]) => (
                  <div key={attr} className={`rounded-xl p-3 border ${STATUS_STYLES[data.status] ?? STATUS_STYLES.building}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">
                        {ATTR_ICONS[attr]} {ATTR_LABELS[attr] ?? attr}
                      </span>
                      <div className="flex items-center gap-2">
                        {data.weeklyAvg != null && (
                          <span className="text-xs opacity-70">{data.weeklyAvg.toFixed(1)} pts/wk</span>
                        )}
                        <span className="text-xs font-bold uppercase">{data.status}</span>
                      </div>
                    </div>
                    {data.gap && (
                      <p className="text-xs opacity-80 leading-relaxed">{data.gap}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Focus activities */}
          {focusThisWeek.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-2">Focus this week</h3>
              <ul className="flex flex-col gap-1.5">
                {focusThisWeek.map((item, i) => (
                  <li key={i} className="text-xs text-slate-300 flex gap-2">
                    <span className="text-slate-500 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reasoning */}
          {reasoning && (
            <div className="mb-4 px-3 py-2.5 rounded-xl bg-slate-800">
              <p className="text-xs text-slate-400 leading-relaxed">{reasoning}</p>
            </div>
          )}

          {/* Alerts */}
          {secondaryAlerts.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wide mb-2">Alerts</h3>
              <ul className="flex flex-col gap-1.5">
                {secondaryAlerts.map((alert, i) => (
                  <li key={i} className="text-xs text-yellow-300 flex gap-2">
                    <span className="shrink-0">⚠️</span>
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trajectory */}
          {trajectoryNote && (
            <div>
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-2">3-month trajectory</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{trajectoryNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

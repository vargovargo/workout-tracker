import React, { useState } from 'react'
import { FITNESS_CONFIG, SECONDARY_ATTRIBUTES, ACTIVITY_SECONDARY_SCORES } from '../../config.js'

function getSecondaryScores(category, subtype) {
  const catScores = ACTIVITY_SECONDARY_SCORES[category]
  if (!catScores) return { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 0 }
  return catScores[subtype] || catScores._default
}

function ScoreModal({ category, subtype, onClose }) {
  const cfg = FITNESS_CONFIG[category]
  const icon = (subtype && cfg?.subtypeIcons?.[subtype]) ?? cfg?.icon
  const displayName = subtype ?? cfg?.label
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
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="text-white font-semibold capitalize">{displayName}</p>
            <p className="text-xs text-slate-400">{cfg?.icon} {cfg?.label}</p>
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
          Secondary Attribute Scores
        </p>
        <div className="flex flex-col gap-3">
          {Object.entries(SECONDARY_ATTRIBUTES).map(([key, attr]) => {
            const score = scores[key]
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300">{attr.icon} {attr.label}</span>
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

export default function SessionCard({ session, onEdit, onDelete }) {
  const [showScores, setShowScores] = useState(false)
  const cfg = FITNESS_CONFIG[session.category]
  const icon = (session.subtype && cfg.subtypeIcons?.[session.subtype]) ?? cfg.icon

  // Prefer occurredAt (when workout happened) for primary display
  const displayDate = new Date(session.occurredAt || session.loggedAt)
  const dateStr = displayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = displayDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  // Show "logged on X" footnote when the recorded time differs from the log time
  const occurredDay = session.occurredAt && new Date(session.occurredAt).toDateString()
  const loggedDay = new Date(session.loggedAt).toDateString()
  const showLoggedNote = session.occurredAt && occurredDay !== loggedDay

  const subtypeLabel = session.subtype ? ` · ${session.subtype}` : ''

  return (
    <>
    <div className={`flex items-start gap-3 p-4 rounded-xl bg-slate-800 border ${cfg.borderClass}`}>
      <span className="text-2xl mt-0.5">{icon}</span>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${cfg.accentClass}`}>
          {cfg.label}{subtypeLabel}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {dateStr} · {timeStr} · {session.durationMinutes} min
        </p>
        {showLoggedNote && (
          <p className="text-xs text-slate-600 mt-0.5">
            logged {new Date(session.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}
        {session.notes && (
          <p className="text-xs text-slate-500 mt-1 truncate">{session.notes}</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowScores(true)}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 text-slate-400 active:text-slate-200 transition-colors"
          aria-label="Secondary attribute scores"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="8.5" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="12" y1="11" x2="12" y2="16" />
          </svg>
        </button>
        <button
          onClick={() => onEdit(session)}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 text-slate-300 text-sm active:scale-90 transition-transform"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(session.id)}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 text-slate-400 text-sm active:scale-90 transition-transform"
        >
          🗑️
        </button>
      </div>
    </div>

    {showScores && (
      <ScoreModal
        category={session.category}
        subtype={session.subtype}
        onClose={() => setShowScores(false)}
      />
    )}
    </>
  )
}

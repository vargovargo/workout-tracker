import React from 'react'
import { WORKOUT_CONFIG } from '../../config.js'

export default function SessionCard({ session, onEdit, onDelete }) {
  const cfg = WORKOUT_CONFIG[session.category]
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
  )
}

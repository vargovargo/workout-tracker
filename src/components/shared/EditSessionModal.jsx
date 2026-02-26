import React, { useState } from 'react'
import { WORKOUT_CONFIG } from '../../config.js'

export default function EditSessionModal({ session, onSave, onClose }) {
  const cfg = WORKOUT_CONFIG[session.category]
  const [duration, setDuration] = useState(String(session.durationMinutes))
  const [notes, setNotes] = useState(session.notes || '')

  function handleSave() {
    const mins = parseInt(duration, 10)
    if (!mins || mins < 1) return
    onSave({ durationMinutes: mins, notes: notes || undefined })
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center p-4 fade-in"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-slate-800 border border-slate-700 p-6 shadow-2xl slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">{cfg.icon}</span>
          <div>
            <p className={`text-base font-bold ${cfg.accentClass}`}>{cfg.label}</p>
            {session.subtype && (
              <p className="text-xs text-slate-400 capitalize">{session.subtype}</p>
            )}
          </div>
        </div>

        <label className="block mb-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">
            Duration (minutes)
          </span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-blue-500"
          />
        </label>

        <label className="block mb-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">
            Notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </label>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl border border-slate-600 text-slate-300 font-semibold active:scale-95 transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!duration || parseInt(duration, 10) < 1}
            className={`flex-1 py-3.5 rounded-2xl font-bold transition-all active:scale-95 ${
              duration && parseInt(duration, 10) >= 1
                ? 'bg-blue-500 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { WORKOUT_CONFIG } from '../../config.js'
import { useApp } from '../../App.jsx'

function toLocalDatetimeInput(date = new Date()) {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function SessionForm({ categoryKey, subtype, onBack, onSaved }) {
  const cfg = WORKOUT_CONFIG[categoryKey]
  const { logRetroactive } = useApp()

  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [occurredAt, setOccurredAt] = useState(() => toLocalDatetimeInput())
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const mins = parseInt(duration, 10)
    if (!mins || mins < 1) return
    setSaving(true)
    const occurredAtISO = occurredAt ? new Date(occurredAt).toISOString() : undefined
    const session = logRetroactive(categoryKey, subtype, mins, notes || undefined, occurredAtISO)
    onSaved(session)
  }

  const subtypeLabel = subtype ? ` · ${subtype}` : ''
  const title = `${cfg.icon} ${cfg.label}${subtypeLabel}`

  return (
    <div className="px-4 pt-6 pb-4 slide-up">
      <button onClick={onBack} className="flex items-center gap-1 text-slate-400 text-sm mb-5">
        <span>‹</span> Back
      </button>
      <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
      <p className="text-sm text-slate-400 mb-6">Enter workout details</p>

      {/* When did it happen */}
      <label className="block mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">
          When did you work out?
        </span>
        <input
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white text-base font-medium focus:outline-none focus:border-blue-500 [color-scheme:dark]"
        />
      </label>

      {/* Duration */}
      <label className="block mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">
          Duration (minutes) *
        </span>
        <input
          type="number"
          inputMode="numeric"
          min="1"
          max="600"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="e.g. 45"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white text-lg font-semibold placeholder-slate-600 focus:outline-none focus:border-blue-500"
        />
      </label>

      {/* Notes */}
      <label className="block mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">
          Notes (optional)
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it go?"
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
        />
      </label>

      <button
        onClick={handleSave}
        disabled={!duration || parseInt(duration, 10) < 1 || saving}
        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 ${
          duration && parseInt(duration, 10) >= 1
            ? `${cfg.bgClass} ${cfg.accentClass} border ${cfg.borderClass}`
            : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
        }`}
      >
        {saving ? 'Saving…' : 'Save Workout'}
      </button>
    </div>
  )
}

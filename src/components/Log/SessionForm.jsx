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
  const { activeSession, startSession, finishSession, logRetroactive, clearActiveSession } = useApp()

  const isRunning = activeSession?.category === categoryKey

  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [occurredAt, setOccurredAt] = useState(() => toLocalDatetimeInput())
  const [mode, setMode] = useState(isRunning ? 'finish' : 'choose') // 'choose' | 'finish' | 'retro'
  const [saving, setSaving] = useState(false)

  function handleStart() {
    startSession(categoryKey, subtype)
    setMode('finish')
  }

  async function handleFinish() {
    const mins = parseInt(duration, 10)
    if (!mins || mins < 1) return
    setSaving(true)
    const session = finishSession(mins, notes || undefined)
    onSaved(session)
  }

  async function handleRetro() {
    const mins = parseInt(duration, 10)
    if (!mins || mins < 1) return
    setSaving(true)
    const occurredAtISO = occurredAt ? new Date(occurredAt).toISOString() : undefined
    const session = logRetroactive(categoryKey, subtype, mins, notes || undefined, occurredAtISO)
    onSaved(session)
  }

  const subtypeLabel = subtype ? ` · ${subtype}` : ''
  const title = `${cfg.icon} ${cfg.label}${subtypeLabel}`

  if (mode === 'choose') {
    return (
      <div className="px-4 pt-6 pb-4 slide-up">
        <button onClick={onBack} className="flex items-center gap-1 text-slate-400 text-sm mb-5">
          <span>‹</span> Back
        </button>
        <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
        <p className="text-sm text-slate-400 mb-8">How do you want to log this?</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleStart}
            className={`flex items-center gap-4 p-5 rounded-2xl ${cfg.bgClass} border ${cfg.borderClass} active:scale-95 transition-transform`}
          >
            <span className="text-2xl">▶️</span>
            <div className="text-left">
              <p className={`text-base font-bold ${cfg.accentClass}`}>Start Now</p>
              <p className="text-xs text-slate-400 mt-0.5">Timer banner appears while you work out</p>
            </div>
          </button>

          <button
            onClick={() => setMode('retro')}
            className="flex items-center gap-4 p-5 rounded-2xl bg-slate-800 border border-slate-700 active:scale-95 transition-transform"
          >
            <span className="text-2xl">✍️</span>
            <div className="text-left">
              <p className="text-base font-bold text-slate-200">Log Completed</p>
              <p className="text-xs text-slate-400 mt-0.5">Already done? Enter time and duration</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  const isFinish = mode === 'finish'

  return (
    <div className="px-4 pt-6 pb-4 slide-up">
      <button
        onClick={() => {
          if (isFinish && isRunning) {
            onBack()
          } else {
            setMode('choose')
          }
        }}
        className="flex items-center gap-1 text-slate-400 text-sm mb-5"
      >
        <span>‹</span> Back
      </button>

      <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
      <p className="text-sm text-slate-400 mb-6">
        {isFinish ? 'Session in progress — enter duration to finish' : 'Enter workout details'}
      </p>

      {/* When did it happen — retro only */}
      {!isFinish && (
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
      )}

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

      {/* Action button */}
      <button
        onClick={isFinish ? handleFinish : handleRetro}
        disabled={!duration || parseInt(duration, 10) < 1 || saving}
        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 ${
          duration && parseInt(duration, 10) >= 1
            ? `${cfg.bgClass} ${cfg.accentClass} border ${cfg.borderClass}`
            : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
        }`}
      >
        {saving ? 'Saving…' : isFinish ? 'Finish & Save' : 'Save Workout'}
      </button>

      {isFinish && (
        <button
          onClick={() => {
            clearActiveSession()
            onBack()
          }}
          className="w-full mt-3 py-3 rounded-2xl text-sm text-slate-500 border border-slate-800 active:scale-95 transition-transform"
        >
          Cancel session
        </button>
      )}
    </div>
  )
}

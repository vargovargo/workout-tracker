import React, { useState, useEffect } from 'react'
import { WORKOUT_CONFIG } from '../../config.js'
import { useApp } from '../../App.jsx'

export default function ActiveSessionBanner() {
  const { activeSession, setTab } = useApp()
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    if (!activeSession) return
    const start = new Date(activeSession.startedAt)

    function update() {
      const secs = Math.floor((Date.now() - start) / 1000)
      const h = Math.floor(secs / 3600)
      const m = Math.floor((secs % 3600) / 60)
      const s = secs % 60
      if (h > 0) {
        setElapsed(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
      } else {
        setElapsed(`${m}:${String(s).padStart(2, '0')}`)
      }
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [activeSession])

  if (!activeSession) return null

  const cfg = WORKOUT_CONFIG[activeSession.category]
  const subtypeLabel = activeSession.subtype ? ` · ${activeSession.subtype}` : ''

  return (
    <button
      onClick={() => setTab('log')}
      className={`w-full flex items-center justify-between px-4 py-3 ${cfg.bgClass} border-b ${cfg.borderClass} active:brightness-110 transition-all`}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current ${cfg.accentClass}`} />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cfg.accentClass.replace('text-', 'bg-')}`} />
        </span>
        <span className={`text-sm font-bold ${cfg.accentClass}`}>
          {cfg.icon} {cfg.label}{subtypeLabel} — in progress
        </span>
      </div>
      <span className="text-sm font-mono text-slate-300">{elapsed}</span>
    </button>
  )
}

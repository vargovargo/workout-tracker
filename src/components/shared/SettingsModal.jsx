import React from 'react'
import { WORKOUT_CONFIG } from '../../config.js'
import { useApp } from '../../App.jsx'

export default function SettingsModal({ onClose }) {
  const { settings, updateSetting, currentUser } = useApp()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center fade-in"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border-t border-slate-700 rounded-t-3xl slide-up"
        style={{ paddingBottom: 'calc(var(--safe-bottom) + 1rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        <div className="px-5 pb-2 pt-2">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Goals</h2>
              <p className="text-xs text-slate-500">{currentUser}'s weekly targets</p>
            </div>
            <button onClick={onClose} className="text-slate-400 text-sm font-medium">Done</button>
          </div>

          <div className="flex flex-col gap-4">
            {Object.entries(WORKOUT_CONFIG).map(([key, cfg]) => {
              const s = settings[key] ?? { target: cfg.weeklyTarget, unit: 'sessions' }
              return (
                <div key={key} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cfg.icon}</span>
                    <span className="text-sm font-semibold text-white">{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-3 pl-7">
                    {/* Unit toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-slate-700">
                      {['sessions', 'minutes'].map((unit) => (
                        <button
                          key={unit}
                          onClick={() => updateSetting(key, 'unit', unit)}
                          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                            s.unit === unit
                              ? `${cfg.bgClass} ${cfg.accentClass}`
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {unit === 'sessions' ? '# sessions' : '⏱ minutes'}
                        </button>
                      ))}
                    </div>
                    {/* Target stepper */}
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => updateSetting(key, 'target', Math.max(0, s.target - 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 text-lg active:bg-slate-700"
                      >−</button>
                      {s.unit === 'minutes' ? (
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0"
                            value={s.target}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10)
                              if (!isNaN(v) && v >= 0) updateSetting(key, 'target', v)
                            }}
                            className="w-14 text-center text-sm font-bold text-white bg-slate-700 rounded-lg py-1 border border-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-xs text-slate-400 ml-1">m</span>
                        </div>
                      ) : (
                        <span className="w-12 text-center text-sm font-bold text-white">
                          {s.target}x
                        </span>
                      )}
                      <button
                        onClick={() => updateSetting(key, 'target', s.target + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 text-lg active:bg-slate-700"
                      >+</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

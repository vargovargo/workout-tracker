import React from 'react'
import { weekLabel, prevWeekKey, nextWeekKey, getWeekKey } from '../../utils/weekUtils.js'

export default function WeekNavigator({ weekKey, onWeekChange }) {
  const currentWeek = getWeekKey()
  const isCurrentWeek = weekKey === currentWeek

  return (
    <div className="flex items-center justify-between px-4 py-4">
      <button
        onClick={() => onWeekChange(prevWeekKey(weekKey))}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-300 active:scale-90 transition-transform"
      >
        ‹
      </button>

      <div className="text-center">
        <p className="text-sm font-semibold text-white">{weekLabel(weekKey)}</p>
        {isCurrentWeek && (
          <p className="text-xs text-blue-400 mt-0.5">This week</p>
        )}
      </div>

      <button
        onClick={() => onWeekChange(nextWeekKey(weekKey))}
        disabled={isCurrentWeek}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-transform ${
          isCurrentWeek
            ? 'bg-slate-800/40 text-slate-700 cursor-not-allowed'
            : 'bg-slate-800 text-slate-300 active:scale-90'
        }`}
      >
        ›
      </button>
    </div>
  )
}

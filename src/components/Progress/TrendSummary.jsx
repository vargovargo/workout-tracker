import React from 'react'
import { WORKOUT_CONFIG } from '../../config.js'
import { getCategoryProgress } from '../../utils/progressUtils.js'

// Returns trend direction for a category across two time windows
function computeTrend(sessions, category, settings, recentWeekKeys, priorWeekKeys) {
  function avg(keys) {
    if (!keys.length) return 0
    const total = keys.reduce((sum, wk) => {
      const wkSessions = sessions.filter((s) => s.weekKey === wk)
      const { value } = getCategoryProgress(wkSessions, category, settings)
      return sum + value
    }, 0)
    return total / keys.length
  }
  const recentAvg = avg(recentWeekKeys)
  const priorAvg = avg(priorWeekKeys)
  if (recentAvg > priorAvg * 1.1) return 'up'
  if (recentAvg < priorAvg * 0.9) return 'down'
  return 'stable'
}

function TrendArrow({ direction }) {
  if (direction === 'up')     return <span className="text-emerald-400 font-bold">↑</span>
  if (direction === 'down')   return <span className="text-amber-400 font-bold">↓</span>
  return <span className="text-slate-500">→</span>
}

export default function TrendSummary({ sessions, settings, weekKeys }) {
  const categories = Object.keys(WORKOUT_CONFIG)
  const recentWeeks = weekKeys.slice(0, 4)
  const priorWeeks = weekKeys.slice(4, 8)

  return (
    <div className="grid grid-cols-2 gap-2">
      {categories.map((cat) => {
        const cfg = WORKOUT_CONFIG[cat]
        const trend = computeTrend(sessions, cat, settings, recentWeeks, priorWeeks)

        // Achievement rate over all tracked weeks
        const target = settings?.[cat]?.target ?? cfg.weeklyTarget
        const hitsCount = weekKeys.filter((wk) => {
          const wkSessions = sessions.filter((s) => s.weekKey === wk)
          const { value } = getCategoryProgress(wkSessions, cat, settings)
          return value >= target
        }).length
        const rate = weekKeys.length > 0 ? Math.round((hitsCount / weekKeys.length) * 100) : 0
        const rateColor = rate >= 70 ? 'text-emerald-400' : rate >= 40 ? 'text-amber-400' : 'text-rose-400'

        return (
          <div key={cat} className={`flex items-center gap-2 p-2 rounded-lg ${cfg.bgClass} border ${cfg.borderClass}`}>
            <span className="text-lg">{cfg.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${cfg.accentClass}`}>{cfg.label}</p>
              <p className={`text-xs ${rateColor}`}>{rate}% goal hit rate</p>
            </div>
            <TrendArrow direction={trend} />
          </div>
        )
      })}
    </div>
  )
}

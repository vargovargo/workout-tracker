import { WORKOUT_CONFIG } from '../config.js'
import { toDateString } from './weekUtils.js'
import { getCategoryProgress } from './progressUtils.js'

export function getSuggestions(weekSessions, settings) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toDateString(yesterday)

  const yesterdayCats = new Set(
    weekSessions
      .filter((s) => {
        const d = s.occurredAt || s.loggedAt
        return d && toDateString(new Date(d)) === yesterdayStr
      })
      .map((s) => s.category)
  )

  const candidates = Object.entries(WORKOUT_CONFIG)
    .map(([key, cfg]) => {
      const { value, target, unit } = getCategoryProgress(weekSessions, key, settings)
      const remaining = Math.max(0, target - value)
      return { key, cfg, remaining, unit, ratio: remaining / target, doneYesterday: yesterdayCats.has(key) }
    })
    .filter((c) => c.remaining > 0)

  candidates.sort((a, b) => {
    if (a.doneYesterday !== b.doneYesterday) return a.doneYesterday ? 1 : -1
    return b.ratio - a.ratio
  })

  return candidates.slice(0, 2)
}

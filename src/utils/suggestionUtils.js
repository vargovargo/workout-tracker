import { WORKOUT_CONFIG } from '../config.js'
import { toDateString } from './weekUtils.js'

/**
 * Returns top 1–2 suggested workout categories for today.
 *
 * Logic:
 * 1. Compute remaining per category this week
 * 2. Filter categories where remaining > 0
 * 3. Deprioritize categories done yesterday
 * 4. Sort by (remaining / target) DESC
 * 5. Return top 2
 */
export function getSuggestions(weekSessions) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toDateString(yesterday)

  const yesterdayCats = new Set(
    weekSessions
      .filter((s) => s.loggedAt && toDateString(new Date(s.loggedAt)) === yesterdayStr)
      .map((s) => s.category)
  )

  const remaining = {}
  for (const [key, cfg] of Object.entries(WORKOUT_CONFIG)) {
    const done = weekSessions.filter((s) => s.category === key).length
    remaining[key] = Math.max(0, cfg.weeklyTarget - done)
  }

  const candidates = Object.entries(WORKOUT_CONFIG)
    .filter(([key]) => remaining[key] > 0)
    .map(([key, cfg]) => ({
      key,
      cfg,
      remaining: remaining[key],
      ratio: remaining[key] / cfg.weeklyTarget,
      doneYesterday: yesterdayCats.has(key),
    }))

  // Sort: not-yesterday first, then by ratio DESC
  candidates.sort((a, b) => {
    if (a.doneYesterday !== b.doneYesterday) return a.doneYesterday ? 1 : -1
    return b.ratio - a.ratio
  })

  return candidates.slice(0, 2)
}

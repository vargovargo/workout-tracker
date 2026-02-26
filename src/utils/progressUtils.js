import { WORKOUT_CONFIG } from '../config.js'

/**
 * Returns { value, target, unit } for a category given this week's sessions
 * and the user's settings. Falls back to config defaults if no settings saved.
 */
export function getCategoryProgress(weekSessions, categoryKey, settings) {
  const cfg = WORKOUT_CONFIG[categoryKey]
  if (!cfg) return { value: 0, target: 0, unit: 'sessions' }

  const catSettings = settings?.[categoryKey] ?? { target: cfg.weeklyTarget, unit: 'sessions' }
  const catSessions = weekSessions.filter((s) => s.category === categoryKey)

  if (catSettings.unit === 'minutes') {
    const value = catSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
    return { value, target: catSettings.target, unit: 'minutes' }
  }
  return { value: catSessions.length, target: catSettings.target, unit: 'sessions' }
}

/**
 * Returns true if all categories have met their targets for the week.
 */
export function isWeekComplete(weekSessions, settings) {
  return Object.keys(WORKOUT_CONFIG).every((key) => {
    const { value, target } = getCategoryProgress(weekSessions, key, settings)
    return value >= target
  })
}

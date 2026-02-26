import { useMemo, useEffect } from 'react'
import { WORKOUT_CONFIG } from '../config.js'
import { getWeekKey, prevWeekKey, toDateString } from '../utils/weekUtils.js'
import { isWeekComplete } from '../utils/progressUtils.js'

function loadStreakRecords(user) {
  try {
    return JSON.parse(localStorage.getItem(`${user}:streak_records`) || '{"longestWeekly":0,"longestActiveDay":0}')
  } catch {
    return { longestWeekly: 0, longestActiveDay: 0 }
  }
}

export function useStreak(sessions, user, settings) {
  const currentWeekKey = getWeekKey()

  const weeklyStreak = useMemo(() => {
    // Group sessions by weekKey, only past weeks
    const byWeek = {}
    for (const s of sessions) {
      if (s.weekKey < currentWeekKey) {
        if (!byWeek[s.weekKey]) byWeek[s.weekKey] = []
        byWeek[s.weekKey].push(s)
      }
    }

    // Walk backwards from most recent past week
    let streak = 0
    let wk = prevWeekKey(currentWeekKey)
    // Only go back as far as we have data (max 104 weeks = 2 years)
    for (let i = 0; i < 104; i++) {
      const weekSessions = byWeek[wk] || []
      if (!isWeekComplete(weekSessions, settings)) break
      streak++
      wk = prevWeekKey(wk)
    }
    return streak
  }, [sessions, currentWeekKey, settings])

  const activeDayStreak = useMemo(() => {
    // Use occurredAt (when workout happened) if set, otherwise loggedAt
    const uniqueDates = new Set(
      sessions.map((s) => toDateString(new Date(s.occurredAt || s.loggedAt)))
    )

    let streak = 0
    const today = new Date()
    // Start from today; if today has no workout, start from yesterday
    const startDate = uniqueDates.has(toDateString(today)) ? today : (() => {
      const y = new Date(today)
      y.setDate(y.getDate() - 1)
      return y
    })()

    const cur = new Date(startDate)
    for (let i = 0; i < 365; i++) {
      if (uniqueDates.has(toDateString(cur))) {
        streak++
        cur.setDate(cur.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }, [sessions])

  const currentWeekOnTrack = useMemo(() => {
    const weekSessions = sessions.filter((s) => s.weekKey === currentWeekKey)
    // "On track" = no category is more than 1 behind pace
    const today = new Date()
    const dayOfWeek = (today.getDay() + 6) % 7 // Mon=0..Sun=6
    const daysElapsed = dayOfWeek + 1 // 1..7
    const weekFraction = daysElapsed / 7

    return Object.entries(WORKOUT_CONFIG).every(([key, cfg]) => {
      const done = weekSessions.filter((s) => s.category === key).length
      const expectedSoFar = Math.floor(cfg.weeklyTarget * weekFraction)
      return done >= expectedSoFar - 1
    })
  }, [sessions, currentWeekKey])

  // Update longest records
  useEffect(() => {
    const records = loadStreakRecords(user)
    let updated = false
    if (weeklyStreak > records.longestWeekly) {
      records.longestWeekly = weeklyStreak
      updated = true
    }
    if (activeDayStreak > records.longestActiveDay) {
      records.longestActiveDay = activeDayStreak
      updated = true
    }
    if (updated) {
      localStorage.setItem(`${user}:streak_records`, JSON.stringify(records))
    }
  }, [user, weeklyStreak, activeDayStreak])

  return { weeklyStreak, activeDayStreak, currentWeekOnTrack }
}

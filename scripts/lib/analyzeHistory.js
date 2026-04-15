/**
 * analyzeHistory.js — computes completion rates, trends, ACWR, and secondary
 * attribute balance from a user's session array.
 */

const CATEGORIES = ['strength', 'cardio', 'mobility', 'mindfulness']

// Maps ISO week string "YYYY-WW" → array of sessions
function groupByWeek(sessions) {
  const map = {}
  for (const s of sessions) {
    const key = s.weekKey
    if (!map[key]) map[key] = []
    map[key].push(s)
  }
  return map
}

// Returns YYYY-WW for the week containing a Date (Monday-anchored)
function getWeekKey(date) {
  const d = new Date(date)
  const day = d.getUTCDay() // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day
  d.setUTCDate(d.getUTCDate() + diff)
  const year = d.getUTCFullYear()
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const week = Math.ceil(((d - jan4) / 86400000 + jan4.getUTCDay() + 6) / 7)
  return `${year}-${String(week).padStart(2, '0')}`
}

// Returns the N most recent completed week keys (not including current week)
function lastNWeekKeys(n) {
  const keys = []
  const now = new Date()
  // go back to start of last complete week
  let d = new Date(now)
  const dow = d.getUTCDay()
  // Monday-anchored: subtract days to get to last Monday, then back one full week
  const daysToLastMonday = (dow === 0 ? 6 : dow - 1) + 7
  d.setUTCDate(d.getUTCDate() - daysToLastMonday)
  for (let i = 0; i < n; i++) {
    keys.push(getWeekKey(d))
    d.setUTCDate(d.getUTCDate() - 7)
  }
  return keys
}

function categoryValue(sessions, category, settings) {
  const catSessions = sessions.filter((s) => s.category === category)
  const unit = settings?.[category]?.unit ?? 'sessions'
  if (unit === 'minutes') return catSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
  return catSessions.length
}

function categoryTarget(category, settings) {
  return settings?.[category]?.target ?? 3
}

// Secondary attribute scores from activity (inline to avoid ES module issues)
const SECONDARY_SCORES = {
  strength: {
    _default: { aerobicBase: 0, peakOutput: 2, structural: 1, restoration: 1 },
    climbing:  { aerobicBase: 1, peakOutput: 3, structural: 2, restoration: 0 },
    weights:   { aerobicBase: 0, peakOutput: 3, structural: 1, restoration: 1 },
    HIIT:      { aerobicBase: 1, peakOutput: 3, structural: 1, restoration: 0 },
    core:      { aerobicBase: 0, peakOutput: 2, structural: 3, restoration: 1 },
  },
  cardio: {
    _default:        { aerobicBase: 2, peakOutput: 2, structural: 0, restoration: 0 },
    run:             { aerobicBase: 3, peakOutput: 1, structural: 0, restoration: 0 },
    bike:            { aerobicBase: 3, peakOutput: 1, structural: 0, restoration: 0 },
    commute:         { aerobicBase: 1, peakOutput: 0, structural: 0, restoration: 1 },
    row:             { aerobicBase: 3, peakOutput: 2, structural: 1, restoration: 0 },
    swimming:        { aerobicBase: 3, peakOutput: 2, structural: 1, restoration: 1 },
    basketball:      { aerobicBase: 2, peakOutput: 2, structural: 1, restoration: 0 },
    soccer:          { aerobicBase: 2, peakOutput: 2, structural: 1, restoration: 0 },
    frisbee:         { aerobicBase: 1, peakOutput: 1, structural: 2, restoration: 0 },
    surfing:         { aerobicBase: 1, peakOutput: 2, structural: 3, restoration: 1 },
    'Orange Theory': { aerobicBase: 1, peakOutput: 3, structural: 0, restoration: 0 },
  },
  mobility: {
    _default:    { aerobicBase: 0, peakOutput: 0, structural: 2, restoration: 2 },
    plyometrics: { aerobicBase: 1, peakOutput: 3, structural: 2, restoration: 0 },
    yoga:        { aerobicBase: 0, peakOutput: 0, structural: 2, restoration: 3 },
    stretching:  { aerobicBase: 0, peakOutput: 0, structural: 1, restoration: 3 },
    balance:     { aerobicBase: 0, peakOutput: 0, structural: 3, restoration: 2 },
  },
  mindfulness: {
    _default:   { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 3 },
    meditation: { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 3 },
    breathing:  { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 3 },
    journaling: { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 2 },
    reading:    { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 2 },
    sauna:      { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 3 },
    'brain spa': { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 3 },
  },
}

function getSecondaryScores(session) {
  const cat = SECONDARY_SCORES[session.category]
  if (!cat) return { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 0 }
  return cat[session.subtype] || cat._default
}

function sumSecondary(sessions) {
  const totals = { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 0 }
  for (const s of sessions) {
    const sc = getSecondaryScores(s)
    for (const k of Object.keys(totals)) totals[k] += sc[k]
  }
  return totals
}

/**
 * Main analysis function.
 * @param {Array} sessions — all sessions for the user
 * @param {Object} settings — user's goal settings from Firestore
 * @param {number} weeksBack — how many completed weeks to analyze (default 8)
 * @returns {Object} analysis report
 */
export function analyzeHistory(sessions, settings, weeksBack = 8) {
  const weekKeys = lastNWeekKeys(weeksBack)
  const byWeek = groupByWeek(sessions)

  // Per-category stats over the analysis window
  const categoryStats = {}
  for (const cat of CATEGORIES) {
    const target = categoryTarget(cat, settings)
    const unit = settings?.[cat]?.unit ?? 'sessions'
    const weekValues = weekKeys.map((wk) => categoryValue(byWeek[wk] || [], cat, settings))
    const completions = weekValues.filter((v) => v >= target).length
    const completionRate = completions / weeksBack

    // Trend: compare last 3 weeks vs prior 3 weeks (higher half = improving)
    const recent = weekValues.slice(0, 3)
    const prior = weekValues.slice(3, 6)
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length
    let trend = '='
    if (recentAvg > priorAvg * 1.1) trend = '+'
    else if (recentAvg < priorAvg * 0.9) trend = '-'

    // Consecutive weeks hitting goal (from most recent)
    let streak = 0
    for (const v of weekValues) {
      if (v >= target) streak++
      else break
    }

    categoryStats[cat] = {
      target,
      unit,
      weeklyValues: weekValues,
      avgPerWeek: weekValues.reduce((a, b) => a + b, 0) / weeksBack,
      completionRate,
      completions,
      trend,
      streak,
    }
  }

  // Secondary attribute averages over the window
  const secondaryByWeek = weekKeys.map((wk) => sumSecondary(byWeek[wk] || []))
  const secondaryAvg = { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 0 }
  for (const week of secondaryByWeek) {
    for (const k of Object.keys(secondaryAvg)) secondaryAvg[k] += week[k]
  }
  for (const k of Object.keys(secondaryAvg)) secondaryAvg[k] = secondaryAvg[k] / weeksBack

  // ACWR: 7-day minutes / 28-day rolling avg minutes
  const now = Date.now()
  const day7ago = now - 7 * 24 * 60 * 60 * 1000
  const day28ago = now - 28 * 24 * 60 * 60 * 1000
  const acute = sessions
    .filter((s) => new Date(s.occurredAt || s.loggedAt).getTime() >= day7ago)
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
  const chronic28 = sessions
    .filter((s) => {
      const t = new Date(s.occurredAt || s.loggedAt).getTime()
      return t >= day28ago && t < day7ago
    })
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
  const chronicAvg = chronic28 / 3 // 3 previous weeks
  const acwr = chronicAvg > 0 ? acute / chronicAvg : null

  // Current week (partial)
  const currentWeekKey = getWeekKey(new Date())
  const currentWeekSessions = byWeek[currentWeekKey] || []
  const currentWeekProgress = {}
  for (const cat of CATEGORIES) {
    currentWeekProgress[cat] = {
      value: categoryValue(currentWeekSessions, cat, settings),
      target: categoryTarget(cat, settings),
      unit: settings?.[cat]?.unit ?? 'sessions',
    }
  }

  // Coros aggregate intensity — only computed when sessions have HR training effect data
  const corosSessions = sessions.filter((s) => s.corosMetrics?.aerobicTrainingEffect != null)
  const corosAggregate = corosSessions.length > 0 ? {
    sessionCount: corosSessions.length,
    avgATE:  corosSessions.reduce((sum, s) => sum + s.corosMetrics.aerobicTrainingEffect, 0) / corosSessions.length,
    avgANTE: corosSessions.reduce((sum, s) => sum + (s.corosMetrics.anaerobicTrainingEffect ?? 0), 0) / corosSessions.length,
  } : null

  return {
    weeksAnalyzed: weeksBack,
    weekKeys,
    categoryStats,
    secondaryAvg,
    acwr,
    acwrAcuteMinutes: acute,
    acwrChronicAvgMinutes: chronicAvg,
    currentWeekProgress,
    totalSessions: sessions.length,
    corosAggregate,
  }
}

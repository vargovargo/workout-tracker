import { FITNESS_CONFIG, ACTIVITY_SECONDARY_SCORES, sumSecondaryScores } from '../config.js'
import { toDateString } from './weekUtils.js'
import { getCategoryProgress } from './progressUtils.js'

// Secondary attribute thresholds per week (minimum to consider "covered")
const SECONDARY_WEEKLY_MIN = {
  aerobicBase: 4,
  peakOutput: 2,
  structural: 4,
  restoration: 2,
}

// Returns the best subtype to suggest for a category based on what secondary
// attributes are under-represented this week.
function pickSubtype(categoryKey, secondaryGaps, usedSubtypesToday) {
  const catScores = ACTIVITY_SECONDARY_SCORES[categoryKey]
  if (!catScores) return null

  const subtypes = Object.keys(catScores).filter((k) => k !== '_default')
  if (!subtypes.length) return null

  // Score each subtype by how well it fills the gaps, penalise if done today
  const scored = subtypes.map((subtype) => {
    const scores = catScores[subtype]
    let gapScore = 0
    for (const [attr, gap] of Object.entries(secondaryGaps)) {
      if (gap > 0) gapScore += scores[attr] * gap
    }
    const penalty = usedSubtypesToday.has(subtype) ? 0.5 : 1
    return { subtype, score: gapScore * penalty }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0].score > 0 ? scored[0].subtype : null
}

/**
 * Returns up to 2 activity suggestions with specific subtypes.
 *
 * @param {Array} weekSessions - sessions in the current ISO week
 * @param {Object} settings - user goal settings
 * @param {Array} [recentSessions] - recent sessions (last 7 days) for secondary balance check
 */
export function getSuggestions(weekSessions, settings, recentSessions) {
  const sessions = recentSessions || weekSessions

  // Activities done today and yesterday
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const todayStr = toDateString(today)
  const yesterdayStr = toDateString(yesterday)

  const yesterdayCats = new Set()
  const usedSubtypesToday = new Set()

  for (const s of sessions) {
    const d = s.occurredAt || s.loggedAt
    if (!d) continue
    const dateStr = toDateString(new Date(d))
    if (dateStr === yesterdayStr) yesterdayCats.add(s.category)
    if (dateStr === todayStr && s.subtype) usedSubtypesToday.add(s.subtype)
  }

  // Secondary attribute totals for the week and gaps vs minimums
  const weekSecondary = sumSecondaryScores(weekSessions)
  const secondaryGaps = {}
  for (const [attr, min] of Object.entries(SECONDARY_WEEKLY_MIN)) {
    secondaryGaps[attr] = Math.max(0, min - weekSecondary[attr])
  }

  // Recovery guard: if yesterday was high Peak Output, boost Restoration/Structural
  const yesterdaySessions = sessions.filter((s) => {
    const d = s.occurredAt || s.loggedAt
    return d && toDateString(new Date(d)) === yesterdayStr
  })
  const yesterdaySecondary = sumSecondaryScores(yesterdaySessions)
  const recoveryNeeded = yesterdaySecondary.peakOutput >= 2

  const candidates = Object.entries(FITNESS_CONFIG).map(([key, cfg]) => {
    const { value, target, unit } = getCategoryProgress(weekSessions, key, settings)
    const remaining = Math.max(0, target - value)
    const ratio = target > 0 ? remaining / target : 0

    // Boost ranking if this category addresses secondary gaps
    const catDefault = ACTIVITY_SECONDARY_SCORES[key]?._default || {}
    let secondaryBoost = 0
    for (const [attr, gap] of Object.entries(secondaryGaps)) {
      secondaryBoost += (catDefault[attr] || 0) * gap
    }

    // Recovery boost: if recovery needed, mobility and mindfulness get priority
    let recoveryBoost = 0
    if (recoveryNeeded && (key === 'mobility' || key === 'mindfulness')) {
      recoveryBoost = 2
    }

    const doneYesterday = yesterdayCats.has(key)

    return {
      key,
      cfg,
      remaining,
      unit,
      ratio,
      doneYesterday,
      secondaryBoost,
      recoveryBoost,
    }
  }).filter((c) => c.remaining > 0)

  // Sort: recovery boost > not done yesterday > secondary boost > remaining ratio
  candidates.sort((a, b) => {
    if (b.recoveryBoost !== a.recoveryBoost) return b.recoveryBoost - a.recoveryBoost
    if (a.doneYesterday !== b.doneYesterday) return a.doneYesterday ? 1 : -1
    if (b.secondaryBoost !== a.secondaryBoost) return b.secondaryBoost - a.secondaryBoost
    return b.ratio - a.ratio
  })

  const top = candidates.slice(0, 2)

  // Attach a recommended subtype to each suggestion
  return top.map((c) => ({
    ...c,
    suggestedSubtype: pickSubtype(c.key, secondaryGaps, usedSubtypesToday),
  }))
}

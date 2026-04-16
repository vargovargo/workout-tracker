/**
 * analyzeHeartRate.js — derives physiological insights from parsed Apple Health data.
 *
 * Computes:
 *   - Resting HR 7-day vs 28-day average + trend
 *   - HRV (SDNN) 7-day vs 28-day average + trend
 *   - Zone 2 and Zone 5 estimated minutes (last 7d, 4-week avg)
 *   - Per-category workout zone classification
 *
 * Uses Tanaka formula for age-based max HR: 208 − 0.7 × age
 */

// Estimated max HR per user (Tanaka formula: 208 - 0.7 * age)
// Ages as of 2026: Jason ~46, Lauren ~48, Benton ~14, Leo ~11
const USER_MAX_HR = {
  Jason:  176, // 208 - 0.7*46
  Lauren: 174, // 208 - 0.7*48
  Benton: 208, // 208 - 0.7*14 ≈ 198, but capped — adolescent formula less reliable; use 208
  Leo:    211, // children: use 220-age approximation: 220-11=209, round up
}

const SEVEN_DAYS_MS  = 7  * 24 * 60 * 60 * 1000
const TWENTY_EIGHT_DAYS_MS = 28 * 24 * 60 * 60 * 1000

/**
 * Average an array of numbers. Returns null if empty.
 */
function avg(arr) {
  if (!arr.length) return null
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

/**
 * Classify resting HR trend by comparing 7-day vs 28-day average.
 * declining = 7d is meaningfully lower → fitness improving
 * elevated   = 7d is meaningfully higher → fatigue/illness
 * stable     = within ±3%
 */
function classifyTrend(recent, baseline) {
  if (recent === null || baseline === null) return 'unknown'
  const ratio = recent / baseline
  if (ratio < 0.97) return 'declining'
  if (ratio > 1.03) return 'elevated'
  return 'stable'
}

/**
 * HRV trend is the inverse: improving = 7d higher than 28d baseline
 */
function classifyHRVTrend(recent, baseline) {
  if (recent === null || baseline === null) return 'unknown'
  const ratio = recent / baseline
  if (ratio > 1.03) return 'improving'
  if (ratio < 0.97) return 'declining'
  return 'stable'
}

/**
 * Classify a heart rate value into a zone given max HR.
 * Zone boundaries as % of maxHR:
 *   Z1: <60%   recovery
 *   Z2: 60–70% aerobic base / fat oxidation
 *   Z3: 70–80% aerobic threshold
 *   Z4: 80–90% lactate threshold
 *   Z5: 90%+   VO2 max / anaerobic
 */
function classifyZone(bpm, maxHR) {
  const pct = bpm / maxHR
  if (pct >= 0.90) return 'Z5'
  if (pct >= 0.80) return 'Z4'
  if (pct >= 0.70) return 'Z3'
  if (pct >= 0.60) return 'Z2'
  return 'Z1'
}

/**
 * Analyze parsed Apple Health data for a specific user.
 *
 * @param {{ heartRateSamples, restingHR, hrv, workouts }} healthData
 * @param {string} userId - One of Jason, Lauren, Benton, Leo
 * @returns {object} heartRateAnalysis
 */
export function analyzeHeartRate(healthData, userId) {
  const { restingHR, hrv, workouts, heartRateSamples } = healthData
  const maxHR = USER_MAX_HR[userId] ?? 180
  const now = Date.now()

  const z2Min = Math.round(maxHR * 0.60)
  const z2Max = Math.round(maxHR * 0.70)
  const z5Min = Math.round(maxHR * 0.90)

  // ── Resting HR ──────────────────────────────────────────────────────────────
  const rhr7d  = restingHR.filter(r => now - r.date.getTime() <= SEVEN_DAYS_MS).map(r => r.bpm)
  const rhr28d = restingHR.filter(r => now - r.date.getTime() <= TWENTY_EIGHT_DAYS_MS).map(r => r.bpm)
  const restingHR7d  = avg(rhr7d)
  const restingHR28d = avg(rhr28d)
  const restingHRTrend = classifyTrend(restingHR7d, restingHR28d)

  // ── HRV ─────────────────────────────────────────────────────────────────────
  const hrv7d_vals  = hrv.filter(r => now - r.date.getTime() <= SEVEN_DAYS_MS).map(r => r.ms)
  const hrv28d_vals = hrv.filter(r => now - r.date.getTime() <= TWENTY_EIGHT_DAYS_MS).map(r => r.ms)
  const hrv7d  = avg(hrv7d_vals)
  const hrv28d = avg(hrv28d_vals)
  const hrvTrend = classifyHRVTrend(hrv7d, hrv28d)

  // ── Zone time from workouts ──────────────────────────────────────────────────
  const workouts7d  = workouts.filter(w => now - w.start.getTime() <= SEVEN_DAYS_MS)
  const workouts28d = workouts.filter(w => now - w.start.getTime() <= TWENTY_EIGHT_DAYS_MS)

  function zoneMinutes(wkts) {
    let z2 = 0, z5 = 0
    for (const w of wkts) {
      if (w.avgHR === null || w.durationMin === null) continue
      const zone = classifyZone(w.avgHR, maxHR)
      if (zone === 'Z2') z2 += w.durationMin
      if (zone === 'Z4' || zone === 'Z5') z5 += w.durationMin
    }
    return { z2, z5 }
  }

  const { z2: zone2MinLast7d, z5: zone5MinLast7d } = zoneMinutes(workouts7d)

  // 4-week avg per week = total minutes in 28d / 4
  const { z2: zone2Min28d, z5: zone5Min28d } = zoneMinutes(workouts28d)
  const zone2MinAvg4wk = zone2Min28d / 4
  const zone5MinAvg4wk = zone5Min28d / 4

  // ── Per-category workout breakdown (last 7 days) ────────────────────────────
  const workoutsByCategory = {}
  for (const w of workouts7d) {
    if (!w.appCategory) continue
    if (!workoutsByCategory[w.appCategory]) workoutsByCategory[w.appCategory] = []
    workoutsByCategory[w.appCategory].push({
      subtype: w.appSubtype,
      durationMin: w.durationMin ? Math.round(w.durationMin) : null,
      avgHR: w.avgHR ? Math.round(w.avgHR) : null,
      zone: w.avgHR ? classifyZone(w.avgHR, maxHR) : null,
    })
  }

  return {
    maxHR,
    zones: { z2: [z2Min, z2Max], z5: [z5Min, maxHR] },
    restingHR7d:    restingHR7d   !== null ? Math.round(restingHR7d)   : null,
    restingHR28d:   restingHR28d  !== null ? Math.round(restingHR28d)  : null,
    restingHRTrend,
    hrv7d:  hrv7d  !== null ? Math.round(hrv7d)  : null,
    hrv28d: hrv28d !== null ? Math.round(hrv28d) : null,
    hrvTrend,
    zone2MinLast7d: Math.round(zone2MinLast7d),
    zone5MinLast7d: Math.round(zone5MinLast7d),
    zone2MinAvg4wk: Math.round(zone2MinAvg4wk),
    zone5MinAvg4wk: Math.round(zone5MinAvg4wk),
    workoutsByCategory,
    sampleCount: heartRateSamples.length,
  }
}

/**
 * buildPrompt.js — assembles the Claude prompt from analysis data, survey
 * responses, and the physio.md research document.
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PHYSIO_PATH = resolve(__dirname, '../../physio.md')

function percent(rate) {
  return `${Math.round(rate * 100)}%`
}

function trendArrow(trend) {
  if (trend === '+') return '↑ improving'
  if (trend === '-') return '↓ declining'
  return '→ stable'
}

function acwrStatus(acwr) {
  if (acwr === null) return 'insufficient data (< 4 weeks of history)'
  if (acwr > 1.5) return `${acwr.toFixed(2)} ⚠️  HIGH — injury risk zone`
  if (acwr > 1.3) return `${acwr.toFixed(2)} ⚠️  ELEVATED`
  if (acwr < 0.8) return `${acwr.toFixed(2)} ⚠️  LOW — detraining risk`
  return `${acwr.toFixed(2)} ✅ sweet spot (0.8–1.3)`
}

export function buildSystemPrompt(userId) {
  let physioContent = ''
  try {
    physioContent = readFileSync(PHYSIO_PATH, 'utf8')
  } catch {
    physioContent = 'physio.md not found — use general best-practice fitness guidelines.'
  }

  return `You are a knowledgeable, evidence-based fitness advisor. Your role is to suggest
attainable, progressive weekly workout goals for a specific user based on their actual
activity data, a weekly check-in survey, and the physiological research below.

Your recommendations must:
- Be grounded in the physio.md research and user profile
- Apply progressive overload conservatively (ACSM: ≤10% increase per metric per week)
- Prioritize recovery if survey signals fatigue or overreaching
- Never contradict the age-specific safety constraints in physio.md
- Suggest specific activity subtypes (e.g. "a steady run" not just "cardio")
- Be honest — if the data shows inconsistency, say so gently

Goal adjustments are driven by data and recovery state — not user preference.
Increase only when the data shows consistent completion AND energy is high.
Decrease when completion is low OR energy/recovery is stressed.

Respond ONLY with a valid JSON object — no markdown, no commentary outside the JSON.

---

${physioContent}`
}

export function buildUserPrompt(userId, analysis, survey, prevReport = null, heartRateAnalysis = null) {
  const { categoryStats, secondaryAvg, acwr, currentWeekProgress, weeksAnalyzed, corosAggregate } = analysis
  const window = weeksAnalyzed

  // Build category summary
  const catLines = Object.entries(categoryStats)
    .map(([cat, s]) => {
      const current = currentWeekProgress[cat]
      return `  ${cat}:
    Current goal: ${s.target} ${s.unit}/week
    This week so far: ${current.value}/${current.target} ${current.unit}
    ${window}-week completion rate: ${percent(s.completionRate)} (${s.completions}/${window} weeks)
    Trend: ${trendArrow(s.trend)}
    Consecutive weeks hitting goal: ${s.streak}`
    })
    .join('\n\n')

  // Secondary attribute averages
  const secLines = Object.entries(secondaryAvg)
    .map(([k, v]) => `  ${k}: ${v.toFixed(1)} pts/week avg`)
    .join('\n')

  // Survey interpretation hint
  const surveyHint = buildSurveyHint(survey)

  // Previous recommendation context
  let prevSection = ''
  if (prevReport) {
    const prevDate = prevReport.generatedAt
      ? new Date(prevReport.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'last session'
    const prevGoals = Object.entries(prevReport.suggestedGoals || {})
      .map(([cat, g]) => `  ${cat}: ${g.target} ${g.unit}/week${g.changed ? ' (was changed)' : ''}`)
      .join('\n')
    const prevFocus = (prevReport.focusThisWeek || []).map((f) => `  • ${f}`).join('\n')
    prevSection = `
=== LAST RECOMMENDATION (${prevDate}) ===
Overall tone: ${prevReport.overallTone ?? 'maintain'}
Goals suggested:
${prevGoals}
Focus activities:
${prevFocus}
Trajectory note: ${prevReport.trajectoryNote ?? 'none'}

NOTE: Consider whether the previous recommendations were followed and factor that into this week's suggestions.
`
  }

  // Coros aggregate section (only present when sessions have HR training effect data)
  let corosSection = ''
  if (corosAggregate) {
    const { sessionCount, avgATE, avgANTE } = corosAggregate
    const ateLabel = avgATE >= 3 ? 'solid aerobic base stimulus' : avgATE >= 2 ? 'moderate aerobic' : 'light aerobic'
    const anteLabel = avgANTE >= 2 ? 'meaningful high-intensity work' : avgANTE >= 1 ? 'some high-intensity' : 'minimal high-intensity'
    corosSection = `
=== COROS INTENSITY DATA (${sessionCount} sessions with HR data) ===
  Avg Aerobic Training Effect: ${avgATE.toFixed(1)}/5.0  [${ateLabel}]
  Avg Anaerobic Training Effect: ${avgANTE.toFixed(1)}/5.0  [${anteLabel}]
  NOTE: These are measured training effects from the Coros watch, not estimated from activity type.
  Use to validate secondary attribute balance — e.g. low avgATE despite high cardio session count
  means the cardio is too intense (not enough Zone 2 base work).
`
  }

  const hrSection = buildHeartRateSection(heartRateAnalysis)

  return `User: ${userId}
NOTE: This analysis covers ${window} week${window !== 1 ? 's' : ''} of data${window < 8 ? ` (app is new — do not penalize for short history; treat this as an early baseline)` : ''}.

=== CURRENT WEEK PROGRESS (partial) ===
${Object.entries(currentWeekProgress)
  .map(([c, p]) => `  ${c}: ${p.value}/${p.target} ${p.unit}`)
  .join('\n')}

=== ${window}-WEEK CATEGORY ANALYSIS ===
${catLines}

=== SECONDARY ATTRIBUTE AVERAGES (last ${window} weeks) ===
${secLines}

=== TRAINING LOAD (ACWR) ===
  7-day minutes: ${analysis.acwrAcuteMinutes}
  28-day avg/week: ${analysis.acwrChronicAvgMinutes.toFixed(0)}
  ACWR ratio: ${acwrStatus(acwr)}
${corosSection}${hrSection}${prevSection}
=== WEEKLY CHECK-IN ===
  Q1 Effort level (1–5): ${survey.effort}  [${survey.effort >= 4 ? '⚠️ HIGH' : survey.effort <= 2 ? '✅ EASY' : 'OK'}]
  Q2 Energy/recovery (1–5): ${survey.energy}  [${survey.energy <= 2 ? '⚠️ LOW' : survey.energy >= 4 ? '✅ GOOD' : 'OK'}]
  Q3 Injury/pain: ${survey.injury ?? 'none'}
  Q4 Reflection on past 1–2 weeks: ${survey.reflection ?? 'not provided'}
  Q5 Upcoming context: ${survey.context ?? 'nothing noted'}

${surveyHint}

=== REQUESTED OUTPUT FORMAT ===
Return a JSON object with this exact shape:
{
  "suggestedGoals": {
    "strength": { "target": <number>, "unit": "sessions"|"minutes", "changed": true|false },
    "cardio":   { "target": <number>, "unit": "sessions"|"minutes", "changed": true|false },
    "mobility": { "target": <number>, "unit": "sessions"|"minutes", "changed": true|false },
    "mindfulness": { "target": <number>, "unit": "sessions"|"minutes", "changed": true|false }
  },
  "reasoning": {
    "strength": "<1–2 sentences>",
    "cardio": "<1–2 sentences>",
    "mobility": "<1–2 sentences>",
    "mindfulness": "<1–2 sentences>"
  },
  "focusThisWeek": ["<specific activity 1>", "<specific activity 2>", "<specific activity 3>"],
  "secondaryAlerts": ["<alert if any secondary attribute needs attention>"],
  "trajectoryNote": "<where current trajectory puts this user in ~3 months>",
  "overallTone": "push"|"maintain"|"recover"
}`
}

function buildHeartRateSection(hr) {
  if (!hr) return ''

  const lines = ['\n=== APPLE WATCH HEART RATE DATA (last 7 days) ===']

  lines.push(`  Max HR estimate: ${hr.maxHR} bpm (age-based Tanaka formula)`)
  lines.push(`  Zone 2 (${hr.zones.z2[0]}–${hr.zones.z2[1]} bpm) time: ~${hr.zone2MinLast7d} min  → aerobic base work (4-wk avg: ${hr.zone2MinAvg4wk} min/wk)`)
  lines.push(`  Zone 5 (${hr.zones.z5[0]}+ bpm) time: ~${hr.zone5MinLast7d} min     → peak output / VO2 stimulus (4-wk avg: ${hr.zone5MinAvg4wk} min/wk)`)

  if (Object.keys(hr.workoutsByCategory).length) {
    lines.push('')
    for (const [cat, wkts] of Object.entries(hr.workoutsByCategory)) {
      const desc = wkts
        .map(w => [w.subtype, w.durationMin ? `${w.durationMin} min` : null, w.avgHR ? `avg ${w.avgHR} bpm (${w.zone})` : null]
          .filter(Boolean).join(' '))
        .join('; ')
      lines.push(`  ${cat} workouts: ${desc}`)
    }
  }

  lines.push('')
  if (hr.restingHR7d !== null) {
    const trend = hr.restingHRTrend === 'declining' ? '→ declining ✅ fitness improving'
                : hr.restingHRTrend === 'elevated'  ? '→ elevated ⚠️ fatigue or illness signal'
                : '→ stable'
    lines.push(`  Resting HR: ${hr.restingHR7d} bpm (7-day) vs ${hr.restingHR28d} bpm (28-day) ${trend}`)
  } else {
    lines.push('  Resting HR: no data in last 7 days')
  }

  if (hr.hrv7d !== null) {
    const trend = hr.hrvTrend === 'improving'  ? '→ improving ✅'
                : hr.hrvTrend === 'declining'  ? '→ declining ⚠️'
                : '→ stable'
    lines.push(`  HRV (SDNN): ${hr.hrv7d} ms (7-day) vs ${hr.hrv28d} ms (28-day) ${trend}`)
  } else {
    lines.push('  HRV (SDNN): no data in last 7 days')
  }

  if (hr.sampleCount > 0) {
    lines.push(`  (${hr.sampleCount} total HR samples parsed in last 30 days)`)
  }

  lines.push('')
  lines.push('NOTE: Resting HR and HRV are objective recovery signals. Elevated resting HR (+5% above')
  lines.push('baseline) or declining HRV overrides subjective survey comfort — flag conservative.')
  lines.push('Zone 2 time directly reflects aerobicBase stimulus; Zone 5 reflects peakOutput load.')

  return lines.join('\n') + '\n'
}

function buildSurveyHint(survey) {
  const lines = []

  if (survey.effort >= 4 || survey.energy <= 2) {
    lines.push('⚠️  ALGORITHM HINT: Recovery state is stressed. Do NOT increase any targets this week. Prioritize restoration.')
  } else if (survey.effort <= 2 && survey.energy >= 4) {
    lines.push('✅ ALGORITHM HINT: Training feels easy and energy is high. Eligible for up to one conservative goal increase if data supports it.')
  } else {
    lines.push('ℹ️  ALGORITHM HINT: Moderate state. Small adjustments OK; err conservative.')
  }

  if (survey.injury) {
    lines.push(`⚠️  INJURY NOTE: Avoid activities that stress the reported area: "${survey.injury}"`)
  }

  if (survey.reflection) {
    lines.push(`📝 REFLECTION: User reported — "${survey.reflection}" — use this as qualitative signal about what's working.`)
  }

  if (survey.context) {
    lines.push(`📅 UPCOMING: "${survey.context}" — factor this into the recommendation (e.g. travel may reduce availability; an upcoming race should shape training focus).`)
  }

  return lines.join('\n')
}

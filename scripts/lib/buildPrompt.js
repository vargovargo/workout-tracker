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

export function buildSystemPrompt() {
  let physioContent = ''
  try {
    physioContent = readFileSync(PHYSIO_PATH, 'utf8')
  } catch {
    physioContent = 'physio.md not found — use general best-practice fitness guidelines.'
  }

  return `You are a knowledgeable, evidence-based fitness advisor. Your role is to assess a user's
physiological balance across four secondary attributes (aerobicBase, peakOutput, structural,
restoration) and recommend specific activities to address gaps — not to set weekly goal targets.

Your recommendations must:
- Be grounded in the physio.md research and the user's actual activity history
- Identify the most meaningful gap in secondary attribute balance
- Suggest 3 specific activities (with subtype, duration, intensity guidance) to address that gap
- Apply progressive overload conservatively (ACSM: ≤10% per week)
- Prioritize recovery when sleep or body-feel signals stress
- Never reference goal targets — the user does not track against weekly targets
- Be honest — if the data shows avoidance of a category or subtype, name it directly

For optimalWeeklySecondary: derive targets from the user's actual training load, history, and
physio.md principles. Do not use profile labels. Estimate what a balanced week at their current
volume should produce in secondary attribute points, then set targets accordingly.

Respond ONLY with a valid JSON object. No markdown code fences, no prose before or after — raw JSON only.

---

${physioContent}`
}

export function buildUserPrompt(userId, analysis, survey, prevReport = null) {
  const { categoryStats, secondaryAvg, subtypeBreakdown, acwr, currentWeekProgress, weeksAnalyzed, corosAggregate } = analysis
  const window = weeksAnalyzed

  // Category + subtype breakdown
  const catLines = Object.entries(categoryStats)
    .map(([cat, s]) => {
      const subtypes = subtypeBreakdown[cat] || {}
      const subtypeStr = Object.keys(subtypes).length > 0
        ? Object.entries(subtypes)
            .sort((a, b) => b[1] - a[1])
            .map(([sub, n]) => `${sub}×${n}`)
            .join(', ')
        : 'none'
      return `  ${cat}:
    ${window}-week sessions: ${Object.values(subtypes).reduce((a, b) => a + b, 0)} total  [${subtypeStr}]
    Completion vs target: ${percent(s.completionRate)} (${s.completions}/${window} weeks hitting goal)
    Trend: ${trendArrow(s.trend)}  |  streak: ${s.streak} weeks`
    })
    .join('\n\n')

  // Secondary attribute averages
  const secLines = Object.entries(secondaryAvg)
    .map(([k, v]) => `  ${k}: ${v.toFixed(1)} pts/week avg`)
    .join('\n')

  // Previous recommendation context
  let prevSection = ''
  if (prevReport) {
    const prevDate = prevReport.generatedAt
      ? new Date(prevReport.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'last session'
    const prevFocus = (prevReport.focusThisWeek || []).map((f) => `  • ${f}`).join('\n')
    const prevGap = prevReport.primaryGap ? `\nPrimary gap identified: ${prevReport.primaryGap}` : ''
    prevSection = `
=== LAST RECOMMENDATION (${prevDate}) ===
Overall tone: ${prevReport.overallTone ?? 'maintain'}${prevGap}
Focus activities suggested:
${prevFocus}
Trajectory note: ${prevReport.trajectoryNote ?? 'none'}

NOTE: Consider whether the previous focus was acted on. If the same gap persists, name it directly.
`
  }

  // Coros section (additive — most sessions are logged manually without HR data)
  let corosSection = ''
  if (corosAggregate) {
    const { sessionCount, avgATE, avgANTE } = corosAggregate
    const ateLabel  = avgATE  >= 3 ? 'solid aerobic stimulus'   : avgATE  >= 2 ? 'moderate aerobic' : 'light aerobic'
    const anteLabel = avgANTE >= 2 ? 'meaningful high-intensity' : avgANTE >= 1 ? 'some high-intensity' : 'minimal high-intensity'
    corosSection = `
=== COROS INTENSITY DATA (${sessionCount} sessions with HR data) ===
  Avg Aerobic Training Effect:   ${avgATE.toFixed(1)}/5.0  [${ateLabel}]
  Avg Anaerobic Training Effect: ${avgANTE.toFixed(1)}/5.0  [${anteLabel}]
  NOTE: Measured from watch HR — use to validate secondary balance.
  Low avgATE despite high cardio session count → cardio may be too intense (not enough Zone 2).
  Low avgANTE despite strength sessions → strength work is not driving cardiovascular peak output.
`
  }

  // Survey interpretation
  const surveyHint = buildSurveyHint(survey)

  return `User: ${userId}
NOTE: Analysis covers ${window} week${window !== 1 ? 's' : ''}${window < 8 ? ` (short history — treat as early baseline, do not penalize)` : ''}.

=== THIS WEEK SO FAR ===
${Object.entries(currentWeekProgress)
  .map(([c, p]) => `  ${c}: ${p.value}/${p.target} ${p.unit}`)
  .join('\n')}

=== ${window}-WEEK ACTIVITY BREAKDOWN ===
${catLines}

=== SECONDARY ATTRIBUTE BALANCE (${window}-week avg pts/week) ===
${secLines}

=== TRAINING LOAD (ACWR) ===
  7-day minutes: ${analysis.acwrAcuteMinutes}
  28-day avg/week: ${analysis.acwrChronicAvgMinutes.toFixed(0)}
  ACWR: ${acwrStatus(acwr)}
${corosSection}${prevSection}
=== WEEKLY CHECK-IN ===
  Sleep this week (1=poor → 5=great): ${survey.sleep}${survey.sleepNote ? `  — "${survey.sleepNote}"` : ''}
  Body / recovery (1=wrecked → 5=great): ${survey.recovery}${survey.injury ? `  — "${survey.injury}"` : ''}
  Training last week (1=much less → 5=crushed it): ${survey.training}${survey.reflection ? `  — "${survey.reflection}"` : ''}
  Upcoming context: ${survey.context ?? 'nothing noted'}

${surveyHint}

=== REQUESTED OUTPUT FORMAT ===
Return a JSON object with this exact shape:
{
  "balanceAssessment": {
    "aerobicBase":  { "status": "low|building|good|strong", "weeklyAvg": <number>, "gap": "<one sentence or null>" },
    "peakOutput":   { "status": "low|building|good|strong", "weeklyAvg": <number>, "gap": "<one sentence or null>" },
    "structural":   { "status": "low|building|good|strong", "weeklyAvg": <number>, "gap": "<one sentence or null>" },
    "restoration":  { "status": "low|building|good|strong", "weeklyAvg": <number>, "gap": "<one sentence or null>" }
  },
  "primaryGap": "<the single most important physiological gap right now — be specific about subtype>",
  "focusThisWeek": [
    "<activity 1 — subtype, duration, intensity guidance>",
    "<activity 2>",
    "<activity 3>"
  ],
  "reasoning": "<2–3 sentences connecting the data to the recommendations>",
  "secondaryAlerts": ["<alert if any attribute is critically low or imbalanced>"],
  "trajectoryNote": "<where current pattern puts this user in ~3 months>",
  "overallTone": "push|maintain|recover",
  "optimalWeeklySecondary": {
    "aerobicBase": <number>,
    "peakOutput":  <number>,
    "structural":  <number>,
    "restoration": <number>
  }
}`
}

function buildSurveyHint(survey) {
  const lines = []

  // Recovery state from sleep + body feel
  const recoveryScore = (survey.sleep + survey.recovery) / 2
  if (recoveryScore <= 2) {
    lines.push('⚠️  RECOVERY HINT: Sleep and/or body-feel signals are stressed. Do not recommend increased intensity or volume. Prioritize restoration.')
  } else if (recoveryScore >= 4) {
    lines.push('✅ RECOVERY HINT: Sleep and body-feel are good. Eligible for intensity or volume increase if secondary balance supports it.')
  } else {
    lines.push('ℹ️  RECOVERY HINT: Recovery is moderate. Conservative adjustments OK.')
  }

  if (survey.injury) {
    lines.push(`⚠️  INJURY: Avoid loading the reported area — "${survey.injury}"`)
  }

  if (survey.training <= 2) {
    lines.push('📉 TRAINING: User logged significantly less than intended last week. Factor in whether this is fatigue, life circumstances, or avoidance of a specific category.')
  } else if (survey.training >= 4) {
    lines.push('📈 TRAINING: User is training above plan. Watch for accumulated load — ACWR may lag.')
  }

  if (survey.reflection) {
    lines.push(`📝 REFLECTION: "${survey.reflection}"`)
  }

  if (survey.context) {
    lines.push(`📅 UPCOMING: "${survey.context}" — factor into recommendations (e.g. travel reduces availability; an event shapes focus).`)
  }

  return lines.join('\n')
}

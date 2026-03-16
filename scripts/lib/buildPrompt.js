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

Respond ONLY with a valid JSON object — no markdown, no commentary outside the JSON.

---

${physioContent}`
}

export function buildUserPrompt(userId, analysis, survey) {
  const { categoryStats, secondaryAvg, acwr, currentWeekProgress } = analysis

  // Build category summary
  const catLines = Object.entries(categoryStats)
    .map(([cat, s]) => {
      const current = currentWeekProgress[cat]
      return `  ${cat}:
    Current goal: ${s.target} ${s.unit}/week
    This week so far: ${current.value}/${current.target} ${current.unit}
    8-week completion rate: ${percent(s.completionRate)} (${s.completions}/${analysis.weeksAnalyzed} weeks)
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

  return `User: ${userId}

=== CURRENT WEEK PROGRESS (partial) ===
${Object.entries(currentWeekProgress)
  .map(([c, p]) => `  ${c}: ${p.value}/${p.target} ${p.unit}`)
  .join('\n')}

=== 8-WEEK CATEGORY ANALYSIS ===
${catLines}

=== SECONDARY ATTRIBUTE AVERAGES (last 8 weeks) ===
${secLines}

=== TRAINING LOAD (ACWR) ===
  7-day minutes: ${analysis.acwrAcuteMinutes}
  28-day avg/week: ${analysis.acwrChronicAvgMinutes.toFixed(0)}
  ACWR ratio: ${acwrStatus(acwr)}

=== WEEKLY CHECK-IN SURVEY ===
  Q1 Effort level (1–5): ${survey.effort}  [${survey.effort >= 4 ? '⚠️ HIGH' : survey.effort <= 2 ? '✅ EASY' : 'OK'}]
  Q2 Energy/recovery (1–5): ${survey.energy}  [${survey.energy <= 2 ? '⚠️ LOW' : survey.energy >= 4 ? '✅ GOOD' : 'OK'}]
  Q3 Injury/pain: ${survey.injury ?? 'none'}
  Q4 Focus area this month: ${survey.focus}
  Q5 OK to push goal higher: ${survey.okToPush ? 'YES' : 'NO'}

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

function buildSurveyHint(survey) {
  const lines = []
  if (survey.effort >= 4 || survey.energy <= 2) {
    lines.push('⚠️  ALGORITHM HINT: Recovery state is stressed. Do NOT increase any targets this week.')
  } else if (survey.effort <= 2 && survey.energy >= 4 && survey.okToPush) {
    lines.push('✅ ALGORITHM HINT: User is feeling strong. Eligible for up to one goal increase.')
  } else {
    lines.push('ℹ️  ALGORITHM HINT: Moderate state. Small adjustments OK; err conservative.')
  }
  if (survey.injury) {
    lines.push(`⚠️  INJURY NOTE: Avoid activities that stress the reported area: "${survey.injury}"`)
  }
  if (survey.focus) {
    lines.push(`🎯 FOCUS: User wants to prioritize ${survey.focus} — weight suggestions in that direction.`)
  }
  return lines.join('\n')
}

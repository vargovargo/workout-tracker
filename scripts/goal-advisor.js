#!/usr/bin/env node
/**
 * goal-advisor.js — AI-powered weekly goal advisor for the fitness tracker.
 *
 * Usage:
 *   node scripts/goal-advisor.js [--user Jason]
 *
 * Required environment variables (can be in a .env file in the project root):
 *   GOOGLE_APPLICATION_CREDENTIALS  path to Firebase service account JSON
 *   ANTHROPIC_API_KEY               Claude API key
 *
 * Optional:
 *   GOAL_USER   user to analyze (default: Jason)
 */

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'
import { fetchUserSessions, fetchUserSettings, writeUserSettings, writeGoalAdvisorReport, fetchGoalAdvisorReport } from './lib/fetchData.js'
import { analyzeHistory } from './lib/analyzeHistory.js'
import { runSurvey } from './lib/survey.js'
import { buildSystemPrompt, buildUserPrompt } from './lib/buildPrompt.js'
import { parseAppleHealth } from './lib/parseAppleHealth.js'
import { analyzeHeartRate } from './lib/analyzeHeartRate.js'
import readline from 'readline'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

// ─── ANSI colors ─────────────────────────────────────────────────────────────
const R = '\x1b[0m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const CYAN = '\x1b[36m'
const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const BLUE = '\x1b[34m'
const MAGENTA = '\x1b[35m'

function header(text) {
  console.log(`\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}`)
  console.log(`${BOLD}${CYAN}  ${text}${R}`)
  console.log(`${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}`)
}

function toneColor(tone) {
  if (tone === 'push') return GREEN
  if (tone === 'recover') return RED
  return YELLOW
}

function trend(t) {
  if (t === '+') return `${GREEN}↑ improving${R}`
  if (t === '-') return `${RED}↓ declining${R}`
  return `${YELLOW}→ stable${R}`
}

function acwrLabel(acwr) {
  if (acwr === null) return `${DIM}N/A${R}`
  if (acwr > 1.5) return `${RED}${acwr.toFixed(2)} ⚠️  HIGH${R}`
  if (acwr > 1.3) return `${YELLOW}${acwr.toFixed(2)} ⚠️  ELEVATED${R}`
  if (acwr < 0.8) return `${YELLOW}${acwr.toFixed(2)} ⚠️  LOW${R}`
  return `${GREEN}${acwr.toFixed(2)} ✅${R}`
}

async function askYesNo(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(`${question} (y/n) ${GREEN}→ ${R}`, (ans) => {
      rl.close()
      resolve(ans.trim().toLowerCase().startsWith('y'))
    })
  })
}

const ALL_USERS = ['Jason', 'Lauren', 'Benton', 'Leo']

// Calculate actual weeks of data (capped at 8)
function getDataWindow(sessions) {
  if (!sessions.length) return 1
  const oldest = Math.min(...sessions.map((s) => new Date(s.occurredAt || s.loggedAt).getTime()))
  const weeks = Math.floor((Date.now() - oldest) / (7 * 24 * 60 * 60 * 1000))
  return Math.min(Math.max(weeks, 1), 8)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function runForUser(userId, appleHealthPath = null) {
  header(`Fitness Goal Advisor — ${userId}`)

  // 1. Fetch data
  console.log(`\n${DIM}Connecting to Firestore...${R}`)
  let sessions, settings, prevReport
  try {
    ;[sessions, settings, prevReport] = await Promise.all([
      fetchUserSessions(userId),
      fetchUserSettings(userId),
      fetchGoalAdvisorReport(userId),
    ])
  } catch (err) {
    console.error(`\n${RED}${BOLD}Error connecting to Firestore:${R} ${err.message}`)
    console.error(`${DIM}Ensure GOOGLE_APPLICATION_CREDENTIALS points to a valid service account JSON.${R}`)
    throw err
  }
  console.log(`${GREEN}✓ Loaded ${sessions.length} sessions for ${userId}${R}`)
  if (prevReport?.generatedAt) {
    const prevDate = new Date(prevReport.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    console.log(`${DIM}  Previous recommendation: ${prevDate}${R}`)
  }

  // 2. Parse Apple Health (optional)
  let heartRateAnalysis = null
  if (appleHealthPath) {
    try {
      process.stdout.write(`${DIM}Parsing Apple Health export...${R}`)
      const healthData = await parseAppleHealth(appleHealthPath)
      heartRateAnalysis = analyzeHeartRate(healthData, userId)
      console.log(`${GREEN} ✓ ${healthData.heartRateSamples.length} HR samples loaded${R}`)
    } catch (err) {
      console.log(`${YELLOW} ⚠ Apple Health parse failed: ${err.message}${R}`)
    }
  }

  // 3. Analyze history — use actual data window, not a fixed 8 weeks
  const dataWindow = getDataWindow(sessions)
  if (dataWindow < 8) {
    console.log(`${YELLOW}  Note: Only ${dataWindow} week(s) of data — analysis window adjusted.${R}`)
  }
  const analysis = analyzeHistory(sessions, settings, dataWindow)

  // Print summaries
  header('8-Week Training Summary')
  for (const [cat, s] of Object.entries(analysis.categoryStats)) {
    const pct = Math.round(s.completionRate * 100)
    const bar = '█'.repeat(Math.round(pct / 10)).padEnd(10, '░')
    console.log(
      `\n  ${BOLD}${cat.padEnd(12)}${R} goal: ${s.target} ${s.unit}/wk  |  ${bar} ${pct}% hit  |  ${trend(s.trend)}`
    )
  }

  console.log(`\n${BOLD}  Secondary attributes (weekly avg):${R}`)
  for (const [k, v] of Object.entries(analysis.secondaryAvg)) {
    console.log(`    ${k.padEnd(14)} ${v.toFixed(1)} pts`)
  }

  console.log(`\n${BOLD}  Training load (ACWR):${R} ${acwrLabel(analysis.acwr)}`)

  if (heartRateAnalysis) {
    const hr = heartRateAnalysis
    console.log(`\n${BOLD}${MAGENTA}  Apple Watch Heart Rate (last 7 days):${R}`)
    console.log(`    Max HR estimate: ${hr.maxHR} bpm`)
    console.log(`    Zone 2 (${hr.zones.z2[0]}–${hr.zones.z2[1]} bpm): ~${hr.zone2MinLast7d} min  ${DIM}(4-wk avg: ${hr.zone2MinAvg4wk} min/wk)${R}`)
    console.log(`    Zone 5 (${hr.zones.z5[0]}+ bpm):    ~${hr.zone5MinLast7d} min  ${DIM}(4-wk avg: ${hr.zone5MinAvg4wk} min/wk)${R}`)
    if (hr.restingHR7d !== null) {
      const rhrTrendStr = hr.restingHRTrend === 'declining' ? `${GREEN}↓ declining (fitness improving)${R}`
                        : hr.restingHRTrend === 'elevated'  ? `${RED}↑ elevated ⚠️${R}`
                        : `${YELLOW}→ stable${R}`
      console.log(`    Resting HR: ${hr.restingHR7d} bpm (7d) vs ${hr.restingHR28d} bpm (28d) — ${rhrTrendStr}`)
    }
    if (hr.hrv7d !== null) {
      const hrvTrendStr = hr.hrvTrend === 'improving' ? `${GREEN}↑ improving${R}`
                        : hr.hrvTrend === 'declining' ? `${RED}↓ declining ⚠️${R}`
                        : `${YELLOW}→ stable${R}`
      console.log(`    HRV (SDNN): ${hr.hrv7d} ms (7d) vs ${hr.hrv28d} ms (28d) — ${hrvTrendStr}`)
    }
  }

  // 4. Survey
  const survey = await runSurvey()

  // 5. Call Claude
  header('Generating Recommendations...')
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(`\n${RED}ANTHROPIC_API_KEY not set. Add it to your .env file.${R}`)
    process.exit(1)
  }

  const client = new Anthropic()
  let result
  try {
    process.stdout.write(`${DIM}Thinking`)
    const interval = setInterval(() => process.stdout.write('.'), 600)

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: buildSystemPrompt(userId),
      messages: [{ role: 'user', content: buildUserPrompt(userId, analysis, survey, prevReport, heartRateAnalysis) }],
    })

    clearInterval(interval)
    process.stdout.write(`${R}\n`)
    result = JSON.parse(msg.content[0].text)
  } catch (err) {
    console.error(`\n${RED}Claude API error:${R} ${err.message}`)
    process.exit(1)
  }

  // 6. Display results
  header('Recommended Goals')

  const toneCol = toneColor(result.overallTone)
  console.log(`\n  ${BOLD}Overall tone:${R} ${toneCol}${BOLD}${result.overallTone.toUpperCase()}${R}\n`)

  for (const [cat, goal] of Object.entries(result.suggestedGoals)) {
    const current = settings?.[cat]?.target ?? 3
    const changed = goal.changed ? ` ${YELLOW}(was ${current})${R}` : `${DIM} (no change)${R}`
    console.log(`  ${BOLD}${cat.padEnd(12)}${R} → ${GREEN}${BOLD}${goal.target} ${goal.unit}/week${R}${changed}`)
    if (result.reasoning[cat]) {
      console.log(`    ${DIM}${result.reasoning[cat]}${R}`)
    }
  }

  console.log(`\n${BOLD}${BLUE}  Focus activities this week:${R}`)
  for (const activity of result.focusThisWeek || []) {
    console.log(`    • ${activity}`)
  }

  if (result.secondaryAlerts?.length) {
    console.log(`\n${BOLD}${YELLOW}  Secondary attribute alerts:${R}`)
    for (const alert of result.secondaryAlerts) {
      console.log(`    ⚠️  ${alert}`)
    }
  }

  if (result.trajectoryNote) {
    console.log(`\n${BOLD}${MAGENTA}  3-month trajectory:${R}`)
    console.log(`    ${result.trajectoryNote}`)
  }

  // 7. Save report to Firestore
  try {
    await writeGoalAdvisorReport(userId, result, analysis)
    console.log(`\n${DIM}✓ Report saved to app.${R}`)
  } catch (err) {
    console.error(`\n${YELLOW}Could not save report to Firestore:${R} ${err.message}`)
  }

  // 8. Offer to apply
  const anyChanged = Object.values(result.suggestedGoals).some((g) => g.changed)
  if (anyChanged) {
    console.log('')
    const apply = await askYesNo(`\n${BOLD}Apply these new goals to Firestore for ${userId}?${R}`)
    if (apply) {
      const newSettings = {}
      for (const [cat, goal] of Object.entries(result.suggestedGoals)) {
        newSettings[cat] = { target: goal.target, unit: goal.unit }
      }
      try {
        await writeUserSettings(userId, newSettings)
        console.log(`\n${GREEN}${BOLD}✓ Goals updated in Firestore for ${userId}!${R}`)
        console.log(`${DIM}Refresh the web app to see your new targets.${R}\n`)
      } catch (err) {
        console.error(`\n${RED}Failed to write to Firestore:${R} ${err.message}`)
      }
    } else {
      console.log(`\n${DIM}Goals not applied. Run the script again when you're ready.${R}\n`)
    }
  } else {
    console.log(`\n${DIM}No goal changes recommended. Keep going!${R}\n`)
  }
}

async function main() {
  console.clear()
  const runAll = process.argv.includes('--all')
  const userArg = process.argv.find((a) => a.startsWith('--user='))
  const appleHealthArg = process.argv.find((a) => a.startsWith('--apple-health='))
  const appleHealthPath = appleHealthArg ? appleHealthArg.split('=').slice(1).join('=') : null

  if (runAll) {
    header('Fitness Goal Advisor — All Users')
    console.log(`\n${BOLD}Running for: ${ALL_USERS.join(', ')}${R}\n`)
    if (appleHealthPath) {
      console.log(`${DIM}Apple Health export: ${appleHealthPath}${R}\n`)
    }
    for (const userId of ALL_USERS) {
      try {
        await runForUser(userId, appleHealthPath)
      } catch (err) {
        console.error(`\n${RED}Failed for ${userId}:${R} ${err.message}`)
      }
      if (userId !== ALL_USERS[ALL_USERS.length - 1]) {
        console.log(`\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}`)
        const cont = await askYesNo(`${BOLD}Continue to next user?${R}`)
        if (!cont) {
          console.log(`\n${DIM}Stopped. Re-run with --all to continue.${R}\n`)
          break
        }
      }
    }
  } else {
    const userId = userArg ? userArg.split('=')[1] : (process.env.GOAL_USER || 'Jason')
    await runForUser(userId, appleHealthPath)
  }
}

main().catch((err) => {
  console.error(`\n${RED}Unexpected error:${R}`, err)
  process.exit(1)
})

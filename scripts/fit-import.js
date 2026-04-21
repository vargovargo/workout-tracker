#!/usr/bin/env node
/**
 * fit-import.js — Import Coros .fit files into the fitness tracker.
 *
 * Usage:
 *   node scripts/fit-import.js --user=Jason --file=./data/coros/activity.fit [--dry-run]
 *   node scripts/fit-import.js --user=Jason --dir=./data/coros [--dry-run]
 *
 * Requires .env with:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
 *
 * FIT files from Coros do not include Training Effect scores — those are only
 * available in the CSV export from training.coros.com. This importer captures
 * HR data (avgHR, maxHR) and duration, which is sufficient for score validation
 * and intensity analysis.
 */

import 'dotenv/config'
import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import FitParser from 'fit-file-parser'
import { fetchUserSessions, writeSession } from './lib/fetchData.js'

// ─── FIT sport → app category/subtype mapping ────────────────────────────────

const FIT_SPORT_MAP = {
  'running':          { category: 'cardio',   subtype: 'run' },
  'cycling':          { category: 'cardio',   subtype: 'bike' },
  'swimming':         { category: 'cardio',   subtype: 'swimming' },
  'hiking':           { category: 'cardio',   subtype: 'hike' },
  'basketball':       { category: 'cardio',   subtype: 'basketball' },
  'soccer':           { category: 'cardio',   subtype: 'soccer' },
  'rowing':           { category: 'cardio',   subtype: 'row' },
  'surfing':          { category: 'cardio',   subtype: 'surfing' },
  'rock_climbing':    { category: 'strength', subtype: 'climbing' },
  'training':         { category: 'strength', subtype: 'weights' }, // refined by sub_sport below
  'yoga':             { category: 'mobility', subtype: 'yoga' },
  'flexibility':      { category: 'mobility', subtype: 'stretching' },
  'meditation':       { category: 'mindfulness', subtype: 'meditation' },
}

// sub_sport overrides for 'training' sport
const FIT_SUB_SPORT_MAP = {
  'strength_training': { category: 'strength', subtype: 'weights' },
  'hiit':              { category: 'strength', subtype: 'HIIT' },
  'cardio_training':   { category: 'cardio',   subtype: null },
  'yoga':              { category: 'mobility', subtype: 'yoga' },
  'flexibility':       { category: 'mobility', subtype: 'stretching' },
}

// ─── Commute detection (same logic as coros-import.js) ───────────────────────

const IMPORT_RULES = [
  {
    description: 'Weekday bike commute (20–40 min)',
    test: ({ mapping, durationMinutes, date }) =>
      mapping?.subtype === 'bike' &&
      durationMinutes >= 20 && durationMinutes <= 40 &&
      date.getDay() >= 1 && date.getDay() <= 5,
    apply: () => ({ subtype: 'commute' }),
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekKey(date) {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setUTCDate(d.getUTCDate() + diff)
  const year = d.getUTCFullYear()
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const week = Math.ceil(((d - jan4) / 86400000 + jan4.getUTCDay() + 6) / 7)
  return `${year}-${String(week).padStart(2, '0')}`
}

function toDateString(date) {
  return date.toISOString().slice(0, 10)
}

function dedupKey(dateStr, category, durationMinutes) {
  return `${dateStr}::${category}::${Math.round(durationMinutes)}`
}

function parseFitFile(filePath) {
  return new Promise((res, rej) => {
    const buf = readFileSync(filePath)
    const parser = new FitParser({ force: true, speedUnit: 'km/h', lengthUnit: 'km' })
    parser.parse(buf, (err, data) => err ? rej(err) : res(data))
  })
}

function mapActivity(sport, subSport) {
  // Try sub_sport override first (for 'training' sport)
  if (subSport && FIT_SUB_SPORT_MAP[subSport]) return FIT_SUB_SPORT_MAP[subSport]
  return FIT_SPORT_MAP[sport] || null
}

// ─── Import ───────────────────────────────────────────────────────────────────

async function importFile(filePath, user, existingKeys, dryRun, options = {}) {
  let data
  try {
    data = await parseFitFile(filePath)
  } catch (err) {
    console.error(`  ✗ Parse error (${filePath}): ${err.message}`)
    return { imported: 0, skipped: 0, unmapped: 0, errors: 1 }
  }

  const session = data.sessions?.[0]
  if (!session) {
    console.error(`  ✗ No session data in ${filePath}`)
    return { imported: 0, skipped: 0, unmapped: 0, errors: 1 }
  }

  const sport = session.sport?.toLowerCase?.() || ''
  const subSport = typeof session.sub_sport === 'string' ? session.sub_sport.toLowerCase() : ''
  let mapping = mapActivity(sport, subSport)

  if (!mapping) {
    console.log(`  ⚠️  Unmapped sport: "${sport}" / sub_sport: "${subSport}" — skipping`)
    return { imported: 0, skipped: 0, unmapped: 1, errors: 0 }
  }

  const date = new Date(session.start_time)
  if (isNaN(date.getTime())) {
    console.error(`  ✗ Invalid date in ${filePath}`)
    return { imported: 0, skipped: 0, unmapped: 0, errors: 1 }
  }

  const durationMinutes = Math.round((session.total_timer_time || session.total_elapsed_time || 0) / 60)
  if (durationMinutes < 1) {
    console.error(`  ✗ Duration too short (${durationMinutes}m) in ${filePath}`)
    return { imported: 0, skipped: 0, unmapped: 0, errors: 1 }
  }

  // Apply import rules
  let { category, subtype } = mapping
  let appliedRule = null
  for (const rule of IMPORT_RULES) {
    if (rule.test({ mapping, durationMinutes, date })) {
      const override = rule.apply()
      if (override.subtype) subtype = override.subtype
      appliedRule = rule
      break
    }
  }

  const dateStr = toDateString(date)
  const key = dedupKey(dateStr, category, durationMinutes)
  if (existingKeys.has(key)) {
    console.log(`  ↩  ${category}/${subtype} on ${dateStr} ${durationMinutes}m — duplicate, skipped`)
    return { imported: 0, skipped: 1, unmapped: 0, errors: 0 }
  }
  existingKeys.add(key)

  // HR metrics
  const avgHR = session.avg_heart_rate || null
  const maxHR = session.max_heart_rate || null
  const distanceM = session.total_distance ? Math.round(session.total_distance * 1000) : null

  const fitMetrics = {}
  if (avgHR != null) fitMetrics.avgHR = avgHR
  if (maxHR != null) fitMetrics.maxHR = maxHR
  if (distanceM != null) fitMetrics.distanceMeters = distanceM
  // Training Effect scores from --ate/--ante flags (not in FIT file, read from Coros app)
  if (options.ate != null) fitMetrics.aerobicTrainingEffect = options.ate
  if (options.ante != null) fitMetrics.anaerobicTrainingEffect = options.ante

  const noteParts = []
  if (distanceM > 0) noteParts.push(`${(distanceM / 1000).toFixed(1)}km`)
  if (appliedRule) noteParts.push(appliedRule.description)
  const notes = noteParts.length > 0 ? `Coros: ${noteParts.join(', ')}` : undefined

  const record = {
    id: crypto.randomUUID(),
    weekKey: getWeekKey(date),
    category,
    subtype,
    durationMinutes,
    occurredAt: date.toISOString(),
    loggedAt: new Date().toISOString(),
    source: 'coros',
    ...(Object.keys(fitMetrics).length > 0 ? { corosMetrics: fitMetrics } : {}),
    ...(notes ? { notes } : {}),
  }

  const hrLabel = avgHR ? ` HR:${avgHR}avg/${maxHR}max` : ''
  const ruleLabel = appliedRule ? ` [→${subtype}]` : ''
  console.log(`  ✓ ${dryRun ? '[dry] ' : ''}${category}/${subtype}${ruleLabel} on ${dateStr} ${durationMinutes}m${hrLabel}`)

  if (!dryRun) await writeSession(user, record)
  return { imported: 1, skipped: 0, unmapped: 0, errors: 0 }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2)
      .filter((a) => a.startsWith('--'))
      .map((a) => {
        const [k, ...v] = a.slice(2).split('=')
        return [k, v.join('=') || true]
      })
  )

  const user = args.user
  const filePath = args.file
  const dirPath = args.dir
  const dryRun = args['dry-run'] === true || args['dry-run'] === 'true'
  // Optional Training Effect scores (not in FIT file — read from Coros app and pass manually)
  const ate  = args.ate  != null ? parseFloat(args.ate)  : null
  const ante = args.ante != null ? parseFloat(args.ante) : null

  if (!user || (!filePath && !dirPath)) {
    console.error('Usage:')
    console.error('  node scripts/fit-import.js --user=Jason --file=./activity.fit [--dry-run] [--ate=2.4] [--ante=0.0]')
    console.error('  node scripts/fit-import.js --user=Jason --dir=./data/coros [--dry-run]')
    process.exit(1)
  }

  const files = filePath
    ? [resolve(filePath)]
    : readdirSync(resolve(dirPath)).filter((f) => f.endsWith('.fit')).map((f) => resolve(dirPath, f))

  if (files.length === 0) {
    console.error('No .fit files found.')
    process.exit(1)
  }

  console.log(`\nCoros FIT Import — user: ${user}${dryRun ? ' [DRY RUN]' : ''}`)
  console.log(`Files: ${files.length}\n`)

  const existingSessions = dryRun ? [] : await fetchUserSessions(user)
  const existingKeys = new Set(
    existingSessions.map((s) => {
      const d = new Date(s.occurredAt || s.loggedAt)
      return dedupKey(toDateString(d), s.category, s.durationMinutes || 0)
    })
  )

  const totals = { imported: 0, skipped: 0, unmapped: 0, errors: 0 }
  for (const f of files) {
    const result = await importFile(f, user, existingKeys, dryRun, { ate, ante })
    for (const k of Object.keys(totals)) totals[k] += result[k]
  }

  console.log('\n─── Results ───')
  console.log(`  Imported : ${totals.imported}`)
  console.log(`  Skipped  : ${totals.skipped} (duplicates)`)
  console.log(`  Unmapped : ${totals.unmapped}`)
  console.log(`  Errors   : ${totals.errors}`)
  if (dryRun) console.log('\n[DRY RUN — nothing written to Firestore]')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

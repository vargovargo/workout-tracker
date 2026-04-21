#!/usr/bin/env node
/**
 * coros-import.js — Import Coros watch activity exports into the fitness tracker.
 *
 * Usage:
 *   node scripts/coros-import.js --user=Jason --file=./coros-export.csv [--dry-run]
 *   node scripts/coros-import.js --user=Jason --backfill [--dry-run]
 *   npm run coros-import -- --user=Jason --file=./export.csv
 *
 * Requires .env with:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
 *
 * Coros CSV export: go to training.coros.com → Activities → Export
 * The script handles flexible column names (case-insensitive).
 *
 * --file mode: imports new sessions from a Coros CSV export.
 *   Sessions are written with source: 'coros' and optional corosMetrics.
 *   Auto-populates notes with distance, elevation gain, and rule labels.
 *   Deduplicates against existing sessions (date + category + duration).
 *
 * --backfill mode: applies IMPORT_RULES to existing Firestore sessions and
 *   updates any that qualify for a different subtype (e.g. bike → commute).
 */

import 'dotenv/config'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fetchUserSessions, writeSession, updateSession } from './lib/fetchData.js'

// ─── Coros activity type → app category/subtype mapping ──────────────────────

const COROS_ACTIVITY_MAP = {
  'running':              { category: 'cardio',      subtype: 'run' },
  'run':                  { category: 'cardio',      subtype: 'run' },
  'trail running':        { category: 'cardio',      subtype: 'trail run' },
  'trail run':            { category: 'cardio',      subtype: 'trail run' },
  'cycling':              { category: 'cardio',      subtype: 'bike' },
  'bike':                 { category: 'cardio',      subtype: 'bike' },
  'indoor cycling':       { category: 'cardio',      subtype: 'bike' },
  'swimming':             { category: 'cardio',      subtype: 'swimming' },
  'pool swimming':        { category: 'cardio',      subtype: 'swimming' },
  'open water swimming':  { category: 'cardio',      subtype: 'swimming' },
  'open water':           { category: 'cardio',      subtype: 'swimming' },
  'hiking':               { category: 'cardio',      subtype: 'hike' },
  'hike':                 { category: 'cardio',      subtype: 'hike' },
  'basketball':           { category: 'cardio',      subtype: 'basketball' },
  'soccer':               { category: 'cardio',      subtype: 'soccer' },
  'football':             { category: 'cardio',      subtype: 'soccer' },
  'ultimate frisbee':     { category: 'cardio',      subtype: 'frisbee' },
  'frisbee':              { category: 'cardio',      subtype: 'frisbee' },
  'rowing':               { category: 'cardio',      subtype: 'row' },
  'row':                  { category: 'cardio',      subtype: 'row' },
  'surfing':              { category: 'cardio',      subtype: 'surfing' },
  'strength training':    { category: 'strength',    subtype: 'weights' },
  'strength':             { category: 'strength',    subtype: 'weights' },
  'weight training':      { category: 'strength',    subtype: 'weights' },
  'gym':                  { category: 'strength',    subtype: 'weights' },
  'hiit':                 { category: 'strength',    subtype: 'HIIT' },
  'high intensity interval training': { category: 'strength', subtype: 'HIIT' },
  'climbing':             { category: 'strength',    subtype: 'climbing' },
  'rock climbing':        { category: 'strength',    subtype: 'climbing' },
  'core':                 { category: 'strength',    subtype: 'core' },
  'yoga':                 { category: 'mobility',    subtype: 'yoga' },
  'stretching':           { category: 'mobility',    subtype: 'stretching' },
  'flexibility':          { category: 'mobility',    subtype: 'stretching' },
  'balance':              { category: 'mobility',    subtype: 'balance' },
  'plyometrics':          { category: 'strength',    subtype: 'plyometrics' },
  'meditation':           { category: 'mindfulness', subtype: 'meditation' },
  'breathing':            { category: 'mindfulness', subtype: 'breathing' },
}

// ─── Import rules — context-aware subtype override ───────────────────────────
// Applied after basic activity type mapping. First matching rule wins.
// test() receives { mapping, durationMinutes, date } and returns true/false.
// apply() returns fields to merge into the session (typically { subtype }).

const IMPORT_RULES = [
  {
    description: 'Weekday bike commute (20–40 min)',
    test: ({ mapping, durationMinutes, date }) =>
      mapping?.subtype === 'bike' &&
      durationMinutes >= 20 && durationMinutes <= 40 &&
      date.getDay() >= 1 && date.getDay() <= 5,  // Mon–Fri
    apply: () => ({ subtype: 'commute' }),
  },
  // Add more rules here as patterns emerge from actual watch data.
  // Examples:
  // - Long weekend ride > 75 min → subtype: 'bike' (already correct, but could add label)
  // - Trail run with elevation > 500m → subtype: 'trail run'
]

// ─── CSV parsing ──────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) throw new Error('CSV has no data rows')
  const headers = parseRow(lines[0]).map((h) => h.trim().toLowerCase())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i])
    if (values.every((v) => v.trim() === '')) continue
    const row = {}
    headers.forEach((h, idx) => { row[h] = (values[idx] ?? '').trim() })
    rows.push(row)
  }
  return { headers, rows }
}

function parseRow(line) {
  const fields = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

// ─── Column resolvers ─────────────────────────────────────────────────────────

function findCol(row, ...candidates) {
  for (const c of candidates) {
    const key = Object.keys(row).find((k) => k === c || k.startsWith(c))
    if (key && row[key] !== '') return row[key]
  }
  return null
}

function parseDuration(row) {
  const raw = findCol(row, 'duration', 'elapsed time', 'moving time', 'time')
  if (!raw) return null
  const hms = raw.match(/^(\d+):(\d+):(\d+)$/)
  if (hms) return parseInt(hms[1]) * 60 + parseInt(hms[2]) + parseInt(hms[3]) / 60
  const ms = raw.match(/^(\d+):(\d+)$/)
  if (ms) return parseInt(ms[1]) + parseInt(ms[2]) / 60
  const secs = parseFloat(raw)
  if (!isNaN(secs) && secs > 60) return secs / 60
  return null
}

function parseNum(row, ...candidates) {
  const raw = findCol(row, ...candidates)
  if (!raw) return null
  const n = parseFloat(raw)
  return isNaN(n) ? null : n
}

// ─── Utilities ────────────────────────────────────────────────────────────────

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

// ─── Import mode ──────────────────────────────────────────────────────────────

async function runImport(user, filePath, dryRun) {
  const csvText = readFileSync(resolve(filePath), 'utf8')
  const { headers, rows } = parseCSV(csvText)
  console.log(`Parsed ${rows.length} row(s). Headers: ${headers.slice(0, 8).join(', ')}${headers.length > 8 ? '...' : ''}`)

  const existingSessions = dryRun ? [] : await fetchUserSessions(user)
  const existingKeys = new Set(
    existingSessions.map((s) => {
      const d = new Date(s.occurredAt || s.loggedAt)
      return dedupKey(toDateString(d), s.category, s.durationMinutes || 0)
    })
  )

  const results = { imported: 0, skipped: 0, unmapped: 0, errors: 0 }
  const unmappedTypes = new Set()

  for (const row of rows) {
    try {
      const activityName = findCol(row, 'activity name', 'title', 'name', 'sport', 'activity type', 'type')
      if (!activityName) { results.errors++; continue }

      const mapping = COROS_ACTIVITY_MAP[activityName.toLowerCase().trim()]
      if (!mapping) { unmappedTypes.add(activityName); results.unmapped++; continue }

      const rawDate = findCol(row, 'start time', 'date', 'activity date', 'time')
      if (!rawDate) { results.errors++; continue }
      const date = new Date(rawDate.replace(' ', 'T'))
      if (isNaN(date.getTime())) { results.errors++; continue }

      const rawMins = parseDuration(row)
      if (!rawMins || rawMins < 1) { results.errors++; continue }
      const durationMinutes = Math.round(rawMins)

      // Apply import rules (first match wins)
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
      if (existingKeys.has(key)) { results.skipped++; continue }
      existingKeys.add(key)

      // Coros metrics
      const aerobicTE  = parseNum(row, 'aerobic training effect', 'aerobic te', 'aerobic effect')
      const anaerobicTE = parseNum(row, 'anaerobic training effect', 'anaerobic te', 'anaerobic effect')
      const avgHR      = parseNum(row, 'avg hr', 'average heart rate', 'avg heart rate')
      const maxHR      = parseNum(row, 'max hr', 'max heart rate', 'maximum heart rate')
      const distanceM  = parseNum(row, 'distance (m)', 'distance(m)', 'distance m', 'distance')
      const elevGain   = parseNum(row, 'ascent', 'elevation gain', 'total ascent', 'climb', 'ascent (m)')

      const corosMetrics = {}
      if (aerobicTE != null)   corosMetrics.aerobicTrainingEffect = aerobicTE
      if (anaerobicTE != null) corosMetrics.anaerobicTrainingEffect = anaerobicTE
      if (avgHR != null)       corosMetrics.avgHR = avgHR
      if (maxHR != null)       corosMetrics.maxHR = maxHR
      if (distanceM != null)   corosMetrics.distanceMeters = distanceM

      // Auto-populate notes from useful Coros fields
      const noteParts = []
      if (distanceM > 0)  noteParts.push(`${(distanceM / 1000).toFixed(1)}km`)
      if (elevGain > 0)   noteParts.push(`+${Math.round(elevGain)}m elev`)
      if (appliedRule)    noteParts.push(appliedRule.description)
      const notes = noteParts.length > 0 ? `Coros: ${noteParts.join(', ')}` : undefined

      const session = {
        id: crypto.randomUUID(),
        weekKey: getWeekKey(date),
        category,
        subtype,
        durationMinutes,
        occurredAt: date.toISOString(),
        loggedAt: new Date().toISOString(),
        source: 'coros',
        ...(Object.keys(corosMetrics).length > 0 ? { corosMetrics } : {}),
        ...(notes ? { notes } : {}),
      }

      const ruleLabel = appliedRule ? ` [→${subtype}]` : ''
      const teLabel   = aerobicTE != null ? ` ATE:${aerobicTE.toFixed(1)}/${(anaerobicTE ?? 0).toFixed(1)}` : ''
      console.log(`  ✓ ${dryRun ? '[dry] ' : ''}${category}/${subtype}${ruleLabel} on ${dateStr} ${durationMinutes}m${teLabel}${notes ? ` — ${notes}` : ''}`)

      if (!dryRun) await writeSession(user, session)
      results.imported++
    } catch (err) {
      results.errors++
      console.error('  ✗ Row error:', err.message)
    }
  }

  console.log(`\n─── Results ───`)
  console.log(`  Imported : ${results.imported}`)
  console.log(`  Skipped  : ${results.skipped} (duplicates)`)
  console.log(`  Unmapped : ${results.unmapped} (unknown activity types)`)
  console.log(`  Errors   : ${results.errors}`)
  if (unmappedTypes.size > 0) {
    console.log(`\nUnmapped types (add to COROS_ACTIVITY_MAP if needed):`)
    for (const t of unmappedTypes) console.log(`  - "${t}"`)
  }
}

// ─── Backfill mode ────────────────────────────────────────────────────────────

async function runBackfill(user, dryRun) {
  console.log(`Fetching existing sessions for ${user}...`)
  const sessions = await fetchUserSessions(user)
  console.log(`Found ${sessions.length} sessions. Checking against ${IMPORT_RULES.length} rule(s)...\n`)

  let updated = 0
  let unchanged = 0

  for (const session of sessions) {
    const date = new Date(session.occurredAt || session.loggedAt)
    const mapping = { category: session.category, subtype: session.subtype }

    for (const rule of IMPORT_RULES) {
      if (rule.test({ mapping, durationMinutes: session.durationMinutes || 0, date })) {
        const override = rule.apply()
        const newSubtype = override.subtype
        if (newSubtype && session.subtype !== newSubtype) {
          console.log(`  ✓ ${dryRun ? '[dry] ' : ''}${session.category}/${session.subtype} → ${newSubtype}  on ${toDateString(date)} ${session.durationMinutes}m  [${rule.description}]`)
          if (!dryRun) await updateSession(user, session.id, { subtype: newSubtype })
          updated++
        } else {
          unchanged++
        }
        break
      }
    }
  }

  console.log(`\n─── Backfill results ───`)
  console.log(`  Updated   : ${updated}`)
  console.log(`  Unchanged : ${unchanged} (already correct or no rule matched)`)
  if (dryRun) console.log('\n[DRY RUN — nothing was written to Firestore]')
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
  const backfill = args.backfill === true || args.backfill === 'true'
  const dryRun = args['dry-run'] === true || args['dry-run'] === 'true'

  if (!user) {
    console.error('Usage:')
    console.error('  node scripts/coros-import.js --user=Jason --file=./export.csv [--dry-run]')
    console.error('  node scripts/coros-import.js --user=Jason --backfill [--dry-run]')
    process.exit(1)
  }

  if (backfill) {
    console.log(`\nCoros Backfill — user: ${user}${dryRun ? ' [DRY RUN]' : ''}`)
    await runBackfill(user, dryRun)
  } else if (filePath) {
    console.log(`\nCoros Import — user: ${user}, file: ${filePath}${dryRun ? ' [DRY RUN]' : ''}`)
    await runImport(user, filePath, dryRun)
  } else {
    console.error('Provide either --file=<path> to import or --backfill to reclassify existing sessions.')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

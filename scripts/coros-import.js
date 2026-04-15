#!/usr/bin/env node
/**
 * coros-import.js — Import Coros watch activity exports into the fitness tracker.
 *
 * Usage:
 *   node scripts/coros-import.js --user=Jason --file=./coros-export.csv [--dry-run]
 *   npm run coros-import -- --user=Jason --file=./coros-export.csv
 *
 * Requires .env with:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
 *
 * Coros CSV export: go to training.coros.com → Activities → Export
 * The script handles flexible column names (case-insensitive).
 *
 * Sessions are written with:
 *   source: 'coros'
 *   corosMetrics: { aerobicTrainingEffect, anaerobicTrainingEffect, avgHR, maxHR, distanceMeters }
 *
 * Deduplication: skips sessions that match an existing session on
 *   date (YYYY-MM-DD) + category + rounded duration (within 2 min).
 */

import 'dotenv/config'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fetchUserSessions, writeSession } from './lib/fetchData.js'

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
  'plyometrics':          { category: 'mobility',    subtype: 'plyometrics' },
  'meditation':           { category: 'mindfulness', subtype: 'meditation' },
  'breathing':            { category: 'mindfulness', subtype: 'breathing' },
}

// ─── CSV parsing ──────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) throw new Error('CSV has no data rows')

  // Parse header row — handle quoted fields
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

// ─── Column resolvers (handle varying Coros export formats) ──────────────────

function findCol(row, ...candidates) {
  for (const c of candidates) {
    const key = Object.keys(row).find((k) => k === c || k.startsWith(c))
    if (key && row[key] !== '') return row[key]
  }
  return null
}

function parseActivityName(row) {
  return findCol(row, 'activity name', 'title', 'name', 'sport', 'activity type', 'type')
}

function parseDate(row) {
  const raw = findCol(row, 'start time', 'date', 'activity date', 'time')
  if (!raw) return null
  // Handle formats: "2026-04-14 06:30:00", "04/14/2026 06:30", "2026-04-14"
  const d = new Date(raw.replace(' ', 'T'))
  return isNaN(d.getTime()) ? null : d
}

function parseDuration(row) {
  const raw = findCol(row, 'duration', 'elapsed time', 'moving time', 'time')
  if (!raw) return null

  // HH:MM:SS
  const hms = raw.match(/^(\d+):(\d+):(\d+)$/)
  if (hms) return parseInt(hms[1]) * 60 + parseInt(hms[2]) + parseInt(hms[3]) / 60

  // MM:SS
  const ms = raw.match(/^(\d+):(\d+)$/)
  if (ms) return parseInt(ms[1]) + parseInt(ms[2]) / 60

  // Seconds as number
  const secs = parseFloat(raw)
  if (!isNaN(secs) && secs > 60) return secs / 60

  return null
}

function parseFloat2(row, ...candidates) {
  const raw = findCol(row, ...candidates)
  if (!raw) return null
  const n = parseFloat(raw)
  return isNaN(n) ? null : n
}

// ─── ISO week key (Monday-anchored) ──────────────────────────────────────────

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

// ─── Deduplication key ────────────────────────────────────────────────────────

function dedupKey(dateStr, category, durationMinutes) {
  return `${dateStr}::${category}::${Math.round(durationMinutes)}`
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
  const dryRun = args['dry-run'] === true || args['dry-run'] === 'true'

  if (!user || !filePath) {
    console.error('Usage: node scripts/coros-import.js --user=Jason --file=./export.csv [--dry-run]')
    process.exit(1)
  }

  console.log(`\nCoros Import — user: ${user}, file: ${filePath}${dryRun ? ' [DRY RUN]' : ''}`)

  // Load CSV
  const csvText = readFileSync(resolve(filePath), 'utf8')
  const { headers, rows } = parseCSV(csvText)
  console.log(`Parsed ${rows.length} row(s). Headers: ${headers.slice(0, 8).join(', ')}${headers.length > 8 ? '...' : ''}`)

  // Fetch existing sessions for dedup
  let existingSessions = []
  if (!dryRun) {
    existingSessions = await fetchUserSessions(user)
  }
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
      const activityName = parseActivityName(row)
      if (!activityName) { results.errors++; console.warn('  ⚠ No activity name in row:', row); continue }

      const mapping = COROS_ACTIVITY_MAP[activityName.toLowerCase().trim()]
      if (!mapping) {
        unmappedTypes.add(activityName)
        results.unmapped++
        continue
      }

      const date = parseDate(row)
      if (!date) { results.errors++; console.warn(`  ⚠ Could not parse date for: ${activityName}`); continue }

      const rawMins = parseDuration(row)
      if (!rawMins || rawMins < 1) { results.errors++; console.warn(`  ⚠ Invalid duration for: ${activityName}`); continue }
      const durationMinutes = Math.round(rawMins)

      const { category, subtype } = mapping
      const dateStr = toDateString(date)
      const key = dedupKey(dateStr, category, durationMinutes)

      if (existingKeys.has(key)) {
        results.skipped++
        console.log(`  ⏭  Skip (duplicate): ${activityName} on ${dateStr} ${durationMinutes}m`)
        continue
      }

      // Build corosMetrics from available columns
      const aerobicTE = parseFloat2(row, 'aerobic training effect', 'aerobic te', 'aerobic effect')
      const anaerobicTE = parseFloat2(row, 'anaerobic training effect', 'anaerobic te', 'anaerobic effect')
      const avgHR = parseFloat2(row, 'avg hr', 'average heart rate', 'avg heart rate', 'heart rate avg')
      const maxHR = parseFloat2(row, 'max hr', 'max heart rate', 'maximum heart rate')
      const distanceMeters = parseFloat2(row, 'distance (m)', 'distance(m)', 'distance m', 'distance')

      const corosMetrics = {}
      if (aerobicTE != null)    corosMetrics.aerobicTrainingEffect = aerobicTE
      if (anaerobicTE != null)  corosMetrics.anaerobicTrainingEffect = anaerobicTE
      if (avgHR != null)        corosMetrics.avgHR = avgHR
      if (maxHR != null)        corosMetrics.maxHR = maxHR
      if (distanceMeters != null) corosMetrics.distanceMeters = distanceMeters

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
      }

      const teLabel = aerobicTE != null ? ` ATE:${aerobicTE.toFixed(1)} ANTE:${(anaerobicTE ?? 0).toFixed(1)}` : ''
      console.log(`  ✓ ${dryRun ? '[dry] ' : ''}${category}/${subtype} on ${dateStr} ${durationMinutes}m${teLabel}`)

      if (!dryRun) {
        await writeSession(user, session)
        existingKeys.add(key) // prevent intra-file duplicates
      }

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
    console.log(`\nUnmapped activity types (add to COROS_ACTIVITY_MAP if needed):`)
    for (const t of unmappedTypes) console.log(`  - "${t}"`)
  }

  if (dryRun) console.log('\n[DRY RUN — nothing was written to Firestore]')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

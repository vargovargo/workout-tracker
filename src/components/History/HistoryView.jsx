import React, { useState, useRef } from 'react'
import { useApp } from '../../App.jsx'
import { getWeekKey, toDateString } from '../../utils/weekUtils.js'
import { FITNESS_CONFIG } from '../../config.js'
import WeekNavigator from './WeekNavigator.jsx'
import SessionCard from './SessionCard.jsx'
import EditSessionModal from '../shared/EditSessionModal.jsx'

// ─── Coros CSV import helpers ─────────────────────────────────────────────────

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

function parseCSVRow(line) {
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

function findCol(row, ...candidates) {
  for (const c of candidates) {
    const key = Object.keys(row).find((k) => k === c || k.startsWith(c))
    if (key !== undefined && row[key] !== '') return row[key]
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

function dedupKey(dateStr, category, durationMinutes) {
  return `${dateStr}::${category}::${Math.round(durationMinutes)}`
}

function parseCorosCSV(text, existingSessions) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) throw new Error('CSV has fewer than 2 lines')

  const headers = parseCSVRow(lines[0]).map((h) => h.trim().toLowerCase())

  // Build dedup set from existing sessions
  const existingKeys = new Set(
    existingSessions.map((s) => {
      const d = new Date(s.occurredAt || s.loggedAt)
      return dedupKey(toDateString(d), s.category, s.durationMinutes || 0)
    })
  )

  const toImport = []
  const skipped = { duplicate: 0, unmapped: 0, error: 0 }
  const unmappedTypes = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVRow(lines[i])
    if (values.every((v) => v.trim() === '')) continue

    const row = {}
    headers.forEach((h, idx) => { row[h] = (values[idx] ?? '').trim() })

    try {
      const activityName = findCol(row, 'activity name', 'title', 'name', 'sport', 'activity type', 'type')
      if (!activityName) { skipped.error++; continue }

      const mapping = COROS_ACTIVITY_MAP[activityName.toLowerCase().trim()]
      if (!mapping) {
        if (!unmappedTypes.includes(activityName)) unmappedTypes.push(activityName)
        skipped.unmapped++
        continue
      }

      const rawDate = findCol(row, 'start time', 'date', 'activity date', 'time')
      if (!rawDate) { skipped.error++; continue }
      const date = new Date(rawDate.replace(' ', 'T'))
      if (isNaN(date.getTime())) { skipped.error++; continue }

      const rawMins = parseDuration(row)
      if (!rawMins || rawMins < 1) { skipped.error++; continue }
      const durationMinutes = Math.round(rawMins)

      const { category, subtype } = mapping
      const dateStr = toDateString(date)
      const key = dedupKey(dateStr, category, durationMinutes)

      if (existingKeys.has(key)) { skipped.duplicate++; continue }
      existingKeys.add(key) // prevent intra-file duplicates

      const aerobicTE  = parseNum(row, 'aerobic training effect', 'aerobic te', 'aerobic effect')
      const anaerobicTE = parseNum(row, 'anaerobic training effect', 'anaerobic te', 'anaerobic effect')
      const avgHR      = parseNum(row, 'avg hr', 'average heart rate', 'avg heart rate')
      const maxHR      = parseNum(row, 'max hr', 'max heart rate', 'maximum heart rate')
      const distanceM  = parseNum(row, 'distance (m)', 'distance(m)', 'distance m', 'distance')

      const corosMetrics = {}
      if (aerobicTE != null)   corosMetrics.aerobicTrainingEffect = aerobicTE
      if (anaerobicTE != null) corosMetrics.anaerobicTrainingEffect = anaerobicTE
      if (avgHR != null)       corosMetrics.avgHR = avgHR
      if (maxHR != null)       corosMetrics.maxHR = maxHR
      if (distanceM != null)   corosMetrics.distanceMeters = distanceM

      toImport.push({
        category,
        subtype,
        durationMinutes,
        occurredAt: date.toISOString(),
        loggedAt: new Date().toISOString(),
        source: 'coros',
        ...(Object.keys(corosMetrics).length > 0 ? { corosMetrics } : {}),
      })
    } catch {
      skipped.error++
    }
  }

  return { toImport, skipped, unmappedTypes }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HistoryView() {
  const { getSessionsForWeek, deleteSession, updateSession, sessions: allSessions, currentUser, setTab, report, openAdvisor, addSession } = useApp()
  const [weekKey, setWeekKey] = useState(getWeekKey())
  const [editingSession, setEditingSession] = useState(null)
  const [importStatus, setImportStatus] = useState(null) // { imported, skipped, unmapped }
  const fileInputRef = useRef(null)

  const sessions = getSessionsForWeek(weekKey)
  const sorted = [...sessions].sort(
    (a, b) =>
      new Date(b.occurredAt || b.loggedAt) - new Date(a.occurredAt || a.loggedAt)
  )

  const groups = []
  let lastDate = null
  for (const s of sorted) {
    const d = toDateString(new Date(s.occurredAt || s.loggedAt))
    if (d !== lastDate) { groups.push({ date: d, items: [] }); lastDate = d }
    groups.at(-1).items.push(s)
  }

  function exportCSV() {
    const headers = ['Date', 'Time', 'Category', 'Subtype', 'Duration (min)', 'Notes', 'Logged At']
    const rows = [...allSessions]
      .sort((a, b) => new Date(b.occurredAt || b.loggedAt) - new Date(a.occurredAt || a.loggedAt))
      .map((s) => {
        const dt = new Date(s.occurredAt || s.loggedAt)
        return [
          toDateString(dt),
          dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          FITNESS_CONFIG[s.category]?.label || s.category,
          s.subtype || '',
          s.durationMinutes || '',
          (s.notes || '').replace(/"/g, '""'),
          toDateString(new Date(s.loggedAt)),
        ].map((v) => `"${v}"`).join(',')
      })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fitness-${currentUser}-${toDateString(new Date())}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDelete(id) {
    if (window.confirm('Delete this activity?')) {
      deleteSession(id)
    }
  }

  function handleImportClick() {
    setImportStatus(null)
    fileInputRef.current?.click()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset so the same file can be re-imported if needed

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target.result
        const { toImport, skipped, unmappedTypes } = parseCorosCSV(text, allSessions)

        for (const sessionData of toImport) {
          addSession(sessionData)
        }

        setImportStatus({
          imported: toImport.length,
          duplicate: skipped.duplicate,
          unmapped: skipped.unmapped,
          error: skipped.error,
          unmappedTypes,
        })
      } catch (err) {
        setImportStatus({ parseError: err.message })
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="pb-6 slide-up">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">History</h2>
        <div className="flex items-center gap-2">
          {report && (
            <button
              onClick={openAdvisor}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 active:opacity-70"
            >
              <span className="text-sm">🤖</span>
              <span className="text-xs font-medium text-slate-300">AI Rec</span>
            </button>
          )}
          <button
            onClick={() => setTab('log')}
            className="flex items-center gap-1.5 bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full active:opacity-80 transition-opacity"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Log Activity
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs text-slate-400 active:text-slate-200 transition-colors"
            aria-label="Export CSV"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-1.5 text-xs text-slate-400 active:text-slate-200 transition-colors"
            aria-label="Import Coros CSV"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 14 12 9 17 14" />
              <line x1="12" y1="9" x2="12" y2="21" />
            </svg>
            Coros
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Import result banner */}
      {importStatus && (
        <div className="mx-4 mb-3 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs">
          {importStatus.parseError ? (
            <p className="text-red-400">Parse error: {importStatus.parseError}</p>
          ) : (
            <>
              <p className="text-slate-300 font-medium mb-1">
                Coros import complete
              </p>
              <p className="text-slate-400">
                {importStatus.imported} imported
                {importStatus.duplicate > 0 ? ` · ${importStatus.duplicate} duplicate${importStatus.duplicate !== 1 ? 's' : ''} skipped` : ''}
                {importStatus.unmapped > 0 ? ` · ${importStatus.unmapped} unmapped` : ''}
                {importStatus.error > 0 ? ` · ${importStatus.error} error${importStatus.error !== 1 ? 's' : ''}` : ''}
              </p>
              {importStatus.unmappedTypes?.length > 0 && (
                <p className="text-slate-500 mt-1">
                  Unknown types: {importStatus.unmappedTypes.join(', ')}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <WeekNavigator weekKey={weekKey} onWeekChange={setWeekKey} />

      <div className="px-4 flex flex-col gap-3">
        {sorted.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🏋️</p>
            <p className="text-slate-400 text-sm">No activity logged this week.</p>
          </div>
        ) : (
          groups.map(({ date, items }) => (
            <div key={date}>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 pt-2 pb-1 px-1">
                {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <div className="flex flex-col gap-3">
                {items.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onEdit={setEditingSession}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          onSave={(updates) => {
            updateSession(editingSession.id, updates)
            setEditingSession(null)
          }}
          onClose={() => setEditingSession(null)}
        />
      )}
    </div>
  )
}

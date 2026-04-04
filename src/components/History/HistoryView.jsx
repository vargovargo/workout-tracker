import React, { useState } from 'react'
import { useApp } from '../../App.jsx'
import { getWeekKey, toDateString } from '../../utils/weekUtils.js'
import { FITNESS_CONFIG } from '../../config.js'
import WeekNavigator from './WeekNavigator.jsx'
import SessionCard from './SessionCard.jsx'
import EditSessionModal from '../shared/EditSessionModal.jsx'

export default function HistoryView() {
  const { getSessionsForWeek, deleteSession, updateSession, sessions: allSessions, currentUser, setTab, report, openAdvisor } = useApp()
  const [weekKey, setWeekKey] = useState(getWeekKey())
  const [editingSession, setEditingSession] = useState(null)

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
        </div>
      </div>

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

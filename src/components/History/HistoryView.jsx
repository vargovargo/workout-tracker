import React, { useState } from 'react'
import { useApp } from '../../App.jsx'
import { getWeekKey, toDateString } from '../../utils/weekUtils.js'
import WeekNavigator from './WeekNavigator.jsx'
import SessionCard from './SessionCard.jsx'
import EditSessionModal from '../shared/EditSessionModal.jsx'

export default function HistoryView() {
  const { getSessionsForWeek, deleteSession, updateSession } = useApp()
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

  function handleDelete(id) {
    if (window.confirm('Delete this workout?')) {
      deleteSession(id)
    }
  }

  return (
    <div className="pb-6 slide-up">
      <div className="px-4 pt-5 pb-1">
        <h2 className="text-xl font-bold text-white">History</h2>
      </div>

      <WeekNavigator weekKey={weekKey} onWeekChange={setWeekKey} />

      <div className="px-4 flex flex-col gap-3">
        {sorted.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🏋️</p>
            <p className="text-slate-400 text-sm">No workouts logged this week.</p>
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

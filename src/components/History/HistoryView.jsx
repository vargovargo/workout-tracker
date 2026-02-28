import React, { useState } from 'react'
import { useApp } from '../../App.jsx'
import { getWeekKey } from '../../utils/weekUtils.js'
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
          sorted.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onEdit={setEditingSession}
              onDelete={handleDelete}
            />
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

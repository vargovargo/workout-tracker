import React, { useState } from 'react'
import { useApp } from '../../App.jsx'
import { toDateString } from '../../utils/weekUtils.js'
import WeekHeader from './WeekHeader.jsx'
import StreakDisplay from './StreakDisplay.jsx'
import SuggestionBanner from './SuggestionBanner.jsx'
import WeeklyRings from './WeeklyRings.jsx'
import MinutesByDayChart from './MinutesByDayChart.jsx'
import WeekMinutesChart from './WeekMinutesChart.jsx'
import EditSessionModal from '../shared/EditSessionModal.jsx'

export default function DashboardView() {
  const { currentWeekKey, currentWeekSessions, streak, sessions, updateSession } = useApp()
  const [editingSession, setEditingSession] = useState(null)

  const sevenDaysAgoStr = toDateString(new Date(Date.now() - 6 * 864e5))
  const todayStr = toDateString(new Date())
  const lastSevenDaysSessions = sessions.filter((s) => {
    const d = toDateString(new Date(s.occurredAt || s.loggedAt))
    return d >= sevenDaysAgoStr && d <= todayStr
  })

  return (
    <div className="pb-6 slide-up">
      <WeekHeader weekKey={currentWeekKey} />
      <StreakDisplay
        weeklyStreak={streak.weeklyStreak}
        activeDayStreak={streak.activeDayStreak}
      />
      <WeekMinutesChart weekSessions={lastSevenDaysSessions} onEdit={setEditingSession} />
      <SuggestionBanner weekSessions={currentWeekSessions} />
      <WeeklyRings weekSessions={currentWeekSessions} />
      <MinutesByDayChart sessions={lastSevenDaysSessions} onEdit={setEditingSession} />

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

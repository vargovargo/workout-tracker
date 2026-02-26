import React from 'react'
import { useApp } from '../../App.jsx'
import WeekHeader from './WeekHeader.jsx'
import StreakDisplay from './StreakDisplay.jsx'
import SuggestionBanner from './SuggestionBanner.jsx'
import WeeklyRings from './WeeklyRings.jsx'
import MinutesByDayChart from './MinutesByDayChart.jsx'
import WeekMinutesChart from './WeekMinutesChart.jsx'

export default function DashboardView() {
  const { currentWeekKey, currentWeekSessions, streak } = useApp()

  return (
    <div className="pb-6 slide-up">
      <WeekHeader weekKey={currentWeekKey} />
      <StreakDisplay
        weeklyStreak={streak.weeklyStreak}
        activeDayStreak={streak.activeDayStreak}
      />
      <SuggestionBanner weekSessions={currentWeekSessions} />
      <WeeklyRings weekSessions={currentWeekSessions} />
      <MinutesByDayChart
        weekKey={currentWeekKey}
        weekSessions={currentWeekSessions}
      />
      <WeekMinutesChart weekSessions={currentWeekSessions} />
    </div>
  )
}

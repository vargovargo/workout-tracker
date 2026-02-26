import React from 'react'
import { useApp } from '../../App.jsx'
import WeekHeader from './WeekHeader.jsx'
import ProgressGrid from './ProgressGrid.jsx'
import StreakDisplay from './StreakDisplay.jsx'
import SuggestionBanner from './SuggestionBanner.jsx'
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
      <div className="mt-3">
        <ProgressGrid weekSessions={currentWeekSessions} />
      </div>
      <MinutesByDayChart
        weekKey={currentWeekKey}
        weekSessions={currentWeekSessions}
      />
      <WeekMinutesChart weekSessions={currentWeekSessions} />
      <SuggestionBanner weekSessions={currentWeekSessions} />
    </div>
  )
}

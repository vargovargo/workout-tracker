import React, { useState, createContext, useContext, useCallback } from 'react'
import { useWorkouts } from './hooks/useWorkouts.js'
import { useStreak } from './hooks/useStreak.js'
import { WORKOUT_CONFIG } from './config.js'
import { getWeekKey } from './utils/weekUtils.js'
import { fetchCelebrationGif, fireBigConfetti, fireSmallConfetti } from './utils/celebrationUtils.js'
import BottomNav from './components/BottomNav.jsx'
import DashboardView from './components/Dashboard/DashboardView.jsx'
import LogView from './components/Log/LogView.jsx'
import HistoryView from './components/History/HistoryView.jsx'
import ActiveSessionBanner from './components/shared/ActiveSessionBanner.jsx'
import CelebrationModal from './components/shared/CelebrationModal.jsx'

export const AppContext = createContext(null)

export function useApp() {
  return useContext(AppContext)
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const workouts = useWorkouts()
  const streak = useStreak(workouts.sessions)
  const [celebration, setCelebration] = useState(null) // { gif, big }

  const currentWeekKey = getWeekKey()
  const currentWeekSessions = workouts.getSessionsForWeek(currentWeekKey)

  const checkCelebration = useCallback(
    async (newSession) => {
      const weekSessions = workouts.getSessionsForWeek(newSession.weekKey)
      // Include the new session
      const all = [...weekSessions.filter((s) => s.id !== newSession.id), newSession]

      // Check week complete
      const weekComplete = Object.entries(WORKOUT_CONFIG).every(([key, cfg]) => {
        return all.filter((s) => s.category === key).length >= cfg.weeklyTarget
      })

      // Check category milestone
      const catCount = all.filter((s) => s.category === newSession.category).length
      const catTarget = WORKOUT_CONFIG[newSession.category]?.weeklyTarget
      const catMilestone = catCount === catTarget

      if (weekComplete) {
        fireBigConfetti()
        const gif = await fetchCelebrationGif(true)
        setCelebration({ gif, big: true })
      } else if (catMilestone) {
        fireSmallConfetti()
        const gif = await fetchCelebrationGif(false)
        setCelebration({ gif, big: false })
      }
    },
    [workouts]
  )

  const handleSessionSaved = useCallback(
    (session) => {
      checkCelebration(session)
      setTab('dashboard')
    },
    [checkCelebration]
  )

  const ctx = {
    ...workouts,
    streak,
    currentWeekKey,
    currentWeekSessions,
    setTab,
    onSessionSaved: handleSessionSaved,
  }

  return (
    <AppContext.Provider value={ctx}>
      <div className="flex flex-col h-[100dvh] bg-slate-900 text-white overflow-hidden">
        {/* Safe area top padding */}
        <div style={{ paddingTop: 'var(--safe-top)' }} />

        {/* Active session banner */}
        {workouts.activeSession && <ActiveSessionBanner />}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overscroll-none">
          {tab === 'dashboard' && <DashboardView />}
          {tab === 'log' && <LogView />}
          {tab === 'history' && <HistoryView />}
        </main>

        {/* Bottom nav */}
        <BottomNav activeTab={tab} onTabChange={setTab} />
      </div>

      {/* Celebration overlay */}
      {celebration && (
        <CelebrationModal
          gif={celebration.gif}
          big={celebration.big}
          onClose={() => setCelebration(null)}
        />
      )}
    </AppContext.Provider>
  )
}

import React, { useState, createContext, useContext, useCallback } from 'react'
import { useWorkouts } from './hooks/useWorkouts.js'
import { useStreak } from './hooks/useStreak.js'
import { useSettings } from './hooks/useSettings.js'
import { WORKOUT_CONFIG } from './config.js'
import { getWeekKey } from './utils/weekUtils.js'
import { getCategoryProgress } from './utils/progressUtils.js'
import { fetchCelebrationGif, fireBigConfetti, fireSmallConfetti } from './utils/celebrationUtils.js'
import BottomNav from './components/BottomNav.jsx'
import UserSelector, { loadLastUser, saveLastUser } from './components/UserSelector.jsx'
import DashboardView from './components/Dashboard/DashboardView.jsx'
import LogView from './components/Log/LogView.jsx'
import HistoryView from './components/History/HistoryView.jsx'
import CelebrationModal from './components/shared/CelebrationModal.jsx'
import SettingsModal from './components/shared/SettingsModal.jsx'

export const AppContext = createContext(null)

export function useApp() {
  return useContext(AppContext)
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [currentUser, setCurrentUser] = useState(loadLastUser)
  const [showSettings, setShowSettings] = useState(false)
  const workouts = useWorkouts(currentUser)
  const { settings, updateSetting } = useSettings(currentUser)
  const streak = useStreak(workouts.sessions, currentUser, settings)
  const [celebration, setCelebration] = useState(null)

  const currentWeekKey = getWeekKey()
  const currentWeekSessions = workouts.getSessionsForWeek(currentWeekKey)

  function handleUserChange(user) {
    setCurrentUser(user)
    saveLastUser(user)
    setTab('dashboard')
  }

  const checkCelebration = useCallback(
    async (newSession) => {
      const weekSessions = workouts.getSessionsForWeek(newSession.weekKey)
      const all = [...weekSessions.filter((s) => s.id !== newSession.id), newSession]

      const weekComplete = Object.keys(WORKOUT_CONFIG).every((key) => {
        const { value, target } = getCategoryProgress(all, key, settings)
        return value >= target
      })

      const { value, target } = getCategoryProgress(all, newSession.category, settings)
      const catMilestone = value === target && target > 0

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
    [workouts, settings]
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
    settings,
    updateSetting,
    currentUser,
    currentWeekKey,
    currentWeekSessions,
    setTab,
    onSessionSaved: handleSessionSaved,
    openSettings: () => setShowSettings(true),
  }

  return (
    <AppContext.Provider value={ctx}>
      <div className="flex flex-col h-[100dvh] bg-slate-900 text-white overflow-hidden">
        <div style={{ paddingTop: 'var(--safe-top)' }} />

        <UserSelector
          currentUser={currentUser}
          onUserChange={handleUserChange}
          onOpenSettings={() => setShowSettings(true)}
        />

        <main className="flex-1 overflow-y-auto overscroll-none">
          {tab === 'dashboard' && <DashboardView />}
          {tab === 'log' && <LogView />}
          {tab === 'history' && <HistoryView />}
        </main>

        <BottomNav activeTab={tab} onTabChange={setTab} />
      </div>

      {celebration && (
        <CelebrationModal
          gif={celebration.gif}
          big={celebration.big}
          onClose={() => setCelebration(null)}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </AppContext.Provider>
  )
}

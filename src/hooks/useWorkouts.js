import { useState, useCallback } from 'react'
import { getWeekKey } from '../utils/weekUtils.js'

const SESSIONS_KEY = 'workout_sessions'
const ACTIVE_KEY = 'active_session'

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

function loadActive() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null')
  } catch {
    return null
  }
}

function saveActive(active) {
  if (active === null) {
    localStorage.removeItem(ACTIVE_KEY)
  } else {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(active))
  }
}

export function useWorkouts() {
  const [sessions, setSessions] = useState(loadSessions)
  const [activeSession, setActiveSessionState] = useState(loadActive)

  const addSession = useCallback((sessionData) => {
    // Use occurredAt if provided (retroactive), otherwise loggedAt, for week assignment
    const dateForWeek = sessionData.occurredAt || sessionData.loggedAt || new Date().toISOString()
    const newSession = {
      id: crypto.randomUUID(),
      weekKey: getWeekKey(new Date(dateForWeek)),
      ...sessionData,
    }
    setSessions((prev) => {
      const updated = [...prev, newSession]
      saveSessions(updated)
      return updated
    })
    return newSession
  }, [])

  const updateSession = useCallback((id, updates) => {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      saveSessions(updated)
      return updated
    })
  }, [])

  const deleteSession = useCallback((id) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      saveSessions(updated)
      return updated
    })
  }, [])

  const startSession = useCallback((category, subtype) => {
    const active = {
      category,
      subtype: subtype || undefined,
      startedAt: new Date().toISOString(),
    }
    saveActive(active)
    setActiveSessionState(active)
  }, [])

  const finishSession = useCallback(
    (durationMinutes, notes) => {
      if (!activeSession) return null
      const now = new Date().toISOString()
      const session = addSession({
        category: activeSession.category,
        subtype: activeSession.subtype,
        startTime: activeSession.startedAt,
        endTime: now,
        durationMinutes,
        notes: notes || undefined,
        loggedAt: now,
      })
      saveActive(null)
      setActiveSessionState(null)
      return session
    },
    [activeSession, addSession]
  )

  const clearActiveSession = useCallback(() => {
    saveActive(null)
    setActiveSessionState(null)
  }, [])

  const logRetroactive = useCallback(
    (category, subtype, durationMinutes, notes, occurredAt) => {
      const now = new Date().toISOString()
      return addSession({
        category,
        subtype: subtype || undefined,
        durationMinutes,
        notes: notes || undefined,
        loggedAt: now,
        occurredAt: occurredAt || undefined,
      })
    },
    [addSession]
  )

  const getSessionsForWeek = useCallback(
    (weekKey) => sessions.filter((s) => s.weekKey === weekKey),
    [sessions]
  )

  const getAllWeekKeys = useCallback(() => {
    const keys = new Set(sessions.map((s) => s.weekKey))
    return Array.from(keys).sort().reverse()
  }, [sessions])

  return {
    sessions,
    activeSession,
    addSession,
    updateSession,
    deleteSession,
    startSession,
    finishSession,
    clearActiveSession,
    logRetroactive,
    getSessionsForWeek,
    getAllWeekKeys,
  }
}

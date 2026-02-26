import { useState, useCallback, useEffect } from 'react'
import { getWeekKey } from '../utils/weekUtils.js'

function sessionsKey(user) { return `${user}:workout_sessions` }
function activeKey(user)   { return `${user}:active_session` }

function loadSessions(user) {
  try {
    return JSON.parse(localStorage.getItem(sessionsKey(user)) || '[]')
  } catch {
    return []
  }
}

function saveSessions(user, sessions) {
  localStorage.setItem(sessionsKey(user), JSON.stringify(sessions))
}

function loadActive(user) {
  try {
    return JSON.parse(localStorage.getItem(activeKey(user)) || 'null')
  } catch {
    return null
  }
}

function saveActive(user, active) {
  if (active === null) {
    localStorage.removeItem(activeKey(user))
  } else {
    localStorage.setItem(activeKey(user), JSON.stringify(active))
  }
}

export function useWorkouts(user) {
  const [sessions, setSessions] = useState(() => loadSessions(user))
  const [activeSession, setActiveSessionState] = useState(() => loadActive(user))

  // Reload data whenever the active user changes
  useEffect(() => {
    setSessions(loadSessions(user))
    setActiveSessionState(loadActive(user))
  }, [user])

  const addSession = useCallback((sessionData) => {
    const dateForWeek = sessionData.occurredAt || sessionData.loggedAt || new Date().toISOString()
    const newSession = {
      id: crypto.randomUUID(),
      weekKey: getWeekKey(new Date(dateForWeek)),
      ...sessionData,
    }
    setSessions((prev) => {
      const updated = [...prev, newSession]
      saveSessions(user, updated)
      return updated
    })
    return newSession
  }, [user])

  const updateSession = useCallback((id, updates) => {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      saveSessions(user, updated)
      return updated
    })
  }, [user])

  const deleteSession = useCallback((id) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      saveSessions(user, updated)
      return updated
    })
  }, [user])

  const startSession = useCallback((category, subtype) => {
    const active = {
      category,
      subtype: subtype || undefined,
      startedAt: new Date().toISOString(),
    }
    saveActive(user, active)
    setActiveSessionState(active)
  }, [user])

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
      saveActive(user, null)
      setActiveSessionState(null)
      return session
    },
    [user, activeSession, addSession]
  )

  const clearActiveSession = useCallback(() => {
    saveActive(user, null)
    setActiveSessionState(null)
  }, [user])

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

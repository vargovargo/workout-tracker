import { useState, useCallback, useEffect } from 'react'
import { getWeekKey } from '../utils/weekUtils.js'

function sessionsKey(user) { return `${user}:workout_sessions` }

function loadSessions(user) {
  try {
    let sessions = JSON.parse(localStorage.getItem(sessionsKey(user)) || '[]')
    // Migrate: 'climbing' category was renamed to 'strength'
    if (sessions.some((s) => s.category === 'climbing')) {
      sessions = sessions.map((s) =>
        s.category === 'climbing' ? { ...s, category: 'strength' } : s
      )
      saveSessions(user, sessions)
    }
    return sessions
  } catch {
    return []
  }
}

function saveSessions(user, sessions) {
  localStorage.setItem(sessionsKey(user), JSON.stringify(sessions))
}

export function useWorkouts(user) {
  const [sessions, setSessions] = useState(() => loadSessions(user))

  // Reload data whenever the active user changes
  useEffect(() => {
    setSessions(loadSessions(user))
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
    addSession,
    updateSession,
    deleteSession,
    logRetroactive,
    getSessionsForWeek,
    getAllWeekKeys,
  }
}

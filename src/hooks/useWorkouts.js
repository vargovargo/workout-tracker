import { useState, useCallback, useEffect, useRef } from 'react'
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import { getWeekKey } from '../utils/weekUtils.js'

function sessionsKey(user) { return `${user}:workout_sessions` }

// Firestore does not accept undefined values — omit any field that is undefined.
function stripUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}

function migrateSession(s) {
  // climbing was briefly its own top-level category
  if (s.category === 'climbing')    return { ...s, category: 'strength',   subtype: 'climbing' }
  // plyometrics and stretching merge into mobility
  if (s.category === 'plyometrics') return { ...s, category: 'mobility',   subtype: 'plyometrics' }
  if (s.category === 'stretching')  return { ...s, category: 'mobility',   subtype: 'stretching' }
  // team_sports moves to cardio; subtypes (basketball/soccer/frisbee) are unchanged
  if (s.category === 'team_sports') return { ...s, category: 'cardio' }
  return s
}

function migrateLocalSessions(sessions) {
  return sessions.map(migrateSession)
}

export function useWorkouts(user) {
  const [sessions, setSessions] = useState([])
  // Track which users we've already attempted a localStorage migration for,
  // so we only do it once per app session even if onSnapshot fires multiple times.
  const migratedUsers = useRef(new Set())

  useEffect(() => {
    let stale = false
    setSessions([])
    const colRef = collection(db, 'users', user, 'sessions')

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      if (stale) return
      const firestoreSessions = snapshot.docs.map((d) => d.data())

      // If Firestore is empty for this user and we haven't migrated yet,
      // upload any existing localStorage data so it isn't lost.
      if (firestoreSessions.length === 0 && !migratedUsers.current.has(user)) {
        migratedUsers.current.add(user)
        try {
          const local = JSON.parse(localStorage.getItem(sessionsKey(user)) || '[]')
          if (local.length > 0) {
            const migrated = migrateLocalSessions(local)
            migrated.forEach((s) => setDoc(doc(colRef, s.id), stripUndefined(s)))
            return // onSnapshot will fire again once uploads land
          }
        } catch {
          // localStorage unreadable — continue with empty state
        }
      }

      const migrated = migrateLocalSessions(firestoreSessions)
      // Write back any sessions whose category changed so the migration only runs once.
      snapshot.docs.forEach((d) => {
        const original = d.data()
        const updated = migrateSession(original)
        if (updated.category !== original.category) {
          setDoc(doc(colRef, updated.id), stripUndefined(updated))
        }
      })
      setSessions(migrated)
    })

    return () => { stale = true; unsubscribe() }
  }, [user])

  const addSession = useCallback((sessionData) => {
    const dateForWeek = sessionData.occurredAt || sessionData.loggedAt || new Date().toISOString()
    const newSession = {
      id: crypto.randomUUID(),
      weekKey: getWeekKey(new Date(dateForWeek)),
      ...sessionData,
    }
    const colRef = collection(db, 'users', user, 'sessions')
    setDoc(doc(colRef, newSession.id), stripUndefined(newSession))
    return newSession
  }, [user])

  const updateSession = useCallback((id, updates) => {
    const docRef = doc(db, 'users', user, 'sessions', id)
    updateDoc(docRef, stripUndefined(updates))
  }, [user])

  const deleteSession = useCallback((id) => {
    deleteDoc(doc(db, 'users', user, 'sessions', id))
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

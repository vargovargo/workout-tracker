import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import { WORKOUT_CONFIG } from '../config.js'

function getDefaults() {
  return Object.fromEntries(
    Object.entries(WORKOUT_CONFIG).map(([key, cfg]) => [
      key,
      { target: cfg.weeklyTarget, unit: 'sessions' },
    ])
  )
}

function migrateSettings(saved) {
  if (saved?.climbing) {
    saved = { ...saved, strength: saved.strength ?? saved.climbing }
    const { climbing: _, ...rest } = saved
    saved = rest
  }
  return { ...getDefaults(), ...saved }
}

export function useSettings(user) {
  const [settings, setSettings] = useState(getDefaults())
  const migratedUsers = useRef(new Set())

  useEffect(() => {
    setSettings(getDefaults())
    const docRef = doc(db, 'users', user, 'meta', 'settings')

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(migrateSettings(snapshot.data()))
      } else if (!migratedUsers.current.has(user)) {
        migratedUsers.current.add(user)
        // Firestore has no settings — try migrating from localStorage
        try {
          const saved = JSON.parse(localStorage.getItem(`${user}:settings`) || 'null')
          if (saved) {
            const migrated = migrateSettings(saved)
            setDoc(docRef, migrated)
            return // onSnapshot fires again once the write lands
          }
        } catch {
          // localStorage unreadable
        }
        setSettings(getDefaults())
      }
    })

    return unsubscribe
  }, [user])

  const updateSetting = useCallback(
    (category, field, value) => {
      setSettings((prev) => {
        const updated = { ...prev, [category]: { ...prev[category], [field]: value } }
        setDoc(doc(db, 'users', user, 'meta', 'settings'), updated)
        return updated
      })
    },
    [user]
  )

  return { settings, updateSetting }
}

import { useState, useEffect, useCallback } from 'react'
import { WORKOUT_CONFIG } from '../config.js'

function getDefaults() {
  return Object.fromEntries(
    Object.entries(WORKOUT_CONFIG).map(([key, cfg]) => [
      key,
      { target: cfg.weeklyTarget, unit: 'sessions' },
    ])
  )
}

function loadSettings(user) {
  try {
    const saved = JSON.parse(localStorage.getItem(`${user}:settings`) || 'null')
    if (!saved) return getDefaults()
    // Migrate: 'climbing' settings key was renamed to 'strength'
    if (saved.climbing) {
      saved.strength = saved.strength ?? saved.climbing
      delete saved.climbing
      localStorage.setItem(`${user}:settings`, JSON.stringify(saved))
    }
    return { ...getDefaults(), ...saved }
  } catch {
    return getDefaults()
  }
}

export function useSettings(user) {
  const [settings, setSettings] = useState(() => loadSettings(user))

  useEffect(() => {
    setSettings(loadSettings(user))
  }, [user])

  const updateSetting = useCallback(
    (category, field, value) => {
      setSettings((prev) => {
        const updated = { ...prev, [category]: { ...prev[category], [field]: value } }
        localStorage.setItem(`${user}:settings`, JSON.stringify(updated))
        return updated
      })
    },
    [user]
  )

  return { settings, updateSetting }
}

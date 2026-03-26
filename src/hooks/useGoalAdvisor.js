import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'

export function useGoalAdvisor(user) {
  const [report, setReport] = useState(null)

  useEffect(() => {
    if (!user) return
    const docRef = doc(db, 'users', user, 'meta', 'goalAdvisor')
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => { setReport(snap.exists() ? snap.data() : null) },
      (err) => { console.error('[useGoalAdvisor] Firestore listener error:', err) }
    )
    return unsubscribe
  }, [user])

  return report
}

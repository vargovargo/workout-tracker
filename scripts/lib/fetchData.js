/**
 * fetchData.js — fetches sessions and settings from Firestore for a given user
 * using the Firebase Admin SDK (service account credentials).
 */
import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { resolve } from 'path'

let initialized = false

function initAdmin() {
  if (initialized) return
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!credPath) throw new Error('GOOGLE_APPLICATION_CREDENTIALS env var not set.')
  const serviceAccount = JSON.parse(readFileSync(resolve(credPath), 'utf8'))
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  initialized = true
}

export async function fetchUserSessions(userId) {
  initAdmin()
  const db = admin.firestore()
  const snap = await db.collection('users').doc(userId).collection('sessions').get()
  return snap.docs.map((d) => d.data())
}

export async function fetchUserSettings(userId) {
  initAdmin()
  const db = admin.firestore()
  const doc = await db.collection('users').doc(userId).collection('meta').doc('settings').get()
  return doc.exists ? doc.data() : null
}

export async function writeUserSettings(userId, settings) {
  initAdmin()
  const db = admin.firestore()
  await db.collection('users').doc(userId).collection('meta').doc('settings').set(settings, { merge: true })
}

export async function fetchGoalAdvisorReport(userId) {
  initAdmin()
  const db = admin.firestore()
  const doc = await db.collection('users').doc(userId).collection('meta').doc('goalAdvisor').get()
  return doc.exists ? doc.data() : null
}

export async function writeSession(userId, session) {
  initAdmin()
  const db = admin.firestore()
  await db.collection('users').doc(userId).collection('sessions').doc(session.id).set(session)
}

export async function writeGoalAdvisorReport(userId, result, analysis) {
  initAdmin()
  const db = admin.firestore()
  await db.collection('users').doc(userId).collection('meta').doc('goalAdvisor').set({
    ...result,
    analysis: {
      categoryStats: analysis.categoryStats,
      secondaryAvg: analysis.secondaryAvg,
      acwr: analysis.acwr,
    },
    generatedAt: new Date().toISOString(),
  })
}

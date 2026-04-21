#!/usr/bin/env node
import 'dotenv/config'
import { fetchUserSessions, deleteSession } from './lib/fetchData.js'

const user = process.argv[2] || 'Jason'
const del = process.argv[3] // optional session id to delete

if (del) {
  await deleteSession(user, del)
  console.log(`Deleted session ${del} for ${user}`)
  process.exit(0)
}

const sessions = await fetchUserSessions(user)
const recent = sessions
  .filter(s => new Date(s.occurredAt || s.loggedAt) >= new Date('2026-04-18'))
  .sort((a, b) => new Date(b.occurredAt || b.loggedAt) - new Date(a.occurredAt || a.loggedAt))

for (const s of recent) {
  const d = new Date(s.occurredAt || s.loggedAt).toISOString().slice(0, 10)
  console.log(`${d}  ${s.category}/${s.subtype}  ${s.durationMinutes}m  src:${s.source || 'manual'}  id:${s.id}`)
}

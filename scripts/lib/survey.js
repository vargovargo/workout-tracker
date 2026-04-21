/**
 * survey.js — structured weekly check-in survey
 * Each question is a Likert scale with an optional free-text follow-up.
 */
import readline from 'readline'

const R    = '\x1b[0m'
const BOLD = '\x1b[1m'
const CYAN = '\x1b[36m'
const DIM  = '\x1b[2m'
const YELLOW = '\x1b[33m'
const GREEN  = '\x1b[32m'

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())))
}

function likert(rl, prompt, labels) {
  const labelStr = labels.map((l, i) => `${i + 1}=${l}`).join('  ')
  return ask(rl, `${BOLD}${prompt}${R}\n${DIM}${labelStr}${R}\n${GREEN}→ ${R}`)
}

function optional(rl, prompt) {
  return ask(rl, `${DIM}${prompt} (or Enter to skip)${R}\n${GREEN}→ ${R}`)
}

export async function runSurvey() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  console.log(`\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}`)
  console.log(`${BOLD}${CYAN}  Weekly Check-In${R}`)
  console.log(`${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}\n`)

  // Q1: Sleep
  const q1Raw = await likert(rl,
    '1. How has your sleep been this week?',
    ['poor', 'below avg', 'ok', 'good', 'great']
  )
  const q1Note = await optional(rl, '   Any notes on sleep?')

  // Q2: Body / recovery
  const q2Raw = await likert(rl,
    '\n2. How does your body feel right now?',
    ['wrecked', 'beat up', 'normal', 'fresh', 'great']
  )
  const q2Note = await optional(rl, '   Any specific soreness or injury to flag?')

  // Q3: Training
  const q3Raw = await likert(rl,
    '\n3. How did last week\'s training go?',
    ['much less than planned', 'a bit less', 'as planned', 'more than planned', 'crushed it']
  )
  const q3Note = await optional(rl, '   What worked or didn\'t?')

  // Q4: Upcoming context (text only)
  const q4Raw = await optional(rl,
    '\n4. Anything coming up that affects training?\n   (travel, event, big deadline, etc.)'
  )

  rl.close()

  const sleep    = Math.min(5, Math.max(1, parseInt(q1Raw) || 3))
  const recovery = Math.min(5, Math.max(1, parseInt(q2Raw) || 3))
  const training = Math.min(5, Math.max(1, parseInt(q3Raw) || 3))

  const injury    = q2Note || null
  const reflection = q3Note || null
  const context   = q4Raw  || null
  const sleepNote = q1Note || null

  return { sleep, recovery, training, injury, reflection, context, sleepNote }
}

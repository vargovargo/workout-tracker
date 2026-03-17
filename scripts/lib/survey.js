/**
 * survey.js — interactive 5-question CLI survey using readline
 * Returns structured survey responses.
 */
import readline from 'readline'

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()))
  })
}

const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const CYAN = '\x1b[36m'
const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'

export async function runSurvey() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  console.log(`\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`)
  console.log(`${BOLD}${CYAN}  Weekly Check-In${RESET}`)
  console.log(`${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`)
  console.log(`${YELLOW}Answer each question honestly — your responses are the`)
  console.log(`ground truth that shapes this week's recommendations.${RESET}\n`)

  const q1Raw = await ask(
    rl,
    `${BOLD}1. How did last week's training feel?${RESET}\n   1=too easy  2=manageable  3=just right  4=challenging  5=too hard\n${GREEN}→ ${RESET}`
  )

  const q2Raw = await ask(
    rl,
    `\n${BOLD}2. How is your energy and recovery right now?${RESET}\n   1=depleted  2=tired  3=normal  4=good  5=great\n${GREEN}→ ${RESET}`
  )

  const q3Raw = await ask(
    rl,
    `\n${BOLD}3. Any nagging pain or injury to flag?${RESET}\n   (type "n" if none, or briefly describe: e.g. "left knee soreness")\n${GREEN}→ ${RESET}`
  )

  const q4Raw = await ask(
    rl,
    `\n${BOLD}4. Which area do you most want to focus on this month?${RESET}\n   strength / cardio / mobility / mindfulness / balance\n${GREEN}→ ${RESET}`
  )

  const q5Raw = await ask(
    rl,
    `\n${BOLD}5. How should goals be adjusted this week?${RESET}\n   up = push harder  same = hold steady  down = make more attainable\n${GREEN}→ ${RESET}`
  )

  rl.close()

  const effort = Math.min(5, Math.max(1, parseInt(q1Raw) || 3))
  const energy = Math.min(5, Math.max(1, parseInt(q2Raw) || 3))
  const injury = q3Raw.toLowerCase() === 'n' ? null : q3Raw
  const focus = q4Raw.toLowerCase().trim()
  const q5 = q5Raw.toLowerCase().trim()
  const goalDirection = q5.startsWith('u') ? 'up' : q5.startsWith('d') ? 'down' : 'same'

  return { effort, energy, injury, focus, goalDirection }
}

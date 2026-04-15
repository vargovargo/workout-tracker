// ─── Secondary fitness attributes ────────────────────────────────────────────
// These cross-cut the four primary categories to reveal physiological imbalances
// that category counts alone cannot detect. See physio.md for full rationale.
export const SECONDARY_ATTRIBUTES = {
  aerobicBase: {
    label: 'Aerobic Base',
    icon: '🫀',
    description: 'Zone 2, fat oxidation, mitochondrial health',
    arcColor: '#f59e0b', // amber
  },
  peakOutput: {
    label: 'Peak Output',
    icon: '⚡',
    description: 'Zone 5, VO2 max, anaerobic capacity',
    arcColor: '#f43f5e', // rose
  },
  structural: {
    label: 'Structural',
    icon: '🏗️',
    description: 'Stability, balance, proprioception, movement quality',
    arcColor: '#2dd4bf', // teal
  },
  restoration: {
    label: 'Restoration',
    icon: '🌊',
    description: 'Parasympathetic recovery, tissue repair, HRV',
    arcColor: '#818cf8', // indigo
  },
}

// Per-activity secondary attribute scores (0–3 each).
// Keyed as ACTIVITY_SECONDARY_SCORES[category][subtype].
// Category-level fallback used when no subtype is recorded.
export const ACTIVITY_SECONDARY_SCORES = {
  strength: {
    _default: { aerobicBase: 0, peakOutput: 2, structural: 1, restoration: 1 },
    climbing:  { aerobicBase: 1, peakOutput: 3, structural: 2, restoration: 0 },
    weights:   { aerobicBase: 0, peakOutput: 3, structural: 1, restoration: 1 },
    HIIT:      { aerobicBase: 1, peakOutput: 3, structural: 1, restoration: 0 },
    core:      { aerobicBase: 0, peakOutput: 2, structural: 3, restoration: 1 },
  },
  cardio: {
    _default:       { aerobicBase: 2, peakOutput: 2, structural: 0, restoration: 0 },
    run:            { aerobicBase: 3, peakOutput: 1, structural: 0, restoration: 0 },
    'trail run':    { aerobicBase: 3, peakOutput: 2, structural: 2, restoration: 0 },
    bike:           { aerobicBase: 3, peakOutput: 1, structural: 0, restoration: 0 },
    commute:        { aerobicBase: 1, peakOutput: 0, structural: 0, restoration: 1 },
    row:            { aerobicBase: 3, peakOutput: 2, structural: 1, restoration: 0 },
    swimming:       { aerobicBase: 3, peakOutput: 2, structural: 1, restoration: 1 },
    basketball:     { aerobicBase: 2, peakOutput: 2, structural: 1, restoration: 0 },
    soccer:         { aerobicBase: 2, peakOutput: 2, structural: 1, restoration: 0 },
    frisbee:        { aerobicBase: 1, peakOutput: 1, structural: 2, restoration: 0 },
    surfing:        { aerobicBase: 1, peakOutput: 2, structural: 3, restoration: 1 },
    hike:           { aerobicBase: 3, peakOutput: 1, structural: 3, restoration: 1 },
    'Orange Theory': { aerobicBase: 1, peakOutput: 3, structural: 0, restoration: 0 },
  },
  mobility: {
    _default:    { aerobicBase: 0, peakOutput: 0, structural: 2, restoration: 2 },
    plyometrics: { aerobicBase: 1, peakOutput: 3, structural: 2, restoration: 0 },
    yoga:        { aerobicBase: 0, peakOutput: 0, structural: 2, restoration: 3 },
    stretching:  { aerobicBase: 0, peakOutput: 0, structural: 1, restoration: 3 },
    balance:     { aerobicBase: 0, peakOutput: 0, structural: 3, restoration: 2 },
  },
  mindfulness: {
    _default:    { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 3 },
    meditation:  { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 3 },
    breathing:   { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 3 },
    journaling:  { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 2 },
    reading:     { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 2 },
    sauna:       { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 3 },
    'brain spa': { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 3 },
  },
}

// Returns secondary scores for a single session object.
export function getSecondaryScores(session) {
  const catScores = ACTIVITY_SECONDARY_SCORES[session.category]
  if (!catScores) return { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 0 }
  return catScores[session.subtype] || catScores._default
}

// Sums secondary scores across an array of sessions.
export function sumSecondaryScores(sessions) {
  const totals = { aerobicBase: 0, peakOutput: 0, structural: 0, restoration: 0 }
  for (const s of sessions) {
    const scores = getSecondaryScores(s)
    for (const key of Object.keys(totals)) totals[key] += scores[key]
  }
  return totals
}

// ─── Primary fitness categories ───────────────────────────────────────────────
export const FITNESS_CONFIG = {
  strength: {
    label: 'Strength',
    icon: '💪',
    weeklyTarget: 3,
    subtypes: ['climbing', 'weights', 'HIIT', 'core'],
    subtypeIcons: { climbing: '🧗', weights: '🏋️', HIIT: '💥', core: '🎯' },
    color: 'blue',
    accentClass: 'text-blue-400',
    bgClass: 'bg-blue-400/10',
    borderClass: 'border-blue-400/30',
    arcColor: '#60a5fa',
  },
  cardio: {
    label: 'Cardio',
    icon: '🏃',
    weeklyTarget: 3,
    subtypes: ['run', 'trail run', 'bike', 'commute', 'row', 'swimming', 'basketball', 'soccer', 'frisbee', 'surfing', 'hike', 'Orange Theory'],
    subtypeIcons: { run: '🏃', 'trail run': '🏔️', bike: '🚴', commute: '🏙️', row: '🚣', swimming: '🏊', basketball: '🏀', soccer: '⚽', frisbee: '🥏', surfing: '🏄', hike: '🥾', 'Orange Theory': '🔶' },
    color: 'cyan',
    accentClass: 'text-cyan-400',
    bgClass: 'bg-cyan-400/10',
    borderClass: 'border-cyan-400/30',
    arcColor: '#22d3ee',
  },
  mobility: {
    label: 'Mobility',
    icon: '🤸',
    weeklyTarget: 3,
    subtypes: ['plyometrics', 'yoga', 'stretching', 'balance'],
    subtypeIcons: { plyometrics: '⚡', yoga: '🕉️', stretching: '🙆', balance: '⚖️' },
    color: 'emerald',
    accentClass: 'text-emerald-400',
    bgClass: 'bg-emerald-400/10',
    borderClass: 'border-emerald-400/30',
    arcColor: '#34d399',
  },
  mindfulness: {
    label: 'Mindfulness',
    icon: '🧘',
    weeklyTarget: 3,
    subtypes: ['meditation', 'breathing', 'journaling', 'reading', 'sauna', 'brain spa'],
    subtypeIcons: { meditation: '🕯️', breathing: '💨', journaling: '📓', reading: '📚', sauna: '🧖', 'brain spa': '🧠' },
    color: 'purple',
    accentClass: 'text-purple-400',
    bgClass: 'bg-purple-400/10',
    borderClass: 'border-purple-400/30',
    arcColor: '#a78bfa',
  },
}

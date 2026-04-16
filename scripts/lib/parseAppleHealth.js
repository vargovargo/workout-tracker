/**
 * parseAppleHealth.js — streaming parser for Apple Health export.xml
 *
 * Streams line-by-line using readline to handle multi-GB exports.
 * Only keeps records from the last 30 days to bound memory usage.
 *
 * Returns:
 *   { heartRateSamples, restingHR, hrv, workouts }
 */

import { createReadStream } from 'fs'
import { createInterface } from 'readline'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

// HKWorkoutActivityType → { category, subtype }
const WORKOUT_TYPE_MAP = {
  HKWorkoutActivityTypeRunning:                    { category: 'cardio',      subtype: 'run' },
  HKWorkoutActivityTypeTrailRunning:               { category: 'cardio',      subtype: 'trail run' },
  HKWorkoutActivityTypeCycling:                    { category: 'cardio',      subtype: 'bike' },
  HKWorkoutActivityTypeRowing:                     { category: 'cardio',      subtype: 'row' },
  HKWorkoutActivityTypeSwimming:                   { category: 'cardio',      subtype: 'swimming' },
  HKWorkoutActivityTypeBasketball:                 { category: 'cardio',      subtype: 'basketball' },
  HKWorkoutActivityTypeSoccer:                     { category: 'cardio',      subtype: 'soccer' },
  HKWorkoutActivityTypeDiscSports:                 { category: 'cardio',      subtype: 'frisbee' },
  HKWorkoutActivityTypeSurfingSports:              { category: 'cardio',      subtype: 'surfing' },
  HKWorkoutActivityTypeHiking:                     { category: 'cardio',      subtype: 'hike' },
  HKWorkoutActivityTypeTraditionalStrengthTraining:{ category: 'strength',    subtype: 'weights' },
  HKWorkoutActivityTypeFunctionalStrengthTraining: { category: 'strength',    subtype: 'core' },
  HKWorkoutActivityTypeCoreTraining:               { category: 'strength',    subtype: 'core' },
  HKWorkoutActivityTypeHighIntensityIntervalTraining: { category: 'strength', subtype: 'HIIT' },
  HKWorkoutActivityTypeClimbing:                   { category: 'strength',    subtype: 'climbing' },
  HKWorkoutActivityTypeYoga:                       { category: 'mobility',    subtype: 'yoga' },
  HKWorkoutActivityTypePilates:                    { category: 'mobility',    subtype: 'stretching' },
  HKWorkoutActivityTypeFlexibility:                { category: 'mobility',    subtype: 'stretching' },
  HKWorkoutActivityTypeMindAndBody:                { category: 'mindfulness', subtype: 'meditation' },
  HKWorkoutActivityTypeMeditation:                 { category: 'mindfulness', subtype: 'meditation' },
}

/**
 * Extract an attribute value from an XML element string using regex.
 * Apple Health XML puts all attributes inline on a single line.
 */
function attr(line, name) {
  const match = line.match(new RegExp(`${name}="([^"]*)"`, ))
  return match ? match[1] : null
}

/**
 * Parse a date string from Apple Health (format: "YYYY-MM-DD HH:MM:SS ±HHMM")
 * Returns a Date object or null.
 */
function parseDate(str) {
  if (!str) return null
  // Replace the space before timezone offset with nothing — Date constructor handles it
  return new Date(str)
}

/**
 * Stream-parse an Apple Health export.xml file.
 * Only records from the last 30 days are kept.
 *
 * @param {string} filePath - Absolute path to export.xml
 * @returns {Promise<{heartRateSamples: Array, restingHR: Array, hrv: Array, workouts: Array}>}
 */
export async function parseAppleHealth(filePath) {
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS)

  const heartRateSamples = []
  const restingHR = []
  const hrv = []
  const workouts = []

  let currentWorkout = null

  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    const trimmed = line.trim()

    // ── <Record ...> single-line elements ──────────────────────────────────
    if (trimmed.startsWith('<Record ')) {
      const type = attr(trimmed, 'type')
      const dateStr = attr(trimmed, 'startDate') || attr(trimmed, 'creationDate')
      const date = parseDate(dateStr)
      if (!date || date < cutoff) continue

      const value = parseFloat(attr(trimmed, 'value'))
      if (isNaN(value)) continue

      if (type === 'HKQuantityTypeIdentifierHeartRate') {
        heartRateSamples.push({ date, bpm: value })
      } else if (type === 'HKQuantityTypeIdentifierRestingHeartRate') {
        restingHR.push({ date, bpm: value })
      } else if (type === 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN') {
        hrv.push({ date, ms: value })
      }
      continue
    }

    // ── <Workout ...> opening tag ───────────────────────────────────────────
    if (trimmed.startsWith('<Workout ')) {
      const startStr = attr(trimmed, 'startDate')
      const endStr = attr(trimmed, 'endDate')
      const start = parseDate(startStr)
      const end = parseDate(endStr)

      // Skip workouts outside the 30-day window
      if (!start || start < cutoff) {
        currentWorkout = null
        continue
      }

      const workoutType = attr(trimmed, 'workoutActivityType')
      const durationMin = parseFloat(attr(trimmed, 'duration')) || null
      const mapped = WORKOUT_TYPE_MAP[workoutType] || { category: null, subtype: null }

      currentWorkout = {
        type: workoutType,
        appCategory: mapped.category,
        appSubtype: mapped.subtype,
        start,
        end,
        durationMin,
        avgHR: null,
        minHR: null,
        maxHR: null,
      }
      continue
    }

    // ── <WorkoutStatistics .../> inside a Workout ───────────────────────────
    if (currentWorkout && trimmed.startsWith('<WorkoutStatistics ')) {
      const type = attr(trimmed, 'type')
      if (type === 'HKQuantityTypeIdentifierHeartRate') {
        const avg = parseFloat(attr(trimmed, 'average'))
        const min = parseFloat(attr(trimmed, 'minimum'))
        const max = parseFloat(attr(trimmed, 'maximum'))
        if (!isNaN(avg)) currentWorkout.avgHR = avg
        if (!isNaN(min)) currentWorkout.minHR = min
        if (!isNaN(max)) currentWorkout.maxHR = max
      }
      continue
    }

    // ── </Workout> closing tag — commit the workout ─────────────────────────
    if (currentWorkout && trimmed.startsWith('</Workout>')) {
      workouts.push(currentWorkout)
      currentWorkout = null
      continue
    }
  }

  return { heartRateSamples, restingHR, hrv, workouts }
}

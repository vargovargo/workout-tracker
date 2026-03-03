import spsData from './sps-peaks.json'

export const SPS_TOTAL = 248

// All peaks flattened from all regions
export const allPeaks = spsData.regions.flatMap(r =>
  r.peaks.map(p => ({ ...p, region: r.name, elevation: parseInt(p.elevation, 10) }))
)

// Peaks the user has summited (at least one ascent entry)
export const climbedPeaks = allPeaks.filter(p => p.ascents?.length > 0)

// Every individual ascent, annotated with its peak, sorted oldest → newest
export const allAscents = climbedPeaks
  .flatMap(p => p.ascents.map(a => ({ ...a, peak: p })))
  .sort((a, b) => new Date(a.date) - new Date(b.date))

// All peaks sorted by elevation descending (for the elevation chart)
export const peaksByElevation = [...allPeaks].sort((a, b) => b.elevation - a.elevation)

// Highest summit among climbed peaks
export const highestClimbed = climbedPeaks.reduce(
  (best, p) => (p.elevation > best ? p.elevation : best),
  0
)

import confetti from 'canvas-confetti'

// Public beta key — swap for your own key for production use
const GIPHY_API_KEY = 'dc6zaTOxFJmzC'
const GIPHY_BASE = 'https://api.giphy.com/v1/gifs/random'

/**
 * Fetches a random workout-celebration GIF from Giphy.
 * Returns the GIF URL or null if offline/failed.
 */
export async function fetchCelebrationGif(big = false) {
  const tag = big ? 'workout+champion' : 'workout+success'
  const url = `${GIPHY_BASE}?api_key=${GIPHY_API_KEY}&tag=${tag}&rating=g`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data?.images?.downsized?.url ?? json?.data?.images?.original?.url ?? null
  } catch {
    return null
  }
}

/**
 * Fires a small confetti burst (category milestone).
 */
export function fireSmallConfetti() {
  confetti({
    particleCount: 60,
    spread: 55,
    origin: { y: 0.6 },
    colors: ['#60a5fa', '#22d3ee', '#34d399', '#facc15'],
  })
}

/**
 * Fires a big confetti celebration (week complete).
 */
export function fireBigConfetti() {
  const count = 180
  const defaults = { origin: { y: 0.5 } }

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#60a5fa', '#3b82f6'] })
  fire(0.2, { spread: 60, colors: ['#22d3ee', '#06b6d4'] })
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#34d399', '#10b981'] })
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#facc15'] })
  fire(0.1, { spread: 120, startVelocity: 45, colors: ['#f472b6'] })
}

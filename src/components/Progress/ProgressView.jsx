import React, { useState, useMemo } from 'react'
import { useApp } from '../../App.jsx'
import { FITNESS_CONFIG, SECONDARY_ATTRIBUTES, sumSecondaryScores } from '../../config.js'
import { getCategoryProgress } from '../../utils/progressUtils.js'
import { getWeekKey } from '../../utils/weekUtils.js'
import RadarChart from './RadarChart.jsx'
import ACWRGauge from './ACWRGauge.jsx'
import CalendarHeatmap from './CalendarHeatmap.jsx'
import TrendSummary from './TrendSummary.jsx'

const RANGES = [
  { id: '4w', label: '4W', weeks: 4 },
  { id: '12w', label: '12W', weeks: 12 },
  { id: 'all', label: 'All', weeks: 999 },
]

// Returns Monday-anchored ISO week keys for the last N completed weeks
function lastNWeekKeys(n) {
  const keys = []
  const today = new Date()
  const dow = today.getDay()
  // Go to start of current week's Monday
  const thisMonday = new Date(today)
  thisMonday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
  // Start from last completed week
  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(thisMonday.getDate() - 7)
  for (let i = 0; i < n; i++) {
    const d = new Date(lastMonday)
    d.setDate(lastMonday.getDate() - i * 7)
    keys.push(getWeekKey(d))
  }
  return keys
}

// Filter sessions within a rolling N-day window
function sessionsInLastNDays(sessions, n) {
  const cutoff = Date.now() - n * 24 * 60 * 60 * 1000
  return sessions.filter((s) => {
    const t = new Date(s.occurredAt || s.loggedAt).getTime()
    return t >= cutoff
  })
}

// Compute primary category normalised scores for radar (indexed to personal max)
function buildPrimaryDatasets(sessions, settings, weekKeys) {
  const categories = Object.keys(FITNESS_CONFIG)

  function weekValues(keys) {
    return categories.map((cat) => {
      const total = keys.reduce((sum, wk) => {
        const wkSessions = sessions.filter((s) => s.weekKey === wk)
        const { value } = getCategoryProgress(wkSessions, cat, settings)
        return sum + value
      }, 0)
      return keys.length > 0 ? total / keys.length : 0
    })
  }

  const sessions7 = sessionsInLastNDays(sessions, 7)
  const sessions28 = sessionsInLastNDays(sessions, 28)

  const vals7 = categories.map((cat) => getCategoryProgress(sessions7, cat, settings).value)
  const vals28 = categories.map((cat) => getCategoryProgress(sessions28, cat, settings).value / 4)

  const allAvg = weekValues(weekKeys)

  // Normalise each axis to its goal target so all spokes are on the same scale:
  // 1.0 = hitting your goal, >1.0 = exceeding it (capped at 1.5 to keep chart readable)
  const goalPerCat = categories.map((cat) => Math.max(settings[cat]?.target ?? 1, 1))
  const norm = (vals) => vals.map((v, i) => Math.min(v / goalPerCat[i], 1.5))

  return {
    axes: categories.map((cat) => ({
      label: FITNESS_CONFIG[cat].label,
      icon: FITNESS_CONFIG[cat].icon,
      color: FITNESS_CONFIG[cat].arcColor,
    })),
    datasets: [
      {
        label: 'All-time avg',
        values: norm(allAvg),
        color: '#94a3b8',
        opacity: 0.1,
        dashed: true,
      },
      {
        label: '28-day avg',
        values: norm(vals28),
        color: '#60a5fa',
        opacity: 0.15,
        dashed: false,
      },
      {
        label: '7-day',
        values: norm(vals7),
        color: '#34d399',
        opacity: 0.25,
        dashed: false,
      },
    ],
  }
}

// Compute secondary attribute normalised scores for radar
function buildSecondaryDatasets(sessions, weekKeys) {
  const attrs = Object.keys(SECONDARY_ATTRIBUTES)

  function weekSecondaryAvg(keys) {
    if (!keys.length) return attrs.map(() => 0)
    const total = keys.reduce((sum, wk) => {
      const wkSessions = sessions.filter((s) => s.weekKey === wk)
      const scores = sumSecondaryScores(wkSessions)
      return attrs.map((a, i) => (sum[i] || 0) + scores[a])
    }, [])
    return total.map((v) => v / keys.length)
  }

  const sessions7 = sessionsInLastNDays(sessions, 7)
  const sessions28 = sessionsInLastNDays(sessions, 28)

  const scores7 = sumSecondaryScores(sessions7)
  const vals7 = attrs.map((a) => scores7[a])

  const scores28 = sumSecondaryScores(sessions28)
  const vals28 = attrs.map((a) => scores28[a] / 4)

  const allAvgVals = weekSecondaryAvg(weekKeys)

  const maxVal = Math.max(...vals7, ...vals28, ...allAvgVals, 1)

  return {
    axes: attrs.map((attr) => ({
      label: SECONDARY_ATTRIBUTES[attr].label,
      icon: SECONDARY_ATTRIBUTES[attr].icon,
      color: SECONDARY_ATTRIBUTES[attr].arcColor,
    })),
    datasets: [
      {
        label: 'All-time avg',
        values: allAvgVals.map((v) => v / maxVal),
        color: '#94a3b8',
        opacity: 0.1,
        dashed: true,
      },
      {
        label: '28-day avg',
        values: vals28.map((v) => v / maxVal),
        color: '#f59e0b',
        opacity: 0.15,
        dashed: false,
      },
      {
        label: '7-day',
        values: vals7.map((v) => v / maxVal),
        color: '#818cf8',
        opacity: 0.25,
        dashed: false,
      },
    ],
  }
}

// ACWR calculation
function computeACWR(sessions) {
  const now = Date.now()
  const ms7 = 7 * 24 * 60 * 60 * 1000
  const ms28 = 28 * 24 * 60 * 60 * 1000

  const acute = sessions
    .filter((s) => {
      const t = new Date(s.occurredAt || s.loggedAt).getTime()
      return t >= now - ms7
    })
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0)

  const chronic28 = sessions
    .filter((s) => {
      const t = new Date(s.occurredAt || s.loggedAt).getTime()
      return t >= now - ms28 && t < now - ms7
    })
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0)

  const chronicAvg = chronic28 / 3
  return chronicAvg > 0 ? acute / chronicAvg : null
}

export default function ProgressView() {
  const { sessions, settings, report, openAdvisor } = useApp()
  const [range, setRange] = useState('12w')

  const rangeConfig = RANGES.find((r) => r.id === range)
  const allWeekKeys = useMemo(() => {
    const keys = new Set(sessions.map((s) => s.weekKey))
    return Array.from(keys).sort().reverse()
  }, [sessions])

  const weekKeys = useMemo(() => {
    const full = lastNWeekKeys(rangeConfig.weeks)
    return range === 'all' ? allWeekKeys : full.filter((wk) => allWeekKeys.includes(wk))
  }, [range, allWeekKeys, rangeConfig])

  const primaryData = useMemo(
    () => buildPrimaryDatasets(sessions, settings, weekKeys),
    [sessions, settings, weekKeys]
  )
  const secondaryData = useMemo(
    () => buildSecondaryDatasets(sessions, weekKeys),
    [sessions, weekKeys]
  )
  const acwr = useMemo(() => computeACWR(sessions), [sessions])

  // Recovery debt indicator
  const recoveryDebt = useMemo(() => {
    if (!weekKeys.length) return null
    const recentSessions = sessions.filter((s) => weekKeys.slice(0, 4).includes(s.weekKey))
    const totals = sumSecondaryScores(recentSessions)
    const output = totals.peakOutput
    const restore = totals.restoration
    if (output === 0) return null
    const ratio = restore / output
    return ratio < 0.75 ? Math.round(ratio * 100) : null
  }, [sessions, weekKeys])

  return (
    <div className="pb-6 slide-up">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Progress</h1>
          <p className="text-xs text-slate-400">Historical trends & fitness balance</p>
        </div>
        {report && (
          <button
            onClick={openAdvisor}
            className="mt-0.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 active:opacity-70"
          >
            <span className="text-sm">🤖</span>
            <span className="text-xs font-medium text-slate-300">AI Rec</span>
          </button>
        )}
      </div>

      {/* Time range selector */}
      <div className="flex gap-2 px-4 mb-4">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              range === r.id
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 active:bg-slate-700'
            }`}
          >
            {r.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500 self-center">
          {weekKeys.length} weeks
        </span>
      </div>

      {/* Recovery debt banner */}
      {recoveryDebt !== null && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-xs text-amber-400">
            ⚠️ Restoration is {recoveryDebt}% of your Peak Output this period — consider more recovery work.
          </p>
        </div>
      )}

      {/* Radar charts */}
      <div className="grid grid-cols-2 gap-4 px-4 mb-3">
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
          <RadarChart
            title="Primary"
            axes={primaryData.axes}
            datasets={primaryData.datasets}
          />
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 mt-1">
            {primaryData.axes.map((a) => (
              <span key={a.label} className="text-slate-500" style={{ fontSize: 9 }}>{a.icon} {a.label}</span>
            ))}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
          <RadarChart
            title="Secondary"
            axes={secondaryData.axes}
            datasets={secondaryData.datasets}
          />
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 mt-1">
            {secondaryData.axes.map((a) => (
              <span key={a.label} className="text-slate-500" style={{ fontSize: 9 }}>{a.icon} {a.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Radar legend */}
      <div className="flex gap-4 px-4 mb-4 justify-center">
        {[
          { color: '#34d399', label: '7-day' },
          { color: '#60a5fa', label: '28-day avg' },
          { color: '#94a3b8', label: 'All-time avg', dashed: true },
        ].map(({ color, label, dashed }) => (
          <div key={label} className="flex items-center gap-1.5">
            <svg width="16" height="8">
              <line
                x1="0" y1="4" x2="16" y2="4"
                stroke={color}
                strokeWidth={dashed ? 1.5 : 2}
                strokeDasharray={dashed ? '3 2' : undefined}
              />
            </svg>
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {/* ACWR gauge */}
      <div className="mx-4 mb-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <ACWRGauge acwr={acwr} />
      </div>

      {/* Goal hit rate — trend pills */}
      <div className="px-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Goal Hit Rate</p>
        <TrendSummary sessions={sessions} settings={settings} weekKeys={weekKeys} />
      </div>

      {/* Calendar heatmap */}
      <div className="mx-4 mb-2 overflow-hidden">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Activity Calendar</p>
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 overflow-hidden">
          <CalendarHeatmap sessions={sessions} />
        </div>
      </div>
    </div>
  )
}

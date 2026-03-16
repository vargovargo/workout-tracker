import React from 'react'

const W = 200
const H = 110
const CX = W / 2
const CY = H - 10
const R = 75

// Arc from angle a1 to a2 (radians), radius r, centred at CX,CY
function arcPath(a1, a2, r) {
  const x1 = CX + r * Math.cos(a1)
  const y1 = CY + r * Math.sin(a1)
  const x2 = CX + r * Math.cos(a2)
  const y2 = CY + r * Math.sin(a2)
  const large = a2 - a1 > Math.PI ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

// Map ACWR value 0–2 to angle (π = left, 0 = right, measured from centre bottom)
// We want 0 at left (π), 2 at right (0), with needle at bottom sweep
const A_MIN = Math.PI       // left
const A_MAX = 0             // right (full arc = 180°)

function acwrToAngle(value) {
  const clamped = Math.min(2, Math.max(0, value))
  return A_MIN + (A_MAX - A_MIN) * (clamped / 2)
}

function acwrColor(value) {
  if (value === null) return '#475569'
  if (value > 1.5) return '#f43f5e'
  if (value > 1.3) return '#f59e0b'
  if (value < 0.8) return '#f59e0b'
  return '#34d399'
}

function acwrLabel(value) {
  if (value === null) return 'No data yet'
  if (value > 1.5) return 'High load ⚠️'
  if (value > 1.3) return 'Elevated'
  if (value < 0.8) return 'Low load'
  return 'Sweet spot ✓'
}

export default function ACWRGauge({ acwr }) {
  const color = acwrColor(acwr)
  const label = acwrLabel(acwr)
  const needleAngle = acwr !== null ? acwrToAngle(acwr) : A_MIN + (A_MAX - A_MIN) * 0.5

  // Needle tip coords
  const needleTipR = R - 8
  const nx = CX + needleTipR * Math.cos(needleAngle)
  const ny = CY + needleTipR * Math.sin(needleAngle)

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
        Training Load
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[200px]">
        {/* Background arc: full 180° */}
        <path d={arcPath(Math.PI, 0, R)} fill="none" stroke="#1e293b" strokeWidth={16} strokeLinecap="round" />

        {/* Low zone: π → 0.8/2 * π */}
        <path d={arcPath(Math.PI, acwrToAngle(0.8), R)} fill="none" stroke="#f59e0b" strokeWidth={16} strokeOpacity={0.4} strokeLinecap="butt" />
        {/* Sweet spot zone: 0.8 → 1.3 */}
        <path d={arcPath(acwrToAngle(0.8), acwrToAngle(1.3), R)} fill="none" stroke="#34d399" strokeWidth={16} strokeOpacity={0.4} strokeLinecap="butt" />
        {/* Elevated zone: 1.3 → 1.5 */}
        <path d={arcPath(acwrToAngle(1.3), acwrToAngle(1.5), R)} fill="none" stroke="#f59e0b" strokeWidth={16} strokeOpacity={0.4} strokeLinecap="butt" />
        {/* High zone: 1.5 → 2.0 */}
        <path d={arcPath(acwrToAngle(1.5), 0, R)} fill="none" stroke="#f43f5e" strokeWidth={16} strokeOpacity={0.4} strokeLinecap="butt" />

        {/* Needle */}
        <line x1={CX} y1={CY} x2={nx} y2={ny} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={5} fill={color} />

        {/* Zone labels */}
        <text x={18} y={CY - 4} fontSize={7} fill="#64748b" textAnchor="middle">0</text>
        <text x={W - 18} y={CY - 4} fontSize={7} fill="#64748b" textAnchor="middle">2.0</text>
        <text x={CX} y={CY - R + 6} fontSize={7} fill="#64748b" textAnchor="middle">1.0</text>

        {/* Value display */}
        <text x={CX} y={CY - 20} fontSize={18} fontWeight="bold" fill={color} textAnchor="middle" dominantBaseline="middle">
          {acwr !== null ? acwr.toFixed(2) : '—'}
        </text>
        <text x={CX} y={CY - 6} fontSize={8} fill="#94a3b8" textAnchor="middle">
          {label}
        </text>
      </svg>
      <p className="text-xs text-slate-500 mt-1 text-center max-w-[180px]">
        7-day load ÷ 28-day avg · sweet spot 0.8–1.3
      </p>
    </div>
  )
}

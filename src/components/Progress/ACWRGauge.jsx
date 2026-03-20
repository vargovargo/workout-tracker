import React from 'react'

const W = 220
const H = 135
const CX = W / 2   // 110
const CY = 100     // pivot near bottom of arc area
const R = 78
const STROKE = 14

// Screen degrees: 0=right, 90=down, 180=left, 270=up
// Gauge: ACWR 0 → 180° (left)  ACWR 1 → 270° (top)  ACWR 2 → 360° (right)
// Clockwise from 180° through 270° to 360° sweeps the upper semicircle ✓
function acwrToDeg(v) {
  return 180 + Math.min(2, Math.max(0, v)) * 90
}

function polarXY(screenDeg, r = R) {
  const rad = (screenDeg * Math.PI) / 180
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)]
}

function arcD(deg1, deg2, r = R) {
  const [x1, y1] = polarXY(deg1, r)
  const [x2, y2] = polarXY(deg2, r)
  const large = deg2 - deg1 > 180 ? 1 : 0
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

function acwrColor(v) {
  if (v == null) return '#475569'
  if (v > 1.5) return '#f43f5e'
  if (v > 1.3) return '#f59e0b'
  if (v < 0.8) return '#f59e0b'
  return '#34d399'
}

function acwrLabel(v) {
  if (v == null) return 'No data yet'
  if (v > 1.5) return 'High load ⚠️'
  if (v > 1.3) return 'Elevated'
  if (v < 0.8) return 'Low load'
  return 'Well-balanced ✓'
}

export default function ACWRGauge({ acwr }) {
  const color = acwrColor(acwr)
  const label = acwrLabel(acwr)
  const needleDeg = acwr != null ? acwrToDeg(acwr) : 270  // default: point up
  const [nx, ny] = polarXY(needleDeg, R - 12)

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
        Training Load
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[220px]">
        {/* Background arc */}
        <path d={arcD(180, 360)} fill="none" stroke="#1e293b" strokeWidth={STROKE} strokeLinecap="round" />

        {/* Zone arcs */}
        <path d={arcD(180, acwrToDeg(0.8))} fill="none" stroke="#f59e0b" strokeWidth={STROKE} strokeOpacity={0.45} strokeLinecap="butt" />
        <path d={arcD(acwrToDeg(0.8), acwrToDeg(1.3))} fill="none" stroke="#34d399" strokeWidth={STROKE} strokeOpacity={0.45} strokeLinecap="butt" />
        <path d={arcD(acwrToDeg(1.3), acwrToDeg(1.5))} fill="none" stroke="#f59e0b" strokeWidth={STROKE} strokeOpacity={0.45} strokeLinecap="butt" />
        <path d={arcD(acwrToDeg(1.5), 360)} fill="none" stroke="#f43f5e" strokeWidth={STROKE} strokeOpacity={0.45} strokeLinecap="butt" />

        {/* Zone boundary ticks */}
        {[0.8, 1.3, 1.5].map((v) => {
          const [tx, ty] = polarXY(acwrToDeg(v), R + STROKE / 2 + 1)
          const [lx, ly] = polarXY(acwrToDeg(v), R - STROKE / 2 - 1)
          return <line key={v} x1={tx.toFixed(1)} y1={ty.toFixed(1)} x2={lx.toFixed(1)} y2={ly.toFixed(1)} stroke="#0f172a" strokeWidth={1.5} />
        })}

        {/* Scale labels */}
        <text x={CX - R - 10} y={CY + 5} fontSize={7} fill="#64748b" textAnchor="middle">0</text>
        <text x={CX} y={CY - R - 8} fontSize={7} fill="#64748b" textAnchor="middle">1.0</text>
        <text x={CX + R + 12} y={CY + 5} fontSize={7} fill="#64748b" textAnchor="middle">2.0</text>

        {/* Needle */}
        <line x1={CX} y1={CY} x2={nx.toFixed(1)} y2={ny.toFixed(1)} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={5} fill={color} />

        {/* Value + label below pivot */}
        <text x={CX} y={CY + 18} fontSize={22} fontWeight="bold" fill={color} textAnchor="middle" dominantBaseline="middle">
          {acwr != null ? acwr.toFixed(2) : '—'}
        </text>
        <text x={CX} y={CY + 32} fontSize={8} fill="#94a3b8" textAnchor="middle">
          {label}
        </text>
      </svg>
      <p className="text-xs text-slate-500 text-center max-w-[180px] -mt-1">
        7-day load ÷ 28-day avg · sweet spot 0.8–1.3
      </p>
    </div>
  )
}

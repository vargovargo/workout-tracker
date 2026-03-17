import React from 'react'

const SIZE = 200
const CX = SIZE / 2
const CY = SIZE / 2
const RADIUS = 80
const RINGS = 5 // 20%, 40%, 60%, 80%, 100%

// Compute (x, y) for an axis point at a given radius and index
function axisPoint(index, total, r) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  return {
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  }
}

// Build SVG polygon points string from values array (0–1 normalised)
function buildPolygon(values, total) {
  return values
    .map((v, i) => {
      const { x, y } = axisPoint(i, total, v * RADIUS)
      return `${x},${y}`
    })
    .join(' ')
}

/**
 * RadarChart — SVG radar/spider chart
 *
 * @param {Array<{label, icon, color}>} axes  - axis definitions
 * @param {Array<{label, values, color, opacity, dashed}>} datasets - polygons to draw
 * @param {string} title
 */
export default function RadarChart({ axes, datasets, title }) {
  const n = axes.length
  if (n < 3) return null

  return (
    <div className="flex flex-col items-center">
      {title && <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">{title}</p>}
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[220px]">
        {/* Grid rings */}
        {Array.from({ length: RINGS }, (_, i) => {
          const r = (RADIUS * (i + 1)) / RINGS
          const pts = Array.from({ length: n }, (_, j) => {
            const { x, y } = axisPoint(j, n, r)
            return `${x},${y}`
          }).join(' ')
          return (
            <polygon
              key={i}
              points={pts}
              fill="none"
              stroke="#334155"
              strokeWidth={i === RINGS - 1 ? 1 : 0.75}
            />
          )
        })}

        {/* Axis spokes */}
        {axes.map((_, i) => {
          const outer = axisPoint(i, n, RADIUS)
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={outer.x}
              y2={outer.y}
              stroke="#334155"
              strokeWidth={0.75}
            />
          )
        })}

        {/* Datasets (back to front) */}
        {[...datasets].reverse().map((ds, di) => (
          <polygon
            key={di}
            points={buildPolygon(ds.values, n)}
            fill={ds.color}
            fillOpacity={ds.opacity ?? 0.15}
            stroke={ds.color}
            strokeWidth={ds.dashed ? 1.5 : 2}
            strokeDasharray={ds.dashed ? '4 3' : undefined}
            strokeOpacity={ds.dashed ? 0.6 : 0.9}
          />
        ))}

        {/* Axis icons only — labels shown in legend below to avoid clipping */}
        {axes.map((axis, i) => {
          const labelR = RADIUS + 14
          const { x, y } = axisPoint(i, n, labelR)
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
              fontFamily="system-ui, sans-serif"
            >
              {axis.icon}
            </text>
          )
        })}

        {/* Center dot */}
        <circle cx={CX} cy={CY} r={2} fill="#475569" />
      </svg>
    </div>
  )
}

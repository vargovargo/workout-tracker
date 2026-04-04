import React from 'react'
import { weekLabel } from '../../utils/weekUtils.js'

export default function WeekHeader({ weekKey }) {
  const label = weekLabel(weekKey)
  return (
    <div className="px-4 pt-5 pb-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">This Week</p>
      <h1 className="text-xl font-bold text-white mt-0.5">{label}</h1>
    </div>
  )
}

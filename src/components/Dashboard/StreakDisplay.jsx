import React from 'react'

export default function StreakDisplay({ weeklyStreak, activeDayStreak }) {
  return (
    <div className="flex gap-3 px-4 py-2">
      <StreakPill icon="🔥" value={weeklyStreak} label="week streak" />
      <StreakPill icon="⚡" value={activeDayStreak} label="day streak" />
    </div>
  )
}

function StreakPill({ icon, value, label }) {
  const active = value > 0
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
        active
          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          : 'bg-slate-800 text-slate-500 border border-slate-700'
      }`}
    >
      <span>{icon}</span>
      <span>
        <span className={active ? 'text-white font-bold' : ''}>{value}</span>{' '}
        {label}
      </span>
    </div>
  )
}

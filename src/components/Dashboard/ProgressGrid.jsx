import React from 'react'
import CategoryCard from './CategoryCard.jsx'
import { WORKOUT_CONFIG } from '../../config.js'

export default function ProgressGrid({ weekSessions }) {
  const countByCategory = {}
  for (const key of Object.keys(WORKOUT_CONFIG)) {
    countByCategory[key] = weekSessions.filter((s) => s.category === key).length
  }

  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Object.keys(WORKOUT_CONFIG).map((key) => (
        <CategoryCard key={key} categoryKey={key} count={countByCategory[key]} />
      ))}
    </div>
  )
}

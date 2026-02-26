import React from 'react'
import CategoryCard from './CategoryCard.jsx'
import { WORKOUT_CONFIG } from '../../config.js'
import { getCategoryProgress } from '../../utils/progressUtils.js'
import { useApp } from '../../App.jsx'

export default function ProgressGrid({ weekSessions }) {
  const { settings } = useApp()

  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Object.keys(WORKOUT_CONFIG).map((key) => {
        const { value, target, unit } = getCategoryProgress(weekSessions, key, settings)
        return (
          <CategoryCard key={key} categoryKey={key} value={value} target={target} unit={unit} />
        )
      })}
    </div>
  )
}

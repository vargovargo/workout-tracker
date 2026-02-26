import React, { useState } from 'react'
import { WORKOUT_CONFIG } from '../../config.js'
import { useApp } from '../../App.jsx'
import CategoryPicker from './CategoryPicker.jsx'
import SubtypePicker from './SubtypePicker.jsx'
import SessionForm from './SessionForm.jsx'

export default function LogView() {
  const { onSessionSaved, activeSession } = useApp()
  const [step, setStep] = useState(() => {
    // If there's an active session, jump to finish step
    if (activeSession) return 'form'
    return 'category'
  })
  const [category, setCategory] = useState(activeSession?.category || null)
  const [subtype, setSubtype] = useState(activeSession?.subtype || null)

  function handleCategorySelect(key) {
    setCategory(key)
    const cfg = WORKOUT_CONFIG[key]
    if (cfg.subtypes.length > 0) {
      setStep('subtype')
    } else {
      setStep('form')
    }
  }

  function handleSubtypeSelect(sub) {
    setSubtype(sub)
    setStep('form')
  }

  function handleBack() {
    if (step === 'form') {
      const cfg = category ? WORKOUT_CONFIG[category] : null
      if (cfg?.subtypes.length > 0) {
        setStep('subtype')
      } else {
        setStep('category')
      }
    } else if (step === 'subtype') {
      setStep('category')
      setCategory(null)
    }
  }

  function handleReset() {
    setStep('category')
    setCategory(null)
    setSubtype(null)
  }

  return (
    <div>
      {step === 'category' && (
        <CategoryPicker onSelect={handleCategorySelect} />
      )}
      {step === 'subtype' && category && (
        <SubtypePicker
          categoryKey={category}
          onSelect={handleSubtypeSelect}
          onBack={handleReset}
        />
      )}
      {step === 'form' && category && (
        <SessionForm
          categoryKey={category}
          subtype={subtype}
          onBack={handleBack}
          onSaved={(session) => {
            handleReset()
            onSessionSaved(session)
          }}
        />
      )}
    </div>
  )
}

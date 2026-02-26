import React, { useState } from 'react'
import { useApp } from '../../App.jsx'
import FlatActivityPicker from './FlatActivityPicker.jsx'
import SessionForm from './SessionForm.jsx'

export default function LogView() {
  const { onSessionSaved } = useApp()

  const [step, setStep] = useState('pick')
  const [category, setCategory] = useState(null)
  const [subtype, setSubtype] = useState(null)

  function handleActivitySelect(catKey, sub) {
    setCategory(catKey)
    setSubtype(sub ?? null)
    setStep('form')
  }

  function handleReset() {
    setStep('pick')
    setCategory(null)
    setSubtype(null)
  }

  return (
    <div>
      {step === 'pick' && (
        <FlatActivityPicker onSelect={handleActivitySelect} />
      )}
      {step === 'form' && category && (
        <SessionForm
          categoryKey={category}
          subtype={subtype}
          onBack={handleReset}
          onSaved={(session) => {
            handleReset()
            onSessionSaved(session)
          }}
        />
      )}
    </div>
  )
}

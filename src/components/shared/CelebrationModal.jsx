import React, { useEffect } from 'react'

export default function CelebrationModal({ gif, big, onClose }) {
  // Auto-close after 5s
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 fade-in"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-slate-800 border border-slate-700 overflow-hidden shadow-2xl slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {gif ? (
          <img
            src={gif}
            alt="Celebration"
            className="w-full object-cover"
            style={{ maxHeight: 280 }}
          />
        ) : (
          <div className="flex items-center justify-center py-16 text-7xl">
            {big ? '🏆' : '🎯'}
          </div>
        )}

        <div className="px-6 py-5 text-center">
          <p className="text-2xl font-bold text-white mb-1">
            {big ? '🎉 Week Complete!' : '✅ Target Hit!'}
          </p>
          <p className="text-sm text-slate-400">
            {big
              ? 'You crushed every goal this week. Keep it up!'
              : 'You hit your target for this category. Nice work!'}
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full py-3 rounded-2xl bg-blue-500 text-white font-bold active:scale-95 transition-transform"
          >
            Keep Going 💪
          </button>
        </div>
      </div>
    </div>
  )
}

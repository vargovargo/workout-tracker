import React from 'react'

export const USERS = ['Benton', 'Leo', 'Lauren', 'Jason']
const LAST_USER_KEY = 'last_user'

export function loadLastUser() {
  return localStorage.getItem(LAST_USER_KEY) || USERS[0]
}

export function saveLastUser(user) {
  localStorage.setItem(LAST_USER_KEY, user)
}

export default function UserSelector({ currentUser, onUserChange, onOpenSettings }) {
  return (
    <div className="flex items-center border-b border-slate-800">
      <div className="flex gap-2 px-4 py-2.5 flex-1 overflow-x-auto no-scrollbar">
        {USERS.map((user) => (
          <button
            key={user}
            onClick={() => onUserChange(user)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
              currentUser === user
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 active:bg-slate-700'
            }`}
          >
            {user}
          </button>
        ))}
      </div>
      <button
        onClick={onOpenSettings}
        className="flex-shrink-0 px-3 py-2.5 text-slate-500 active:text-slate-300 transition-colors"
        aria-label="Settings"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      </button>
    </div>
  )
}

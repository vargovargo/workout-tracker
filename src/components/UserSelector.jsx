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
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  )
}

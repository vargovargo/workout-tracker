# CLAUDE.md — Workout Tracker v2.0

A multi-user fitness PWA with real-time Firebase sync, gamification, algorithmic goal
setting, and a physiology-informed progress dashboard.

---

## Project layout

```
workout-tracker/
├── physio.md                    ← living physiology reference (edit to tune algorithm)
├── scripts/
│   ├── goal-advisor.js          ← terminal goal-setting script (run with node)
│   └── lib/
│       ├── fetchData.js         ← Firebase Admin SDK data fetcher
│       ├── analyzeHistory.js    ← 8-week trend, ACWR, secondary balance analysis
│       ├── survey.js            ← 5-question readline CLI survey
│       └── buildPrompt.js       ← Claude prompt assembly (injects physio.md)
├── src/
│   ├── config.js                ← primary categories + secondary attributes + scoring
│   ├── firebase.js              ← Firestore init (env vars)
│   ├── App.jsx                  ← root component, AppContext, 4-tab routing
│   ├── hooks/
│   │   ├── useWorkouts.js       ← Firestore session CRUD + real-time sync
│   │   ├── useSettings.js       ← per-user goal settings (Firestore)
│   │   └── useStreak.js         ← weekly + daily streak calculations
│   ├── utils/
│   │   ├── weekUtils.js         ← Monday-anchored ISO week keys
│   │   ├── progressUtils.js     ← category progress vs target
│   │   ├── suggestionUtils.js   ← smart suggestions (secondary-aware)
│   │   └── celebrationUtils.js  ← confetti + Giphy API
│   └── components/
│       ├── BottomNav.jsx        ← 4-tab nav (Dashboard / Log / History / Progress)
│       ├── UserSelector.jsx     ← user switcher (Benton, Leo, Lauren, Jason)
│       ├── Dashboard/           ← 7-day view, rings, charts, suggestion banner
│       ├── Log/                 ← activity picker + session form
│       ├── History/             ← week-by-week history, CSV export
│       ├── Progress/            ← radar charts, ACWR gauge, calendar heatmap
│       └── shared/              ← modals (edit, settings, celebration)
```

---

## Users

| User | Profile |
|------|---------|
| **Jason** | Mid-40s male, 5'10–11", ~180 lbs. Mountain season goals. Primary pilot for goal advisor. |
| **Lauren** | Late 40s female. Strength-priority (bone density). |
| **Benton** | 14yo male, 6'5" ~200 lbs. Basketball focus. No heavy loaded lifts (open growth plates). |
| **Leo** | 11yo male, ~115 lbs. Climbing focus. Bodyweight/play only. Flexibility priority during growth spurts. |

Firestore path: `users/{userId}/sessions` and `users/{userId}/meta/settings`

---

## Primary categories

`strength` 💪 · `cardio` 🏃 · `mobility` 🤸 · `mindfulness` 🧘

Goals are per-user, per-category, in sessions or minutes per week.

## Secondary attributes (algorithm-only, not shown in UI)

Defined in `src/config.js` and documented in `physio.md`:

| Attribute | Key | Physiological basis |
|-----------|-----|---------------------|
| Aerobic Base | `aerobicBase` | Zone 2, fat oxidation, mitochondrial health |
| Peak Output | `peakOutput` | Zone 5 / VO2 max, anaerobic capacity |
| Structural Integrity | `structural` | Stability, balance, proprioception |
| Restoration | `restoration` | Parasympathetic recovery, tissue repair |

Each activity is scored 0–3 on each attribute in `ACTIVITY_SECONDARY_SCORES`.
The scoring table in `physio.md` is the canonical reference — edit it, then update
`config.js` to match.

---

## Goal advisor script (v2.0 feature)

```bash
# Setup (one-time)
# 1. Download serviceAccountKey.json from Firebase Console → Project Settings → Service Accounts
# 2. Create .env in project root:
#    GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
#    ANTHROPIC_API_KEY=sk-ant-...

# Run for Jason (default)
node scripts/goal-advisor.js
# or
npm run goal-advisor

# Run for another user
node scripts/goal-advisor.js --user=Lauren
GOAL_USER=Benton node scripts/goal-advisor.js
```

The script:
1. Fetches all sessions + settings from Firestore for the user
2. Analyzes last 8 weeks: completion rates, trends, secondary attribute balance, ACWR
3. Runs a 5-question survey (the ground truth signal)
4. Calls `claude-sonnet-4-6` with physio.md as system context
5. Outputs suggested goals with reasoning, focus activities, and 3-month trajectory
6. Optionally writes new goals back to Firestore

Survey responses override data trends — if the user reports high fatigue, no goals increase.

---

## Progress tab (v2.0 feature)

New 4th tab in the web app:
- **Dual radar charts** — primary categories + secondary attributes (this week / 4-week avg / all-time avg)
- **ACWR gauge** — 7-day load ÷ 28-day avg with color zones (sweet spot 0.8–1.3)
- **Activity calendar heatmap** — 52-week GitHub-style grid, color by dominant category, intensity by minutes
- **Momentum trend pills** — ↑ ↓ → per category with goal hit rate %
- **Recovery debt banner** — fires when Restoration < 75% of Peak Output over 4 weeks
- Time range selector: **4W / 12W / All**

---

## physio.md

The algorithm's knowledge base. Claude reads it on every `goal-advisor` run. Contains:
- Per-user physiological profiles and age-specific constraints
- Secondary attribute definitions and rationale
- Activity → secondary score table (**Jason should review and edit this**)
- Progressive overload rules (ACSM ≤10%/week, ACWR sweet spot)
- Survey interpretation thresholds
- Weekly balance targets per secondary attribute
- References (Attia, ICFSR 2024, ACSM, ACWR literature)

This file is meant to evolve. Edit it as you learn more about your body and training.

---

## Dev commands

```bash
npm run dev          # start Vite dev server
npm run build        # production build
npm run preview      # preview production build
npm run goal-advisor # run terminal goal advisor (requires .env)
```

---

## Tech stack

- **React 18** + **Vite 5** + **Tailwind CSS 3**
- **Firebase Firestore** (real-time sync via `onSnapshot`)
- **firebase-admin** (server-side script access)
- **@anthropic-ai/sdk** (Claude goal recommendations)
- **canvas-confetti** + Giphy API (celebration animations)
- PWA with service worker (`/public/sw.js`)

---

## Firebase data model

```
users/
  {userId}/
    sessions/
      {sessionId}: { id, category, subtype, durationMinutes, notes, weekKey, occurredAt, loggedAt }
    meta/
      settings: { strength: { target, unit }, cardio: {...}, mobility: {...}, mindfulness: {...} }
```

Week keys use Monday-anchored ISO format: `"YYYY-WW"` (e.g. `"2026-11"`).

---

## Deployment

GitHub Pages via Vite. Base URL set from `GITHUB_REPOSITORY` env var at build time.
Firebase config via `VITE_FIREBASE_*` environment variables.

---

## Status

| Feature | Status |
|---------|--------|
| Core PWA (log, history, streaks, celebrations) | ✅ Complete |
| Multi-user Firestore sync | ✅ Complete |
| Secondary fitness attributes config | ✅ Complete |
| physio.md reference document | ✅ Complete — **review activity scoring table** |
| Terminal goal advisor script | ✅ Complete — **needs .env + serviceAccountKey.json setup** |
| Smart suggestion banner (subtype-aware) | ✅ Complete |
| Progress tab (radar, ACWR, heatmap) | ✅ Complete |
| Goal advisor: apply to all users | 🔜 Extend via `--user=` flag — works now |
| physio.md scoring table review by Jason | ⏳ Pending |

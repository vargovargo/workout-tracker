# CLAUDE.md — Fitness Tracker

A multi-user fitness PWA with real-time Firebase sync, gamification, AI-powered goal
setting, and a physiology-informed progress dashboard. Lives at **fitness.vargo.city**.

---

## Project layout

```
workout-tracker/
├── physio.md                    ← living physiology reference (edit to tune algorithm)
├── public/
│   ├── CNAME                    ← custom domain: fitness.vargo.city
│   ├── manifest.json            ← PWA manifest (name: "Fitness Tracker")
│   ├── sw.js                    ← service worker (cache: fitness-tracker-v1)
│   └── icons/                   ← icon-180.png (iOS), icon-192/512.png, og-preview.png
├── scripts/
│   ├── goal-advisor.js          ← terminal AI goal-setting script (run with node)
│   ├── generate-icons.js        ← generates PNG icons + 1200×630 OG preview
│   └── lib/
│       ├── fetchData.js         ← Firebase Admin SDK data fetcher + report writer
│       ├── analyzeHistory.js    ← trend, ACWR, secondary balance analysis
│       ├── survey.js            ← 5-question readline CLI survey
│       └── buildPrompt.js       ← Claude prompt assembly (injects physio.md)
├── src/
│   ├── config.js                ← FITNESS_CONFIG (primary categories) + secondary attributes + scoring
│   ├── firebase.js              ← Firestore init (env vars)
│   ├── App.jsx                  ← root component, AppContext, 4-tab routing, modal rendering
│   ├── hooks/
│   │   ├── useWorkouts.js       ← Firestore session CRUD + real-time sync
│   │   ├── useSettings.js       ← per-user goal settings (Firestore)
│   │   ├── useStreak.js         ← weekly + daily streak calculations
│   │   └── useGoalAdvisor.js    ← Firestore listener for AI advisor report
│   ├── utils/
│   │   ├── weekUtils.js         ← Monday-anchored ISO week keys
│   │   ├── progressUtils.js     ← category progress vs target
│   │   ├── suggestionUtils.js   ← smart suggestions (secondary-aware)
│   │   └── celebrationUtils.js  ← confetti + Giphy API
│   └── components/
│       ├── BottomNav.jsx        ← 4-tab nav (This Week / Progress / Log / History)
│       ├── UserSelector.jsx     ← user switcher (Benton, Leo, Lauren, Jason)
│       ├── Dashboard/           ← "This Week" tab: rings, charts, suggestion banner
│       ├── Log/                 ← activity picker + session form
│       ├── History/             ← week-by-week history, CSV export
│       ├── Progress/            ← radar charts, ACWR gauge, calendar heatmap
│       └── shared/              ← modals (edit, settings, celebration, GoalAdvisorModal)
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

## Primary categories (FITNESS_CONFIG in src/config.js)

`strength` 💪 · `cardio` 🏃 · `mobility` 🤸 · `mindfulness` 🧘

Goals are per-user, per-category, in sessions or minutes per week.

## Secondary attributes (algorithm-only, shown in radar chart)

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

## AI Goal Advisor

### Running the script

```bash
# Setup (one-time)
# 1. Download serviceAccountKey.json from Firebase Console → Project Settings → Service Accounts
# 2. Create .env in project root:
#    GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
#    ANTHROPIC_API_KEY=sk-ant-...

# Run for one user
node scripts/goal-advisor.js --user=Jason
npm run goal-advisor   # defaults to Jason

# Run for all users (Lauren, Benton, Leo, Jason)
node scripts/goal-advisor.js --all
```

### How it works

1. Fetches all sessions + settings from Firestore for the user
2. Fetches previous recommendation (if any) for continuity
3. Calculates actual data window (capped at 8 weeks) — short history doesn't penalize
4. Analyzes completion rates, trends, secondary attribute balance, ACWR
5. Runs a 5-question survey (ground truth signal):
   - Q1: Effort level 1–5
   - Q2: Energy/recovery 1–5
   - Q3: Injury/pain flag
   - Q4: Focus area (strength/cardio/mobility/mindfulness/balance)
   - Q5: Goal direction (up / same / down)
6. Calls `claude-sonnet-4-6` with `physio.md` as system context
7. Outputs suggested goals with reasoning, focus activities, and 3-month trajectory
8. Saves report to Firestore at `users/{userId}/meta/goalAdvisor`
9. Optionally writes new goals back to Firestore

Survey Q5 (goal direction) overrides data — "down" makes underperforming goals more attainable, "up" allows a single increase if state is good, high fatigue blocks all increases.

### In-app display

The 🤖 AI Rec button appears in the top-right of both the **This Week** and **Progress** tabs when a report exists. Tap to open the GoalAdvisorModal which shows tone, ACWR bar, per-category goals + reasoning, focus activities, alerts, and trajectory note.

**Important:** `GoalAdvisorModal` is rendered in `App.jsx` (outside `<main>`) — not in individual tab components. This avoids a CSS stacking context bug where `slide-up` animation's `transform: translateY(0)` creates a new containing block that traps `position: fixed` children.

---

## Progress tab

- **Dual radar charts** — primary categories + secondary attributes (this week / 4-week avg / all-time avg). Primary radar normalizes to goal targets (1.0 = hitting goal). Secondary normalizes to max value in window.
- **ACWR gauge** — 7-day load ÷ 28-day avg/week with color zones (sweet spot 0.8–1.3). Needle uses screen-degree convention: 180°=left, 270°=top, 360°=right, clockwise sweep.
- **Goal hit rate trend pills** — ↑ ↓ → per category with goal hit rate %
- **Activity calendar heatmap** — 26-week vertical layout (weeks as rows, newest at top), color by dominant category, intensity by minutes. Inline detail panel expands below the tapped week row.
- **Recovery debt banner** — fires when Restoration < 75% of Peak Output over 4 weeks
- Time range selector: **4W / 12W / All**
- Section order: recovery alert → radars → radar legend → ACWR gauge → goal hit rate → calendar

---

## Firebase data model

```
users/
  {userId}/
    sessions/
      {sessionId}: { id, category, subtype, durationMinutes, notes, weekKey, occurredAt, loggedAt }
    meta/
      settings: { strength: { target, unit }, cardio: {...}, mobility: {...}, mindfulness: {...} }
      goalAdvisor: { suggestedGoals, reasoning, focusThisWeek, secondaryAlerts,
                     trajectoryNote, overallTone, analysis, generatedAt }
```

Week keys use Monday-anchored ISO format: `"YYYY-WW"` (e.g. `"2026-11"`).

---

## Deployment

**Live URL:** https://fitness.vargo.city

- GitHub Pages with custom domain via `public/CNAME`
- DNS: CNAME record `fitness` → `vargovargo.github.io` at vargo.city registrar
- GitHub repo Settings → Pages → Custom domain: `fitness.vargo.city` + Enforce HTTPS
- `vite.config.js` base is hardcoded to `'/'` (not the old `/workout-tracker/` subdirectory path)
- Firebase client config via `VITE_FIREBASE_*` env vars in `.env.local` (not committed)

### Environment files (not committed)

```
.env             ← GOOGLE_APPLICATION_CREDENTIALS, ANTHROPIC_API_KEY (for scripts)
.env.local       ← VITE_FIREBASE_* client config (for dev server)
serviceAccountKey.json  ← Firebase Admin service account
```

---

## Dev commands

```bash
npm run dev            # start Vite dev server (localhost:5173)
npm run build          # production build
npm run preview        # preview production build
npm run generate-icons # regenerate PNG icons (icon-180, icon-192, icon-512, og-preview)
npm run goal-advisor   # run terminal goal advisor (requires .env)
```

---

## Tech stack

- **React 18** + **Vite 5** + **Tailwind CSS 3**
- **Firebase Firestore** (real-time sync via `onSnapshot`)
- **firebase-admin** (server-side script access)
- **@anthropic-ai/sdk** (`claude-sonnet-4-6` for goal recommendations)
- **canvas-confetti** + Giphy API (celebration animations)
- PWA with service worker (`/public/sw.js`, cache: `fitness-tracker-v1`)

---

## Naming conventions

- Config constant: `FITNESS_CONFIG` (was `WORKOUT_CONFIG` — do not revert)
- Hook: `useWorkouts` (internal name kept; returns `{ sessions, addSession, ... }`)
- localStorage key: `${user}:workout_sessions` (kept as-is to preserve existing data)
- CSS animation: `slide-up` uses `transform` with `forwards` fill — any `position: fixed` modal must be rendered outside the animated element (i.e. in `App.jsx`)

---

## Status

| Feature | Status |
|---------|--------|
| Core PWA (log, history, streaks, celebrations) | ✅ Complete |
| Multi-user Firestore sync | ✅ Complete |
| Secondary fitness attributes config | ✅ Complete |
| physio.md reference document | ✅ Complete — **review activity scoring table** |
| Terminal goal advisor script | ✅ Complete |
| `--all` flag (run advisor for all users) | ✅ Complete |
| Smart suggestion banner (subtype-aware) | ✅ Complete |
| Progress tab (radar, ACWR, heatmap) | ✅ Complete |
| AI Rec button in app (both tabs) | ✅ Complete |
| Custom domain fitness.vargo.city | ✅ Code complete — DNS/Pages config needed if re-deploying |
| PWA iOS icon + iMessage OG preview | ✅ Complete |
| physio.md scoring table review by Jason | ⏳ Pending |

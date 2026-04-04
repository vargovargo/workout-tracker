# Physiology Reference — Workout Tracker Algorithm

This file is the "brain" behind the goal-setting algorithm. It is read by `scripts/goal-advisor.js`
each time it runs and is injected as context into the Claude prompt. **Edit freely** — the algorithm
will reflect your updates the next time you run the script.

---

## 1. User Profiles

### Jason — Mid-40s male, 5'10–5'11", ~180 lbs
- **VO2 max** declines ~10%/decade after age 25. Peak Output sessions (Zone 5/HIIT) are critical
  at this age — flag as concern if fewer than 1/week over any 4-week window.
- **Sarcopenia** accelerates after 40: muscle mass loss speeds up without resistance training.
  Strength is the most protective primary category. Never suggest reducing below 2 strength
  sessions/week.
- **Recovery is slower**: mid-40s bodies need 20–40% more recovery time than 20s. Restoration
  secondary score must keep pace with Peak Output score (minimum 1:1 ratio). Flag deficit.
- **Connective tissue** adapts more slowly. Structural/mobility work has high injury-prevention
  value. Minimum 2 structural-scoring sessions/week.
- **Sleep quality** directly affects testosterone and cortisol. Mindfulness/restoration activities
  protect training gains. Prioritize if Q2 (energy) is chronically low.
- **Mountain season goal**: ramp Aerobic Base and Structural scores in the 8–12 weeks before
  mountain season. The calendar heatmap makes seasonal periodization visible.
- **Progressive overload guideline**: maximum 10% increase per metric per week. Never increase
  more than 2 category targets in the same week.

### Lauren — Late 40s female
- **Peri/post-menopausal hormonal shift**: strength training becomes *more* important than at any
  prior life stage for bone density (osteoporosis prevention) and muscle mass. Minimum 2 strength
  sessions/week — non-negotiable.
- **Core and pelvic stability** have added importance due to connective tissue laxity changes.
  Structural secondary score should never be neglected.
- **Zone 2 cardio** is cardioprotective (CVD risk rises post-menopause). Flag if Aerobic Base
  is low for more than 3 consecutive weeks.
- **Restoration/mindfulness** directly affects hormonal balance. Sleep quality and stress
  management are not optional extras — they modulate training adaptation.
- Recovery is similar to Jason in timeline but joint inflammation risk is slightly higher.
  Flag if Structural score drops two weeks in a row.
- Progressive overload: same 10% guideline, but prioritize quality and form over volume.

### Benton — 14 years old, male, ~6'5", ~200 lbs, basketball-focused
- **CRITICAL — GROWTH PLATES**: Epiphyseal plates are still open. Absolutely NO heavy maximal
  loaded compound lifts (no 1RM testing, no heavy barbell squats/deadlifts with axial spine
  loading). Recommend bodyweight, resistance bands, light-moderate dumbbell work with excellent
  form only.
- **Basketball priorities**: explosive agility, aerobic base for 40-minute games, court
  coordination. Peak Output (plyometrics, sprints) and Aerobic Base are the top secondary
  priorities for sports performance.
- **Recovery is rapid at 14**: ACWR safe zone is slightly higher (≤1.4 vs ≤1.3 for adults).
  Young bodies bounce back quickly but sleep is essential for growth hormone release.
- **Growth spurts and coordination**: tall adolescents often lose proprioception during rapid
  growth. Structural secondary score (balance, movement quality) is especially important —
  basketball injury risk is high for lanky players with poor coordination.
- **Suggest only**: bodyweight exercises, agility drills, court skills, light resistance,
  plyometrics (with landing technique), sport-specific cardio. Frame all suggestions in
  basketball context when possible.

### Leo — 11 years old, male, ~115 lbs, climbing-focused, actively growing
- **CRITICAL**: No weighted or loaded exercises of any kind. Pure bodyweight, skill-based,
  and play-based activity only.
- **Growth spurts reduce flexibility**: bones grow faster than muscles at this age. Stretching
  and mobility work is a priority — often neglected, leads to problems (especially hamstring
  tightness). Flag if Structural score is low for 2+ weeks.
- **Climbing is excellent for development**: grip strength, upper body, problem-solving, spatial
  awareness, risk assessment, confidence. Support and encourage climbing as primary activity.
- **Recovery is extremely rapid**: children have the highest recovery capacity of any age group.
  ACWR concerns are minimal. No adult periodization frameworks.
- **Fun-first philosophy**: suggestions should be playful, exploratory, and framed around
  climbing goals and active play. Avoid clinical or adult-fitness language.
- **Focus areas**: climbing progression, flexibility/mobility maintenance, coordination through
  play (basketball, frisbee, swimming), breathing/mindfulness for focus.

---

## 2. Four Primary Categories

| Category | Label | Purpose |
|----------|-------|---------|
| `strength` | Strength 💪 | Resistance training, force production, muscle mass |
| `cardio` | Cardio 🏃 | Cardiovascular work, aerobic and anaerobic capacity |
| `mobility` | Mobility 🤸 | Range of motion, flexibility, movement quality |
| `mindfulness` | Mindfulness 🧘 | Mental recovery, stress management, CNS restoration |

---

## 3. Four Secondary Attributes (Cross-Cutting Lens)

These attributes cut across the primary categories to reveal physiological imbalances that
category counts alone cannot detect.

| Attribute | Key | Physiological Basis | What It Catches |
|-----------|-----|--------------------|--------------------|
| Aerobic Base | `aerobicBase` | Zone 2, fat oxidation, mitochondrial health (Attia Pillar 3) | Cardio sessions that are all high-intensity — neglecting the endurance foundation |
| Peak Output | `peakOutput` | Zone 5 / VO2 max, anaerobic capacity, power (Attia Pillar 4) | Missing the upper-intensity edge that is the #1 longevity cardiorespiratory marker |
| Structural Integrity | `structural` | Stability, proprioception, coordination, movement quality (Attia Pillar 1) | Neglecting the foundational pillar — highest injury-prevention value |
| Restoration | `restoration` | Parasympathetic activation, HRV recovery, tissue repair | Recovery not keeping pace with training load; overtraining risk |

**Why not endurance/agility/stamina/resilience?**
- Endurance and stamina overlap (both aerobic metrics)
- Agility is too narrow (sport-specific movement)
- The four attributes above catch the most medically important imbalances and map directly
  to Attia's longevity framework and ICFSR 2024 consensus

---

## 4. Activity → Secondary Scores

Scale: 0 = none, 1 = minor, 2 = moderate, 3 = primary contribution

| Activity | Category | Aerobic Base | Peak Output | Structural | Restoration |
|----------|----------|-------------|-------------|-----------|-------------|
| run (easy/moderate) | cardio | 3 | 1 | 0 | 0 |
| run (intervals/fast) | cardio | 1 | 3 | 0 | 0 |
| trail run | cardio | 3 | 2 | 2 | 0 |
| bike (steady) | cardio | 3 | 1 | 0 | 0 |
| row | cardio | 3 | 2 | 1 | 0 |
| swimming | cardio | 3 | 2 | 1 | 1 |
| basketball | cardio | 2 | 2 | 1 | 0 |
| soccer | cardio | 2 | 2 | 1 | 0 |
| frisbee | cardio | 1 | 1 | 2 | 0 |
| surfing | cardio | 1 | 2 | 3 | 1 |
| hike | cardio | 3 | 1 | 3 | 1 |
| Orange Theory | cardio | 1 | 3 | 0 | 0 |
| HIIT | strength | 1 | 3 | 1 | 0 |
| climbing | strength | 1 | 3 | 2 | 0 |
| weights | strength | 0 | 3 | 1 | 1 |
| core | strength | 0 | 2 | 3 | 1 |
| plyometrics | mobility | 1 | 3 | 2 | 0 |
| yoga | mobility | 0 | 0 | 2 | 3 |
| stretching | mobility | 0 | 0 | 1 | 3 |
| balance | mobility | 0 | 0 | 3 | 2 |
| meditation | mindfulness | 0 | 0 | 0 | 3 |
| breathing | mindfulness | 0 | 0 | 0 | 3 |
| journaling | mindfulness | 0 | 0 | 0 | 2 |
| reading | mindfulness | 0 | 0 | 0 | 2 |
| sauna | mindfulness | 0 | 0 | 0 | 3 |

**Default fallback** (session has no subtype recorded):
- strength: aerobicBase=0, peakOutput=2, structural=1, restoration=1
- cardio: aerobicBase=2, peakOutput=2, structural=0, restoration=0
- mobility: aerobicBase=0, peakOutput=0, structural=2, restoration=2
- mindfulness: aerobicBase=0, peakOutput=0, structural=0, restoration=3

---

## 5. Progressive Overload Rules

Based on ACSM guidelines and ACWR research:

1. **Maximum weekly increase**: ≤10% for any single metric (sessions or minutes)
2. **Maximum simultaneous increases**: raise at most 2 category targets per planning cycle
3. **Minimum before increasing**: must have hit current target ≥3 of the last 4 weeks
4. **ACWR sweet spot**: 7-day minutes / 28-day rolling average should be 0.8–1.3
   - >1.5: elevated injury risk — do not raise any targets
   - <0.8: detraining zone — may indicate illness or life disruption, check in
5. **Age adjustment (Jason/Lauren)**: when in doubt, err conservative. One increase at a time.
6. **Kids (Benton/Leo)**: do not apply adult progressive overload rules. Focus on enjoyment,
   skill development, and variety. Volume follows enthusiasm.

---

## 6. Survey Interpretation Guide

The 5-question survey is the **ground truth** signal. Data trends inform, but survey overrides.

| Q1 (Effort) | Q2 (Energy) | Action |
|-------------|-------------|--------|
| ≥4 | any | No target increases. Suggest more restoration/mobility this week. |
| any | ≤2 | No target increases. Flag recovery deficit. |
| 3 | 3 | Maintain current targets. Minor adjustments (±1 session) OK if trend supports it. |
| ≤2 | ≥4 | Eligible for one category increase IF Q5=yes AND data trend is positive. |
| ≤2 | 5 | Can consider increasing up to two categories IF Q5=yes AND trend positive. |

Q3 (Injury/pain): Any positive response → skip activities that stress the affected area.
Q4 (Focus area): Weight goal suggestions toward stated focus category.
Q5 (OK to push): Hard gate — if "n", no increases regardless of other signals.

---

## 7. Weekly Balance Targets (Adults)

Age-adjusted minimums per secondary attribute per week:

| Attribute | Minimum | Notes |
|-----------|---------|-------|
| Aerobic Base | Score ≥4 | Roughly 2 steady-state cardio sessions (Zone 2, 20–30 min each) |
| Peak Output | Score ≥2 | 1–2 high-intensity sessions (Attia: 1 is sufficient for 40s) |
| Structural | Score ≥4 | 2 stability/mobility sessions — most neglected attribute |
| Restoration | Score ≥ Peak Output score | Recovery must keep pace with intensity |

**For Benton**: Structural ≥4, Peak Output ≥3 (basketball performance), Aerobic Base ≥3
**For Leo**: Structural ≥4, Aerobic Base ≥2, Restoration ≥2 (flexibility priority)

---

## 8. References

- Attia, P. *Outlive: The Science and Art of Longevity* (2023). Four exercise pillars: stability,
  strength, Zone 2, Zone 5/VO2 max.
- ICFSR Global Consensus on Optimal Exercise for Healthy Longevity in Older Adults (2024).
  PubMed PMID: 39743381.
- American College of Sports Medicine (ACSM) Physical Activity Guidelines, 2024 update.
- Gabbett TJ et al. (2016). The training—injury prevention paradox. BJSM. Acute:Chronic
  Workload Ratio methodology.
- Impellizzeri FM et al. (2020). Internal and external training load: 15 years on. IJSPP.
- CTS (Carmichael Training Systems). "Why VO2 max Declines in Older Athletes." 2024.
- Ultimate Performance. "10 Golden Rules to Weight Training for Over 40s." 2024.

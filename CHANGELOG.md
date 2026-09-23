# Changelog

All notable changes to FuelCast are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [3.0.0] - 2026-09-23

### Added
- **AI Form Check:** record or pick a video or photo. On-device pose AI (Google MediaPipe Pose Landmarker) finds 33 body points per frame, and FuelCast grades 6 movements (squat, push-up, hip hinge, lunge, plank, jump-landing knee check) with a skeleton overlay, measurements, a score and the top cue. It includes a camera-angle check (calibrated on real footage), form-score history, "Check my form" links on exercises, and an optional Claude "coach's take" on the key frame.
- **Easier to use:** quick actions on Today (water, workout, form check, coach), a getting-started checklist for new athletes, and a "How FuelCast works" guide.
- Form scores on Progress; Train reorganized into Plan · Workouts · Form · History.
- Tests for the form engine, checklist and saved-data migration (85 total).

## [2.0.0] - 2026-09-22

### Added
- **Gym planner (Train tab):** 56-exercise library with coaching cues, 20 starter workouts built on youth resistance-training guidance, a custom workout builder, "customize a copy", workout history, and linking workouts to scheduled lift sessions.
- **Live workout logger:** reps and weight steppers, set check-off, automatic rest timer, effort (RPE) rating, and a post-workout refuel prompt.
- **Smart Coach:** on-device muscle-readiness model (lifts + practices + games), game-aware day modes, ranked workout picks with reasons, a one-tap workout generator, and automatic weight progression.
- **AI Coach (Coach tab):** chat with Claude (`claude-opus-5`) using structured outputs; replies can include a saveable workout (library exercises only), a recipe and shopping items. Works offline with on-device answers. The key is stored in the iOS Keychain.
- **Recipes:** 20 recipes with macros computed from ingredients, "great for" window tags, ready / almost / shop matching, and "what food do you have?" quick entry.
- **Shopping list:** weekly suggestions from the schedule, recipe gaps, typed items, share, and move-to-kitchen.
- **Progress tab:** strength days vs. guidelines and muscle readiness alongside fuel insights.
- Onboarding step for training goal, level, equipment and session length; Training and AI Coach sections in Settings.

### Changed
- Navigation is now five tabs: Today · Train · Fuel · Coach · Progress. Kitchen, Recipes, Shopping and Water live under Fuel.
- Saved data is upgraded automatically from v1 to v2.

## [1.0.0] - 2026-09-22

### Added
- **Fuel Forecast:** a timeline of pre-session meal, top-off snack, in-session fuel, and recovery windows built from the athlete's schedule, with early-morning and two-a-day handling ("Recover + reload").
- **Fuel Fit:** per-food ratings for each window, plus a combo optimizer that ranks the best 1–3 item plates from the athlete's own kitchen.
- **Schedule:** weekly and one-time sessions (practice, game, lift, conditioning) with a live forecast preview.
- **Hydrate:** a bottle tracker, an itemized daily goal that scales with training, and a sweat-rate test.
- **Insights:** Fuel Score, streaks, weekly chart, per-window hit rates, go-to foods, and the fueled-vs-unfueled energy comparison.
- **Onboarding** with an optional sample athlete (demo data is clearly labeled).
- **Settings:** units, bottle size, optional weight, demo loader, reset, and cited sources.
- Engine unit tests (Jest) and GitHub Actions CI.

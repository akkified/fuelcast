# FuelCast: Pitch Video Script (≤ 3:00)

**Event:** 2026 GATSA App Development Pitch · **Theme:** Fitness & Nutrition
**Deliverable:** one `.mp4`, **3:00 or shorter**, uploaded to myGATSA by **9:00 PM Friday, Sept 25**
**Target length:** about 2:45 (~390 spoken words at a steady pace). Rehearse with a timer. If you run long, shorten the technical section first.

Fill in the `[BRACKETS]` before recording.

---

## Required elements: where each one is covered

| Rule requirement | Where in the video |
|---|---|
| Meets the theme (Fitness & Nutrition) | 0:30, said out loud; the app covers both fitness and nutrition |
| Video up to 3 minutes | Timed to about 2:45 |
| Problem statement and target audience | 0:10–0:30 |
| App demonstration and walkthrough (**at least 4 key screens**) | 0:40–2:10: Today, Fuel window, Train / Smart Coach, Workout session, **Form Check**, Recipes, Shopping list, Coach, Progress (9 screens) |
| Technical explanation of how the app works | 2:10–2:45 |

| Rubric criterion | How this video earns a 9–10 |
|---|---|
| First impression and pitch quality | Cold-open hook, a live Form Check "wow" moment with the skeleton drawing on a teammate, fast cuts, captions |
| App innovation and problem solved | One app that connects *schedule → training → form → fuel → cooking*, with on-device computer vision, an explainable Smart Coach and a context-aware AI Coach, built safe for teens |
| Visual prototype and UI/UX walkthrough | A real working app on a real iPhone: 9 screens, quick actions, one continuous story |
| Technical clarity | Names the stack, the engine modules, the pose-estimation pipeline, the AI integration, privacy, and the tests |

---

## Script

### 0:00–0:10 · HOOK
**On screen:** Phone lock screen at 3:30 PM → a hand pulls a bag of chips from a backpack → a quick cut to a squat rack with "GAME TOMORROW" text on screen.

> **NARRATOR:** Practice in fifteen minutes. You skipped lunch, the only thing in your bag is chips, and you're planning heavy squats tonight, with a game tomorrow. Sound familiar?

### 0:10–0:30 · PROBLEM + TARGET AUDIENCE
**On screen:** Stat cards: `8M+ high-school athletes` → `No dietitian. No strength coach.` → `Apps built for adults and calorie counting`

> More than eight million students play high-school sports, but almost none have a dietitian, or a strength coach watching their form. So they guess. And the apps out there count calories or copy adult workouts.

### 0:30–0:40 · SOLUTION
**On screen:** The team on camera → the FuelCast icon → the welcome screen.

> We're [NAMES] from [SCHOOL] TSA. This is **FuelCast**, our Fitness and Nutrition app: your nutritionist, strength coach and form coach, in one iPhone app.

### 0:40–0:55 · TODAY *(screens 1–2)*
**On screen:** Today: the quick-action buttons, "Right now: Top-off snack", the timeline → tap **Plan it** → combos → **I ate this**.

> Add your schedule once, and Today becomes a fuel forecast: when to eat, what to grab from your own kitchen, and when to refuel. The buttons up top get you anywhere in one tap.

### 0:55–1:15 · TRAIN *(screens 3–4)*
**On screen:** Train → Plan: the Smart Coach card ("Game tomorrow: keep it light") with ✓ reasons → **Start** → the session: suggested weights, check off a set, the rest timer.

> Our Smart Coach tracks how recovered each muscle is from your lifts *and* your practices. With a match tomorrow, it says keep it light, and tells you why. Workouts pre-fill your weights and time your rest.

### 1:15–1:40 · FORM CHECK *(screen 5, the "wow" moment)*
**On screen:** Train → Form → Squat → **Record a video** → a teammate does 2–3 squats filmed from the side → "Finding your joints…" → the result: score ring, **skeleton overlay**, "Focus on this", measurements. Quick cut: a jump-landing check flagging knees caving in.

> Here's our favorite part: Form Check. Film a few squats, and on-device AI finds thirty-three points on your body, measures your joint angles at the bottom of the rep, and tells you the one thing to fix. It even catches knees caving in on jump landings, a major ACL-injury risk. And your video never leaves your phone.

### 1:40–1:55 · RECIPES + SHOPPING *(screens 6–7)*
**On screen:** Fuel → Recipes: type "eggs, tortillas, cheese" → Ready to make → open a recipe → **Add missing to shopping list** → the List tab.

> Type what's in your fridge for recipes you can make right now, and one tap turns what's missing into a shopping list for your week.

### 1:55–2:10 · COACH + PROGRESS *(screens 8–9)*
**On screen:** Coach: a question → a reply with a workout card → **Save**. Then Progress: fuel vs. energy, muscle readiness, form scores. Keep the "Sample athlete · demo data" badge visible.

> Ask our AI Coach, powered by Grok, anything. It knows your schedule and your kitchen. And Progress shows the payoff: our sample athlete rates her energy about [READ THE NUMBER ON SCREEN] points higher on days she fuels.

### 2:10–2:45 · TECHNICAL EXPLANATION
**On screen:** The README "How it works" diagram, then the Form Check pipeline diagram from ARCHITECTURE.md (section 5.11). Flash `npm test` with 89 passing tests.

> Under the hood, FuelCast is a native iPhone app in React Native and TypeScript, built on a tested engine. Fuel Fit scores food combos against American College of Sports Medicine targets. The Smart Coach models muscle fatigue and follows youth strength guidelines. Form Check runs Google's MediaPipe pose model right on the phone, then our geometry engine grades the joint angles. The AI Coach uses Grok with structured outputs. And eighty-nine automated tests check it all.

### 2:45–2:55 · CLOSE
**On screen:** The Today screen → the logo card: **FuelCast: Train smart. Fuel smart.** Team names and chapter.

> No calorie counting. No guessing. Just a plan, and a coach, that fit your season. This is FuelCast.

---

## Shot list and recording guide

### Before you record
1. Run the app on an iPhone (README: `npx expo start`, then scan the QR code with Expo Go).
2. Tap **Explore with a sample athlete** (or Settings → Load sample athlete).
3. **Timing trick:** the sample athlete practices Mon/Tue/Thu at 3:45 PM and has matches Wed/Fri at 6 PM. Record between **2:45 and 3:15 PM on a Tuesday** and Today shows *"Right now: Top-off snack"*, and Smart Coach says *"Game tomorrow: keep it light"*, which matches the hook.
4. **Form Check:** run it once on Wi-Fi beforehand so the pose model downloads. Film from the side, with the whole body in frame and good light. For the jump-landing clip, film from the front. Record one good set and one quarter-squat set so you can show a fix.
5. **AI Coach (Grok):** your key loads automatically in Expo Go from `.env.local`, but the xAI account needs **credits** first (console.x.ai → Billing). Test one question before filming. No credits? Use the on-device replies. Tap the quick prompts "Build me a 30-min workout" and "What can I cook with my kitchen?", and change the narration to "…or ask the Coach, which even works offline."
6. Do Not Disturb on, full battery, max brightness.
7. Record with **Control Center → Screen Recording**.

### Shots
| # | Shot | Source |
|---|---|---|
| 1 | Lock screen, chips, squat clip | Phone camera (B-roll) |
| 2 | Stat cards | Canva / CapCut / Keynote |
| 3 | Team intro + icon | Camera / `assets/icon.png` |
| 4 | Today → Plan it → combos → I ate this | Screen recording |
| 5 | Train: Smart Coach → Start → log a set → rest timer | Screen recording |
| 5b | Form Check: record a teammate's squats (side view) → skeleton + score; a jump landing from the front | Screen recording + a second phone filming the athlete (optional B-roll) |
| 6 | Recipes: type foods → recipe → add missing → List → move to kitchen | Screen recording |
| 7 | Coach question → reply with workout + recipe → Save | Screen recording |
| 8 | Progress: fuel vs. energy, muscle readiness | Screen recording |
| 9 | Architecture diagram + `npm test` | Screenshot / terminal |
| 10 | End card | Editor |

### Editing tips
- Record the voice-over separately in a quiet room. Clear audio is the biggest "First Impression" win.
- Use fast cuts (1–3 seconds per action), with the phone recording in a device frame and zooms on taps.
- Add captions for the whole narration (CapCut auto-captions).
- Keep music at 10–15% under the voice.
- Export 1080p, H.264, `.mp4`, and **check the final length is under 3:00**.

### A note on originality
The rules require entries to be the chapter's own original work from this school year. The feature direction (gym planner, AI workout recommendations, shopping list, recipes from your food) came from your team; make sure you can explain every part in your own words. Ask your advisor about GATSA's policy on AI-assisted development, and disclose it if required.

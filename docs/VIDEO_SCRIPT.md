# FuelCast: Pitch Video Script (≤ 3:00)

**Event:** 2026 GATSA App Development Pitch · **Theme:** Fitness & Nutrition
**Deliverable:** one `.mp4`, **3:00 or shorter**, uploaded to myGATSA by **9:00 PM Friday, Sept 25**
**Target length:** about 2:45 (~400 spoken words at a steady pace). Rehearse with a timer. If you run long, shorten the technical section first.

Fill in the `[BRACKETS]` before recording.

---

## Required elements: where each one is covered

| Rule requirement | Where in the video |
|---|---|
| Meets the theme (Fitness & Nutrition) | 0:35, said out loud; the app covers both fitness and nutrition |
| Video up to 3 minutes | Timed to about 2:45 |
| Problem statement and target audience | 0:10–0:35 |
| App demonstration and walkthrough (**at least 4 key screens**) | 0:45–2:10: Today, Fuel window, Train / Smart Coach, Workout session, Recipes, Shopping list, Coach chat, Progress (8 screens) |
| Technical explanation of how the app works | 2:10–2:45 |

| Rubric criterion | How this video earns a 9–10 |
|---|---|
| First impression and pitch quality | Cold-open hook, fast cuts between real phone recordings, captions, and a strong closing line |
| App innovation and problem solved | One app that connects *schedule → training → fuel → cooking → shopping*, with an explainable Smart Coach and a context-aware AI Coach, built safe for teens |
| Visual prototype and UI/UX walkthrough | A real working app on a real iPhone showing 8 screens in one continuous story |
| Technical clarity | Names the stack, the engine modules and their algorithms, the AI integration (structured outputs, context, safety), the data storage, and the tests |

---

## Script

### 0:00–0:10 · HOOK
**On screen:** Phone lock screen at 3:30 PM → a hand pulls a bag of chips from a backpack → a quick cut to a squat rack with "GAME TOMORROW" text on screen.

> **NARRATOR:** Practice in fifteen minutes. You skipped lunch, the only thing in your bag is chips, and you're planning heavy squats tonight, with a game tomorrow. Sound familiar?

### 0:10–0:35 · PROBLEM + TARGET AUDIENCE
**On screen:** Stat cards: `8M+ high-school athletes` → `No dietitian. No strength coach.` → `Apps built for adults and calorie counting`

> More than eight million students play high-school sports, but almost none have a dietitian or a strength coach. So they guess: when to eat, what to lift, what to cook. And the apps out there count calories or copy adult workouts, and none of them know you have a game tomorrow.

### 0:35–0:45 · SOLUTION
**On screen:** The team on camera → the FuelCast app icon → the welcome screen.

> We're [NAMES] from [SCHOOL] TSA. This is **FuelCast**, our Fitness and Nutrition app: one iPhone app that plans your training, your fuel, and your kitchen around your real schedule.

### 0:45–1:05 · TODAY + FUEL WINDOW *(screens 1–2)*
**On screen:** The Today tab (score ring, "Right now: Top-off snack", timeline). Tap **Plan it** → the fuel window with its combos → tap **I ate this**.

> Enter your practices and games once, and Today becomes a fuel forecast: when to eat before practice, what to grab, and when to refuel. Tap a window, and FuelCast scores every combo of food you actually have. One tap logs it.

### 1:05–1:30 · TRAIN: SMART COACH + WORKOUT *(screens 3–4)*
**On screen:** The Train tab: the Smart Coach card ("Game tomorrow: keep it light") and ranked picks with ✓ reasons. Tap **Start** → the workout session: suggested weights, check off a set, the rest timer counting down.

> Train is a full gym planner: twenty starter workouts, a custom builder, and a one-tap generator. Our Smart Coach tracks muscle readiness from lifts *and* practices, so with a match tomorrow it says keep it light, and tells you why. In a workout, it pre-fills your weights, adds about five percent when you hit every rep, and times your rest.

### 1:30–1:50 · RECIPES + SHOPPING *(screens 5–6)*
**On screen:** Fuel → Recipes: type "eggs, tortillas, cheese" → "Ready to make" updates. Open a recipe → **Add missing to shopping list** → the List tab with the week's suggestions → check items → **Put bought items in my kitchen**.

> Type what food you have, and FuelCast shows recipes you can make right now, tagged by the fuel window they fit. Missing something? One tap adds it to a shopping list that also plans your week.

### 1:50–2:10 · AI COACH + PROGRESS *(screens 7–8)*
**On screen:** The Coach tab: type "I have a match tomorrow. What should I lift today and eat after?" → the reply with a workout card and a recipe → tap **Save**. Quick cut to Progress: streak, the fuel-vs-energy card, muscle readiness. Keep the "Sample athlete · demo data" badge visible.

> Or just ask our AI Coach, powered by Claude. It knows your schedule, recovery and kitchen, and answers with a workout you can save, a recipe, and a shopping list. And Progress shows the payoff: with a sample athlete's data loaded, she rates her energy about [READ THE NUMBER ON SCREEN] points higher when she fuels before training.

### 2:10–2:45 · TECHNICAL EXPLANATION
**On screen:** The architecture diagram (README "How it works"). Highlight each box as it's named. Flash `npm test` showing 67 passing tests.

> Under the hood, FuelCast is a native iPhone app built with React Native, Expo and TypeScript on a tested engine. The **forecast engine** times fuel windows. **Fuel Fit** scores food combos against American College of Sports Medicine targets. The **Smart Coach** models muscle fatigue that halves each day and follows NSCA and pediatric strength guidelines. The **AI Coach** calls Claude with structured outputs, so its workouts only use exercises from our library, and it never sees your name or weight. Everything else stays on your phone, checked by 67 automated tests.

### 2:45–2:55 · CLOSE
**On screen:** The Today screen → the logo card: **FuelCast: Train smart. Fuel smart.** Team names and chapter.

> No calorie counting. No guessing. Just a plan that fits your season. This is FuelCast.

---

## Shot list and recording guide

### Before you record
1. Run the app on an iPhone (README: `npx expo start`, then scan the QR code with Expo Go).
2. Tap **Explore with a sample athlete** (or Settings → Load sample athlete).
3. **Timing trick:** the sample athlete practices Mon/Tue/Thu at 3:45 PM and has matches Wed/Fri at 6 PM. Record between **2:45 and 3:15 PM on a Tuesday** and Today shows *"Right now: Top-off snack"*, and Smart Coach says *"Game tomorrow: keep it light"*, which matches the hook.
4. **AI Coach:** to show a live Claude reply, connect a key in Settings → AI Coach (ask a parent or guardian; it's a paid account). No key? Use the on-device replies. Tap the quick prompts "Build me a 30-min workout" and "What can I cook with my kitchen?", and change the narration to "…or ask the Coach, which even works offline."
5. Do Not Disturb on, full battery, max brightness.
6. Record with **Control Center → Screen Recording**.

### Shots
| # | Shot | Source |
|---|---|---|
| 1 | Lock screen, chips, squat clip | Phone camera (B-roll) |
| 2 | Stat cards | Canva / CapCut / Keynote |
| 3 | Team intro + icon | Camera / `assets/icon.png` |
| 4 | Today → Plan it → combos → I ate this | Screen recording |
| 5 | Train: Smart Coach → Start → log a set → rest timer | Screen recording |
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

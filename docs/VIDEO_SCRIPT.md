# FuelCast: Pitch Video Script (≤ 3:00)

**Event:** 2026 GATSA App Development Pitch · **Theme:** Fitness & Nutrition
**Deliverable:** one `.mp4`, **3:00 or shorter**, uploaded to myGATSA by **9:00 PM Friday, Sept 25**
**Target length:** about 2:50 (~440 spoken words at a steady pace). Leave yourself a buffer, because anything over 3:00 risks a penalty.

Fill in the `[BRACKETS]` before recording.

---

## Required elements: where each one is covered

| Rule requirement | Where in the video |
|---|---|
| Meets the theme (Fitness & Nutrition) | 0:40 (said out loud) plus the whole concept |
| Video up to 3 minutes | Script is timed to about 2:50 |
| Problem statement and target audience | 0:12–0:40 |
| App demonstration and walkthrough (**at least 4 key screens**) | 0:50–2:10: Onboarding, Schedule/Session editor, Today, Fuel window, Kitchen, Hydrate, Insights (7 screens) |
| Technical explanation of how the app works | 2:10–2:45 |

| Rubric criterion | How this video earns a 9–10 |
|---|---|
| First impression and pitch quality | Cold-open hook, clean screen recordings, captions, steady pacing, a strong closing line |
| App innovation and problem solved | Timing-based fueling built from *your* schedule and *your* kitchen; no calorie counting; a personal fuel-vs-energy insight |
| Visual prototype and UI/UX walkthrough | A real working app on a real iPhone, 7 screens, one continuous user story |
| Technical clarity | Names the stack, the architecture layers, the 4 engine modules, the data flow, the storage, and the tests |

---

## Script

### 0:00–0:12 · HOOK
**On screen:** Close-up of a phone lock screen showing 3:30 PM. Pan to a backpack; a hand pulls out a bag of chips.
**Text overlay:** `3:30 PM · Practice at 3:45`

> **NARRATOR:** It's 3:30. Practice starts in fifteen minutes. You skipped lunch, and the only thing in your bag is a bag of chips. Sound familiar?

### 0:12–0:40 · PROBLEM + TARGET AUDIENCE
**On screen:** Simple animated stat cards (Canva, CapCut, or Keynote):
`8M+ high-school athletes` → `Sports dietitians: rare in high school` → `Most nutrition apps = calorie counting`

> More than eight million students play high-school sports. But almost none of them have a sports dietitian, so nobody teaches them the part that matters most: **timing**. When to eat before practice. What to grab from what's actually in your kitchen. How much to drink in Georgia heat. And the apps that exist? They count calories and push weight goals. That's the wrong tool for a fifteen-year-old.

### 0:40–0:50 · SOLUTION
**On screen:** Team on camera (or the app icon animating in), then the FuelCast welcome screen.

> We're [NAMES] from [SCHOOL] TSA, and this is **FuelCast**, a fuel forecast for game day. It's our Fitness and Nutrition app, built for high-school athletes.

### 0:50–1:05 · ONBOARDING + SCHEDULE *(screens 1–2)*
**On screen (iPhone recording):** Onboarding step 2 (sport, bottle, optional weight) → Schedule → **+ Add** → tap *Practice*, the Mon/Tue/Thu chips, press **+** on "Starts at" and watch the forecast preview update at the bottom.

> Setup takes under a minute: your sport, your water bottle, and, only if you want, your weight. Then add your practices and games once. As I change the start time, FuelCast re-plans every fuel window live.

### 1:05–1:25 · TODAY / FUEL FORECAST *(screen 3)*
**On screen:** The Today tab. Slowly scroll the timeline. Point out the Fuel Score ring and the "Right now" card.

> This is Today, a forecast like the weather, but for fuel. A pre-practice meal three to four hours out, which for a 3:45 practice is school lunch. A top-off snack, fuel during long sessions, and a recovery window. The ring is my Fuel Score for the day.

### 1:25–1:45 · FUEL WINDOW + KITCHEN *(screens 4–5)*
**On screen:** Tap **Plan it** → the window screen (Why it matters, targets, best picks with scores) → tap a combo → **I ate this**. Quick cut to the **Kitchen** tab with *Top-off* selected: *Banana: Great fit*, then *Potato chips: Not now*.

> Tap a window and FuelCast explains why it matters, shows gram targets, and builds the best combos from foods I actually have. A banana? Great fit. Chips? Not now: too much fat right before you play. One tap, and it's logged.

### 1:45–1:57 · HYDRATE *(screen 6)*
**On screen:** Hydrate tab: tap **+1 bottle** (the bottle fills), scroll to *How your goal is set*, then the sweat-test result card.

> Hydrate tracks bottles against a goal that grows on training days, and the sweat test turns two weigh-ins into a personal "drink this much per hour" number.

### 1:57–2:10 · INSIGHTS *(screen 7)*
**On screen:** A recovery window's energy check-in (tap 🔥), then the **Insights** tab: streak, weekly bars, and the *Fuel vs. energy* card. Keep the "Sample athlete · demo data" badge visible.

> After every session, one tap: how did it feel? With a sample athlete's two weeks loaded, FuelCast shows she rates her energy about [READ THE NUMBER ON SCREEN] points higher when she fuels before training. That's proof from your own data.

### 2:10–2:45 · TECHNICAL EXPLANATION
**On screen:** The architecture diagram from `docs/ARCHITECTURE.md` (sections 2 and 4). Highlight each box as it's named. Optionally flash the code files and the green test run (`npm test`).

> Under the hood, FuelCast is a native iPhone app built with React Native and Expo, written in TypeScript. The core is a pure TypeScript engine with four modules. The **forecast engine** turns each session into timed windows and resolves conflicts on two-a-day schedules. The **Fuel Fit optimizer** scores every one-, two-, and three-item combination in your kitchen against gram targets from the American College of Sports Medicine's position statement. The **hydration module** uses the standard sweat-rate formula. And the **insights engine** compares your energy on fueled versus unfueled days. Everything is stored on the phone with AsyncStorage: no accounts, no servers, no calorie counts. And 35 automated tests check the engine on every update.

### 2:45–2:55 · CLOSE
**On screen:** The Today screen on the phone, then the logo card: **FuelCast: Know when to fuel.** Add the team names and chapter.

> FuelCast doesn't count calories. It helps athletes show up ready. Know when to fuel, and play like it. This is FuelCast.

---

## Shot list and recording guide

### Before you record
1. Run the app on an iPhone (see the README: `npx expo start`, then scan the QR code with Expo Go).
2. In the app: **Settings → Load sample athlete (demo)**, or on a fresh install tap **Explore with a sample athlete**.
3. **Timing trick:** the sample athlete practices Mon/Tue/Thu at 3:45 PM. Record between **2:45 and 3:15 PM on one of those days**, and the Today card will say *"Right now: Top-off snack"*, which matches the hook exactly. (On Wed/Fri the match is at 6:00 PM, so its top-off is 5:00–5:30 PM.)
4. Turn on **Do Not Disturb**, set brightness to max, and charge the phone to 100% so the status bar looks clean.
5. Record the screen with **Control Center → Screen Recording** (add it in Settings → Control Center if it's missing).

### Shots
| # | Shot | Source |
|---|---|---|
| 1 | Lock screen at 3:30, chips from a backpack | Phone camera (B-roll) |
| 2 | Stat cards | Canva / CapCut / Keynote |
| 3 | Team intro or logo | Camera / `assets/icon.png` |
| 4 | Onboarding → add session with live preview | iPhone screen recording |
| 5 | Today timeline scroll | iPhone screen recording |
| 6 | Plan it → window → pick → I ate this | iPhone screen recording |
| 7 | Kitchen: Top-off: banana vs. chips | iPhone screen recording |
| 8 | Hydrate: +1 bottle, sweat-test result | iPhone screen recording |
| 9 | Energy check-in → Insights | iPhone screen recording |
| 10 | Architecture diagram + test run | Screenshot of the diagram or `npm test` in the terminal |
| 11 | End card | Editor |

### Editing tips (for the "First Impression" score)
- Record the voice-over **separately** in a quiet room (a closet with clothes works well). Crisp audio matters more than anything else.
- Put the screen recording inside a phone frame on a dark background, and zoom in (about 120%) on whatever you're tapping.
- Add **captions** for the whole narration. CapCut's auto-captions work well.
- Keep background music at roughly 10–15% volume under the voice.
- Export **1080p, H.264, .mp4**. Check that the final length is **under 3:00** before uploading.

### A note on originality
The competition requires entries to be the chapter's original work, created this school year. Before submitting, ask your advisor about GATSA's policy on AI-assisted development, and make sure your team can explain every part of the app in your own words.

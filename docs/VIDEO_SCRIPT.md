# FuelCast: Demo Video Script (voice-over, ≤ 3:00)

**Event:** 2026 GATSA App Development Pitch · **Theme:** Fitness & Nutrition
**Format:** the whole video is a screen recording of FuelCast on an iPhone, with our presenter's voice-over. No slides, no presenter on camera.
**Submit:** one `.mp4`, **3:00 or shorter**, uploaded to myGATSA by **9:00 PM Friday, Sept 25**
**Length:** about 2:45 (~400 spoken words). Lines marked *(trim)* can be cut if you run long.

---

## Top 3 features

1. **AI Form Check.** Film a few reps; AI running on the phone finds 33 body points, measures your joint angles at the key moment, and tells you the one thing to fix. It also checks jump landings for knees caving in (an ACL-injury risk). The video never leaves the phone.
2. **Fuel Forecast.** Enter your practices and games once, and FuelCast builds a timeline of exactly when to eat, then scores the best food combos from what's already in your kitchen.
3. **Smart Coach.** A gym planner that tracks muscle recovery from lifts *and* practices, knows when your games are, recommends the right workout with reasons, and pre-fills your weights.

*(In the video they appear in the order 2 → 3 → 1, so Form Check lands as the big finish.)*

---

## Required elements: where each one is covered

| GATSA requirement | Where |
|---|---|
| Meets the theme (Fitness & Nutrition) | Every feature is fitness or nutrition; the close ties them together |
| Up to 3 minutes | About 2:45 |
| Problem statement and target audience | 0:00–0:35 |
| App demonstration and walkthrough (4+ key screens) | 0:35–2:10: Today, Fuel window, Train / Smart Coach, Workout session, Form Check setup, Form Check result (6+ screens) |
| Technical explanation | 2:10–2:45, over the Progress and Settings screens |

---

## Script

Each block lists **what's on screen** (what to tap while recording) and the **voice-over**.

### 0:00–0:35 · Open: problem and audience

**On screen:** Tap the FuelCast icon → the Welcome screen → the **Today** tab. Let the timeline sit, then scroll slowly.

> **VO:** It's three-thirty. Practice starts at three forty-five, you skipped lunch, and you're planning heavy squats the night before a game. For high-school athletes, that's a normal day, because almost none of us have a dietitian or a strength coach.
>
> FuelCast is built for high-school athletes, ages fourteen to eighteen, who train almost every day. Knowing that food and training matter isn't the hard part. Timing, form, and planning around a real schedule are. And the apps out there? They just count calories.

### 0:35–1:05 · Feature 1 on screen: Fuel Forecast

**On screen:** On Today, show the **"Right now: Top-off snack"** card → scroll the timeline → tap **Plan it** → the window screen: "Why it matters", target pills, the three combos with scores → tap the top combo → **I ate this** → back on Today, the Fuel Score ring goes up.

> **VO:** First, the Fuel Forecast. Enter your practices and games once, and FuelCast builds your day: a meal three to four hours before, a top-off snack right before, and recovery after. Tap a window, and it searches every combination of food in your kitchen and scores each one against sports-nutrition targets. One tap logs it, and your Fuel Score goes up.

### 1:05–1:35 · Feature 2 on screen: Smart Coach

**On screen:** Tap the **Train** tab → the Smart Coach card ("Game tomorrow: keep it light") with the ✓ reasons under each workout → tap **Start** → the workout session: suggested weights, tap ✓ on a set, the rest timer counts down.

> **VO:** Next, Smart Coach. It tracks how recovered each muscle is from your lifts *and* your practices. With a game tomorrow, instead of heavy legs, it says keep it light, and tells you why. Start a workout, and it pre-fills your weights, adds about five percent when you've hit every rep, and times your rest.

### 1:35–2:10 · Feature 3 on screen: AI Form Check

**On screen:** Train → **Form** → **Squat** → the setup card → **Choose a video** (a teammate's squats, filmed from the side) → "Finding your joints…" progress bar → the result: score ring, **skeleton drawn on the athlete**, "Focus on this", then scroll through the measurements.

> **VO:** And our favorite: AI Form Check. Pick a clip of your squats, and an AI model running right on the phone finds thirty-three points on your body in every frame. FuelCast finds the bottom of your rep, measures your knee and hip angles, and tells you the one thing to fix. It even checks jump landings for knees caving in, a major ACL-injury risk. *(trim)* And your video never leaves your phone.

### 2:10–2:45 · How it works (technical explanation)

**On screen:** Tap **Progress** and scroll slowly (Fuel Score chart, muscle readiness, form scores) → tap the ⚙️ on Today → scroll to **The science** list of sources.

> **VO:** Here's how it works. FuelCast is a native iPhone app built with React Native and Expo, written in TypeScript. Under the hood is a tested engine. The forecast engine times every fuel window from your schedule. Fuel Fit scores food against American College of Sports Medicine targets. Smart Coach models muscle fatigue that fades every day and follows youth strength-training guidelines. Form Check runs Google's MediaPipe pose model on the phone, and our geometry engine grades the angles. Your data stays on your phone, and ninety-five automated tests check that it all works.

### 2:45–2:55 · Close

**On screen:** Back to **Today**. Hold on the Fuel Score ring for the last line.

> **VO:** No calorie counting. No guessing. Just the right fuel, the right workout, and the right form, planned around your season. This is FuelCast, from [SCHOOL NAME] TSA.

---

## Recording guide

### Set up the phone
1. Run the app on the iPhone (`cd ~/fuelcast && npx expo start`, then scan the QR code with Expo Go).
2. Load the sample data: **Settings → Load sample athlete**. (It shows a "Sample athlete" badge. The voice-over says "you" and "your" throughout, so it never claims the data is ours.)
3. **Timing trick:** record the Today and Train parts between **2:45 and 3:15 PM on a Tuesday**. The sample athlete has practice at 3:45 and a match Wednesday, so Today shows *"Right now: Top-off snack"* and Smart Coach shows *"Game tomorrow: keep it light"*, which matches the voice-over.
4. **Form Check clip:** beforehand, film a teammate doing 3 slow bodyweight or goblet squats **from the side**: phone at hip height, whole body in frame, good light, plain background, under 10 seconds. Save it to Photos. Run Form Check once on Wi-Fi before recording so the pose model is already downloaded.
5. Do Not Disturb on, brightness up, battery charged.

### Record
- Record each block as its own clip with **Control Center → Screen Recording**. Tap slowly and pause about 1 second on each result so viewers can read it.
- Record the **voice-over separately** in a quiet room (a closet works), reading from this script. Clear audio is the biggest "First Impression" win.

### Edit (CapCut or iMovie)
- Line up each voice-over block with its screen clip; trim dead time between taps.
- Zoom in (about 120%) on the key moments: the combo scores, the Smart Coach reasons, and the skeleton on the Form Check result.
- Add captions for all narration (CapCut auto-captions) and quiet background music (10–15% volume).
- Put a 2-second title card at the start ("FuelCast · [School] TSA") only if it fits under 3:00.
- Export **1080p, H.264, `.mp4`**, and check that the final length is **under 3:00**.

### Before uploading
- Watch the whole video once with sound.
- Fill in **[SCHOOL NAME]**.
- Confirm `npm test` still says **95 passed** (the voice-over quotes that number).
- Upload to **myGATSA** before **9:00 PM Friday, Sept 25**.

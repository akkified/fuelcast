# 👋 Start here (team guide)

Everything the team needs to run FuelCast, record the video, and submit it.

**Deadline:** upload the video (`.mp4`, **3:00 or shorter**) to **myGATSA** by **9:00 PM Friday, Sept 25, 2026**.

| You want to… | Open |
|---|---|
| Read the video script (voice-over + what to tap) | [docs/VIDEO_SCRIPT.md](docs/VIDEO_SCRIPT.md) |
| Check off every requirement before uploading | [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) |
| Understand the app and its features | [README.md](README.md) |
| Answer "how does it work?" questions | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/RESEARCH.md](docs/RESEARCH.md) |
| See every screen | [docs/screenshots](docs/screenshots) |

---

## 1. Run the app on an iPhone (about 10 minutes, first time)

You need a Mac or PC with **Node.js 20+** ([nodejs.org](https://nodejs.org), the LTS download) and an iPhone with the free **Expo Go** app from the App Store. The computer and phone must be on the **same Wi-Fi**.

```bash
git clone https://github.com/akkified/fuelcast.git
cd fuelcast
npm install
npx expo start
```

A QR code appears in the terminal. Open the iPhone **Camera**, point it at the QR code, and tap the banner to open FuelCast in Expo Go.

- If the phone can't connect (school Wi-Fi often blocks it), stop the server and run `npx expo start --tunnel` instead.
- Keep the terminal open while you use the app.
- To check nothing is broken: `npm test` should end with **95 passed**.

## 2. Load the demo data

In the app: **Explore with a sample athlete** on the welcome screen, or **⚙️ Settings → Load sample athlete (demo)**.

The script's timing depends on this sample athlete. Record the Today and Train parts **between 2:45 and 3:15 PM on a Tuesday**, so the app shows "Right now: Top-off snack" and "Game tomorrow: keep it light", which the voice-over talks about.

## 3. Record the video

Follow **[docs/VIDEO_SCRIPT.md](docs/VIDEO_SCRIPT.md)**. Short version:

1. **Form Check clip first:** film a teammate doing 3 slow squats **from the side** (phone at hip height, whole body in frame, good light). Save it to Photos. Run Form Check once on Wi-Fi so the pose model downloads before you record.
2. Turn on Do Not Disturb. Screen-record each script block (Control Center → Screen Recording).
3. Record the voice-over separately in a quiet room, reading the **VO** lines.
4. Edit in CapCut or iMovie: line up voice with clips, add captions, export **1080p `.mp4`**, and check it's **under 3:00**.
5. Replace **[SCHOOL NAME]** in the closing line with our chapter name.

## 4. Submit

Go through [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md), then upload the `.mp4` to **myGATSA** before 9:00 PM Friday.

---

## Good to know

- **The AI chat coach (Coach tab) is optional and not in the script.** It needs a Grok or Claude account with credits. Without one, the Coach tab still answers the quick-prompt buttons offline. Everything else, including AI Form Check, works with no account.
- **Never commit API keys.** Keys go in `.env.local`, which git ignores. See `.env.example`.
- **Form Check** runs on the phone. The only network use is a one-time download of the pose model.
- The app is education, not medical advice (see the disclaimer in the README).

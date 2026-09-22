# Contributing to FuelCast

Thanks for helping! FuelCast is a student project, and we want it to stay simple, safe, and well-tested.

## Setup

```bash
npm install
npx expo start        # scan the QR code with Expo Go on your iPhone
npm run web           # or run it in a browser
```

## Before opening a pull request

```bash
npm run check         # TypeScript type-check + Jest tests (this is what CI runs)
```

## Ground rules

1. **Business logic lives in `src/engine/`** as pure functions with no React imports, and every rule needs a unit test in `__tests__/`.
2. **Screens live in `app/`** (Expo Router: file name = route). Shared UI goes in `src/ui/`.
3. **Cite the science.** Any change to fueling or hydration rules must reference a position statement or peer-reviewed source in `docs/RESEARCH.md`.
4. **Teen-safe by design:** never add calorie counts, weight-loss goals, or language that labels foods as "bad."
5. **Privacy:** no network calls, analytics, or accounts without a team discussion first.

## Commit messages

Use short, imperative subjects, for example `Add nut-free filter to combo search`.

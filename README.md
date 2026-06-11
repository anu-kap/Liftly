# Liftly 🏋️ — Beautiful Fitness Tracker

A Strong-style workout tracker as a mobile-first web app (PWA), with a revamped UI,
interactive progress charts, goal-driven workout generation, and **progressive
overload coaching** that tells you exactly what sets × reps × weight to hit each session.

Built with React + TypeScript + Vite + Tailwind + Recharts. Data is stored locally
(works fully offline) and syncs to Firestore when you sign in with Google.

## Features

- **Workout logging** — templates, freestyle workouts, warmup/working sets, rest timer with ring countdown, vibration + beep
- **Progressive overload engine** — double-progression coaching per exercise (hit top of rep range → add weight), paced against your goal date using estimated 1RM (Epley)
- **Goals** — set target weight × reps × date per lift; dashboard shows pace ("on track / behind")
- **Plan generator** — full-body / upper-lower / PPL plans from your days-per-week, focus, and goals; fully editable
- **Insights** — interactive e1RM / top-weight / volume / reps charts per exercise, weekly volume, muscle balance, PR detection & celebration
- **Google sign-in + cloud DB** — Firebase Auth + Firestore; local data migrates to the cloud on first sign-in
- **PWA** — add to home screen on your phone; works offline

## Run locally

```bash
npm install
npm run dev
```

The app works immediately in **local mode** (no Firebase needed) — data is saved in the browser.

## Enable Google sign-in + cloud backup (one-time, ~5 min)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (any name, Analytics optional).
2. **Build → Authentication → Get started → Sign-in method** → enable **Google**.
3. **Authentication → Settings → Authorized domains** → add `<your-username>.github.io`.
4. **Build → Firestore Database → Create database** (production mode, any region).
5. **Firestore → Rules** → paste the contents of [`firestore.rules`](firestore.rules) → **Publish**.
6. **Project settings (gear) → Your apps → Web (`</>`)** → register an app → copy the `firebaseConfig` object.
7. Paste the values into [`src/lib/firebaseConfig.ts`](src/lib/firebaseConfig.ts), commit, and push.

> The Firebase web config is not a secret — security comes from the Firestore rules and authorized domains.

## Deploy to GitHub Pages

1. Create a GitHub repo and push this project to the `main` branch:
   ```bash
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. In the repo: **Settings → Pages → Source** → select **GitHub Actions**.
3. The included workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) builds and deploys on every push to `main`.
4. Open `https://<you>.github.io/<repo>/` on your phone → Share → **Add to Home Screen**.

## Project structure

```
src/
  lib/
    types.ts          # domain model
    exercises.ts      # built-in exercise library
    overload.ts       # e1RM, recommendations, goal pacing, PRs, stats
    generator.ts      # goal-driven plan generation
    session.ts        # session creation with coached targets
    storage.ts        # localStorage + Firebase Auth/Firestore sync
    firebaseConfig.ts # ← paste your Firebase config here
  state/AppContext.tsx
  pages/              # Onboarding, Dashboard, Workout, Templates, History, Insights, ExerciseDetail, Profile
  components/         # BottomNav, RestTimer, ExercisePicker, SyncBadge
```

# TDEE Calculator

A web calculator that estimates total daily energy expenditure (TDEE) from age, sex, height, weight and activity. It runs entirely in the browser: there is no backend, no account and no data sent to a server.

Built with Next.js (App Router), React, TypeScript and Tailwind CSS.

## Getting started

Requires Node.js 22.

```bash
npm ci
npm run dev
```

Then open http://localhost:3000.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint over the project |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm test` | Run unit tests with Vitest |
| `npm run calibrate` | Re-run the adaptive engine's simulation cohort and rewrite `src/lib/engine/calibration.json` (see `src/lib/engine/README.md`) |

CI runs lint, typecheck, test and build on every push and pull request (`.github/workflows/ci.yml`).

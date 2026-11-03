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

## Daily log

The Track tab keeps a log of morning weigh-ins and daily calories and runs the adaptive engine (`src/lib/engine/`) over it. The estimate it shows is expenditure *as logged*; the engine README explains why that differs from true TDEE when logging is biased. The log stays in the browser's local storage, and **Load sample weeks** shows eight weeks of a synthetic person from the engine's simulator without touching it.

Export writes, and import reads, a versioned JSON file (`src/lib/log/schema.ts`):

```json
{ "format": "tdee-daily-log", "version": 1, "exportedAt": "2026-11-03T12:00:00.000Z",
  "entries": [{ "date": "2026-11-03", "weightKg": 81.6, "intakeKcal": 2140 }] }
```

Weight is always stored in kg. Import is strict: an unknown version, a malformed row, an unknown field, a repeated date, a date more than two days ahead, or a log spanning more than ten years rejects the whole file. A saved log with dates outside that window still opens: those entries are left out, with a notice, after a copy of the saved log is kept under `tdee-daily-log-set-aside`. Each change re-reads the saved log and applies to that, so two open tabs never overwrite each other's entries.

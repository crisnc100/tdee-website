# Adaptive TDEE engine

The engine starts from the calculator's formula TDEE and learns from daily weigh-ins and logged calories. It is pure TypeScript with no I/O and no randomness: the same inputs always give the same output.

```ts
import { runEngine } from './filter';
import { priorFromUserData } from './model';

const run = runEngine(priorFromUserData(userData), days); // days: { weightKg?, intakeKcal? }[], one per day
run.prior;                  // the formula prior, unchanged
run.days[28].expenditure;   // { mean, sd, intervals: { p50, p80, p95 } } after day 28's weigh-in
```

| File | Contents |
| --- | --- |
| `model.ts` | The estimated quantity, parameters, types and the formula prior |
| `filter.ts` | The Kalman filter: `createEngine`, `observeWeight`, `advanceDay`, `step`, `runEngine` |
| `sim.ts`, `prng.ts` | Seeded synthetic cohorts |
| `metrics.ts`, `calibration.ts` | Scoring, and the cohort runs behind `calibration.json` |

## What it estimates, and why not the logging bias

People under-log, so a scale and a food log cannot tell a constant under-reporting bias apart from a higher or lower expenditure. Both enter the energy balance only as a sum:

```
weight change/day = (true intake − true expenditure) / ρ
                  = (logged intake + gap − true expenditure) / ρ
```

No amount of data separates `gap` from `true expenditure`. So the engine never estimates the bias. It estimates **expenditure as logged**:

```
E = true expenditure − mean logging gap
```

This is the expenditure that makes the user's *logged* intake match their observed weight trend. It is also the number they should plan against, because the food log is what they will keep using.

## The model

The model is a linear-Gaussian state-space model with three states, solved exactly by a Kalman filter. The energy balance is linear once logged intake is treated as a known input, so the closed-form update is the exact Bayesian answer. A particle filter or MCMC would add cost and nondeterminism for no gain.

| State | Meaning | Daily transition |
| --- | --- | --- |
| W | trend (tissue) weight, kg | `W + (intake − E)/ρ + noise(0.02 kg)` |
| E | expenditure as logged, kcal/day | random walk, SD 12 kcal/day, so the estimate can follow adaptation |
| U | water, glycogen and gut contents, kg | AR(1): `0.75·U + noise`, stationary SD 0.45 kg |

Each weigh-in observes `W + U + scale noise(0.35 kg)`. The constant ρ = 7700 kcal/kg is the usual rounding of 3500 kcal/lb.

- **Prior.** `E₀ ~ N(formula TDEE, (10% of it)²)`. The 10% follows Frankenfield et al. (2005): Mifflin-St Jeor resting rate falls within ±10% of measured values for about 70-82% of adults, and activity adds further error. The calculator's error-margin slider is display-only and is not used.
- **Why a water state.** Day-to-day water swings persist for days. A filter that treats them as independent noise counts each day as fresh evidence and becomes overconfident. Measured on the realistic cohort with the water state replaced by independent noise of the same total size, the 50/80/95% intervals cover only 46/75/90% at day 56, against 55/83/95% with it.
- **Missing weigh-in.** The filter predicts only.
- **Missing intake.** The day's intake is modelled as N(14-day moving average of logged intake, 800²). That widens W's noise by (800/ρ)², so the day says little about E. Before the first log there is no average, so the transition drops its dependence on E: weight changes on those days teach the engine nothing about expenditure.
- **Outliers.** A Huber-style gate applies at 3 SD of the innovation. A weigh-in beyond it is not rejected; its noise is inflated until it sits exactly at the gate. A single typo moves the estimate by a bounded amount, while a real, lasting shift still comes through over a few days.
- **Absurd inputs.** A weight outside 25-350 kg, an intake outside 0-12000 kcal, or any non-finite value is treated as missing. An invalid prior throws a `RangeError`. Covariance updates use the Joseph form, so they stay symmetric and positive semi-definite. The property tests check that nothing non-finite ever reaches the output.

## The simulator: what reality adds

`sim.ts` builds people from varied, plausible calculator inputs (`UserData`), so the formula prior is realistically wrong for each of them. It then simulates 57 days with effects the filter does not model:

- true expenditure off the formula by a lognormal factor (SD 8%)
- expenditure that falls with lost weight (15-30 kcal/kg) and adaptive thermogenesis (up to 15% of the deficit, two-week lag)
- tissue energy density varying per person (6500-9000 kcal/kg)
- a glycogen and water shift over the first days of a deficit or surplus
- water swings whose persistence varies by person (AR coefficient 0.5-0.9), plus a Monday bump after the weekend
- a logging bias (mean 4%, SD 5%), extra weekend under-logging (0-25%), and 12% day-to-day intake noise
- up to 40% missing weigh-ins, up to 25% missing intake days, and a missing week for 15% of people
- scale outliers (up to 3% of weigh-ins, ±2-10 kg) and occasional readings entered in pounds

Ground truth is defined in `simulatePerson`: smooth true expenditure minus the person's mean logging gap, taken over every simulated day. These ranges are assumptions chosen to stress the engine. They are not measurements.

## Calibration results

`npm run calibrate` runs the full seeded cohort (5000 realistic people plus 1000 per edge cohort, about 4 s) and writes `calibration.json`. Re-running it reproduces the file byte for byte. `calibration.test.ts` runs a smaller cohort as a CI gate and states its tolerances.

Realistic cohort (5000 people):

| Day | 50% interval | 80% interval | 95% interval | Median abs. error, engine | Median abs. error, formula |
| --- | --- | --- | --- | --- | --- |
| 7 | 40% | 71% | 92% | 185 kcal | 185 kcal |
| 14 | 40% | 72% | 92% | 171 kcal | 184 kcal |
| 28 | 47% | 77% | 93% | 121 kcal | 184 kcal |
| 56 | 55% | 83% | 95% | 61 kcal | 189 kcal |

The percentage columns are interval coverage: the share of people whose true value fell inside the interval.

How to read it:

- **Early weeks show the prior, and the prior is biased.** The prior is centred on the formula TDEE, but the truth is expenditure *as logged*. The simulated users under-log by about 8% on average (168 kcal/day), so the prior sits about 170 kcal high, and its 50% interval covers only about 40% of people. The engine cannot learn that offset faster than the weight data reveal it. The `accurateLogger` cohort, the same population logging honestly, shows the filter itself is calibrated to conservative from day 0, with 58/86/97% coverage at day 28 and 54/84/96% at day 56.
- **By day 56 the data dominate.** Coverage is at nominal, the posterior SD has halved, and the error is a third of the formula's.
- **The filter leans conservative.** The expenditure drift of 12 kcal/day was chosen between 6, where day-56 coverage falls under nominal (49/78/93%), and 20, where intervals stay needlessly wide (64/90/98%). Maintainers, whose expenditure does not adapt, therefore get slightly wide intervals (60/88/97% at day 56).
- **Edge cohorts.** With no intake logged, the estimate stays exactly on the prior mean, as it must. With days 14-27 missing, the engine stalls during the gap and recovers by day 56.

### `calibration.json` schema (version 1)

- `config`: the seed, people per cohort, horizon (56 days), checkpoint days (7, 14, 28, 56), the prior's relative SD and the full engine parameters.
- `cohorts.<name>`, where the name is one of `realistic`, `accurateLogger`, `noLogs`, `missingWeeks` or `maintainer`. Each has:
  - `checkpoints[]`, one entry per checkpoint day:
    - `coverage` and `formulaCoverage` at `p50`, `p80` and `p95`: the share of people whose truth lies inside the engine's interval, and inside the static prior's
    - `medianAbsErrorKcal` and `meanErrorKcal`, each with `{ engine, formula }`; mean error is the estimate minus the truth
    - `medianPosteriorSdKcal`
  - `daily`: arrays indexed by day 0-56, holding `medianAbsErrorKcal.{engine, formula}` and `coverage.{p50, p80, p95}`.
  - `crossoverDay`: the first day from which the engine's median error stays below the formula's.
  - `convergence`: the median first day from which a person's error stays within 150 kcal through day 56, and the share of people who get there.
  - `nonFiniteValues`: always 0.

Numbers are rounded to 4 decimal places. Change the schema only together with `SCHEMA_VERSION`.

## Limitations

- The energy density ρ is fixed. For a person whose tissue differs from 7700 kcal/kg, the error in the estimate scales with the size of their deficit.
- Unlogged days are imputed from the logged average. Someone who skips logging on days they overeat will read slightly high.
- The diet-onset glycogen drop is absorbed by the water state and the conservative tuning, not modelled explicitly. An explicit onset term measured no gain on the simulated cohort.

# Adaptive TDEE engine

The engine starts from the calculator's formula TDEE and learns from daily weigh-ins and logged calories. It is pure TypeScript with no I/O and no randomness: the same inputs always give the same output.

```ts
import { runEngine } from './filter';
import { enginePriorFromUserData } from './model';

const run = runEngine(enginePriorFromUserData(userData), days); // days: { weightKg?, intakeKcal? }[], one per day
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

- **Prior.** `E₀ ~ N(0.90 × formula, (14.1% of formula)²)`. See the next section for why it is wider than the formula's own error. The calculator's error-margin slider is display-only and is not used.
- **Why a water state.** Day-to-day water swings persist for days. A filter that treats them as independent noise counts each day as fresh evidence and becomes overconfident. Measured on the realistic cohort with the water state replaced by independent noise of the same total size, the 50/80/95% intervals cover only 46/75/90% at day 56, against 55/83/95% with it (measured with the schema-v1 prior, centred on the formula).
- **Missing weigh-in.** The filter predicts only.
- **Missing intake.** The day's intake is modelled as N(14-day moving average of logged intake, 800²). That widens W's noise by (800/ρ)², so the day says little about E. Before the first log there is no average, so the transition drops its dependence on E: weight changes on those days teach the engine nothing about expenditure.
- **Outliers.** A Huber-style gate applies at 3 SD of the innovation. A weigh-in beyond it is not rejected; its noise is inflated until it sits exactly at the gate. A single typo moves the estimate by a bounded amount, while a real, lasting shift still comes through over a few days.
- **Absurd inputs.** A weight outside 25-350 kg, an intake outside 0-12000 kcal, or any non-finite value is treated as missing. An invalid prior throws a `RangeError`. Covariance updates use the Joseph form, so they stay symmetric and positive semi-definite. The property tests check that nothing non-finite ever reaches the output.

## Why the prior is wider than the formula's own 10%

The formula predicts *true* TDEE, and on that it is good to about 10%: Frankenfield et al. (2005) found Mifflin-St Jeor resting rate within ±10% of measured values for about 70-82% of adults. But the engine estimates expenditure *as logged*, which is true TDEE minus the user's mean logging gap, and the formula knows nothing about how a given person logs. So the prior on E carries two independent errors:

```
mean = formula × (1 − b̄)          b̄  = 10%   assumed mean under-reporting
sd   = formula × √(0.10² + σ_b²)   σ_b = 10%  between-person spread of under-reporting
```

Neither number is fitted to the simulator, and neither is taken directly from a paper:

- **b̄ = 10% is a discount below the published figures.** Subar et al. (2003) measured 484 adults aged 40-69 against doubly labelled water: on 24-hour recalls, energy intake was under-reported by 12-14% in men and 16-20% in women on average (by 31-36% and 34-38% on food-frequency questionnaires). The paper does not support 10%; its lowest group mean is 12%. We go below it on the assumption, ours and not the paper's, that daily app logging is better than a recall. Centring at 12% was also run: the honest-logger (0% bias) cohort's 50% interval then covers 44% at day 7 on the full sweep and 42.8% on the CI cohort, below the gate's 44% floor, so 10% is kept.
- **σ_b = 10% is a judgment.** The paper's abstract reports group means only, not the spread between people.

Reference: Subar AF, Kipnis V, Troiano RP, Midthune D, Schoeller DA, Bingham S, Sharbaugh CO, Trabulsi J, Runswick S, Ballard-Barbash R, Sunshine J, Schatzkin A. Using intake biomarkers to evaluate the extent of dietary misreporting in a large sample of adults: the OPEN study. *Am J Epidemiol* 2003;158(1):1-13. doi:10.1093/aje/kwg092. Checked against the PubMed abstract (PMID 12835280); the full text was not accessible.

Two variants were evaluated on a sweep of cohorts whose mean logging bias is 0, 5, 10, 15 and 20% (2000 people each, same people for both variants). The table shows 50/80/95% coverage. The measured mean logging gap of each cohort is within 0.5 points of its nominal level.

**(a) Widen only** (centre at formula, SD 14.1%). Worst deviation from nominal: 41 points.

| Mean bias | Day 7 | Day 14 | Day 28 | Day 56 |
| --- | --- | --- | --- | --- |
| 0% | 72/96/100 | 66/93/99 | 57/85/96 | 56/85/96 |
| 5% | 62/92/99 | 61/91/98 | 56/84/96 | 57/84/96 |
| 10% | 44/79/97 | 46/80/96 | 50/82/95 | 56/84/95 |
| 15% | 28/62/90 | 34/68/92 | 48/77/94 | 55/84/95 |
| 20% | 13/39/72 | 17/47/79 | 37/69/90 | 53/83/95 |

**(b) Widen and recentre by 10%** (the default). Worst deviation from nominal: 18 points.

| Mean bias | Day 7 | Day 14 | Day 28 | Day 56 |
| --- | --- | --- | --- | --- |
| 0% | 52/84/98 | 53/84/97 | 54/82/95 | 57/85/96 |
| 5% | 65/93/99 | 67/91/99 | 57/86/97 | 59/85/96 |
| 10% | 68/95/100 | 66/93/99 | 58/86/96 | 56/84/95 |
| 15% | 60/89/99 | 60/89/98 | 59/85/97 | 58/85/95 |
| 20% | 42/73/92 | 46/77/94 | 52/83/95 | 54/83/95 |

Variant (b) is the default because its worst case is closer to nominal. The CI gate asserts that, for a mean bias of 0-15%, its bands at days 7 and 14 are never more than 6 points under nominal, and that at day 56 every level from 0 to 20% is within 6 points under and 12 over. Its remaining errors in the first two weeks:

- **Mid-range bias over-covers** (up to 68% on the 50% interval). A prior that must allow for any bias in the range is wider than needed for any one level. This is the price of not knowing the bias, and it fades as the weigh-ins arrive.
- **At 20% mean bias the early bands are overconfident** (42/73/92% at day 7, 46/77/94% at day 14). This is a stated limitation, and the gate deliberately excludes it: users who under-log by a fifth on average get bands that are too narrow until about day 28 (52/83/95%).

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

`npm run calibrate` runs the full seeded cohort (5000 realistic people, 1000 per edge cohort and 2000 per sweep level for each prior variant, about 10 s) and writes `calibration.json`. Re-running it reproduces the file byte for byte. `calibration.test.ts` runs a smaller cohort as a CI gate and states its tolerances.

Realistic cohort (5000 people):

| Day | 50% interval | 80% interval | 95% interval | Median abs. error, engine | Median abs. error, formula | Median abs. error, prior |
| --- | --- | --- | --- | --- | --- | --- |
| 7 | 69% | 94% | 100% | 131 kcal | 185 kcal | 132 kcal |
| 14 | 66% | 93% | 99% | 132 kcal | 184 kcal | 127 kcal |
| 28 | 60% | 86% | 96% | 103 kcal | 184 kcal | 122 kcal |
| 56 | 57% | 85% | 96% | 59 kcal | 189 kcal | 114 kcal |

The percentage columns are interval coverage: the share of people whose true value fell inside the interval. There are two baselines: `formula` is the raw calculator TDEE, `prior` is the engine's prior mean (0.90 × formula). Neither is ever updated.

How to read it:

- **Early weeks show the prior, and the prior is wide.** Simulated users under-log by about 8% on average, inside the range the prior allows for, so its bands over-cover early (69% on the 50% interval at day 7). See the sweep above for how this changes with the logging bias. The `accurateLogger` cohort, the same population logging honestly, covers 55/82/95% at day 28 and 56/83/94% at day 56. For those users the recentred prior sits about 200 kcal low, so the engine's error only matches the raw formula's around day 28 (112 against 108 kcal) and beats it by day 56 (62 against 113).
- **By day 56 the data dominate.** Coverage is at nominal, the posterior SD is about a third of day 7's, and the error is under a third of the raw formula's.
- **The filter leans conservative.** The expenditure drift of 12 kcal/day was chosen between 6, where day-56 coverage falls under nominal (49/78/93%), and 20, where intervals stay needlessly wide (64/90/98%); both measured with the schema-v1 prior. Maintainers, whose expenditure does not adapt, therefore get slightly wide intervals (65/88/97% at day 56).
- **Edge cohorts.** With no intake logged, the estimate stays exactly on the prior mean, as it must. With days 14-27 missing, the engine stalls during the gap and recovers by day 56.

### `calibration.json` schema (version 2)

- `config`: the seed, people per cohort, `sweepPeople` (people per sweep level), horizon (56 days), checkpoint days (7, 14, 28, 56), `priorVariant` (the default variant's name), `prior` (its `formulaRelativeSd`, `loggingBiasMean` and `loggingBiasSd`) and the full engine parameters. Every cohort runs with this prior.
- `cohorts.<name>`, where the name is one of `realistic`, `accurateLogger`, `noLogs`, `missingWeeks` or `maintainer`. Each has:
  - `checkpoints[]`, one entry per checkpoint day:
    - `coverage` and `priorCoverage` at `p50`, `p80` and `p95`: the share of people whose truth lies inside the engine's interval, and inside the static prior's
    - `medianAbsErrorKcal` and `meanErrorKcal`, each with `{ engine, formula, prior }`: `formula` is the raw calculator TDEE, `prior` the prior mean; mean error is the estimate minus the truth
    - `medianPosteriorSdKcal`
  - `daily`: arrays indexed by day 0-56, holding `medianAbsErrorKcal.{engine, formula, prior}` and `coverage.{p50, p80, p95}`.
  - `crossoverDay`: the first day from which the engine's median error stays below the raw formula's.
  - `convergence`: the median first day from which a person's error stays within 150 kcal through day 56, and the share of people who get there.
  - `nonFiniteValues`: always 0.
- `sweep`: `loggingBiasMeans` (0, 0.05, 0.1, 0.15, 0.2) and `variants.<name>` for `widen` and `widenAndRecentre`. Each variant has its `prior`, `worstCoverageDeviation` (the largest |coverage − nominal| over every level, checkpoint and interval) and `levels[]`, one per bias mean, with `loggingBiasMean`, `measuredGapShare` (the cohort's measured mean logging gap as a share of true intake), `people` and `checkpoints[]` as above. Sweep cohorts are realistic people with the person-level bias drawn around the level's mean (SD 5 points) and no extra weekend under-logging; both variants see the same people.

Version 1 had a single baseline, `formula`, which was also the prior mean, and called the prior's coverage `formulaCoverage`.

Numbers are rounded to 4 decimal places. Change the schema only together with `SCHEMA_VERSION`.

## Limitations

- The energy density ρ is fixed. For a person whose tissue differs from 7700 kcal/kg, the error in the estimate scales with the size of their deficit.
- Unlogged days are imputed from the logged average. Someone who skips logging on days they overeat will read slightly high.
- The prior assumes a mean logging bias of 10%. Users who under-log by about 20% on average get early bands that are too narrow (42/73/92% at day 7) until about day 28; see the sweep.
- The diet-onset glycogen drop is absorbed by the water state and the conservative tuning, not modelled explicitly. An explicit onset term measured no gain on the simulated cohort.

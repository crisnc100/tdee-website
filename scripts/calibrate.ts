// Regenerates src/lib/engine/calibration.json from the full seeded cohort.
// Usage: npm run calibrate   (output is deterministic; re-running must not change the file)
import { writeFileSync } from 'node:fs';
import { runCalibration, serializeReport } from '../src/lib/engine/calibration';

const FULL_COHORT = { seed: 20261103, people: 5000, edgePeople: 1000 };

const out = new URL('../src/lib/engine/calibration.json', import.meta.url);
const report = runCalibration(FULL_COHORT);
writeFileSync(out, serializeReport(report));

const r = report.cohorts.realistic;
for (const c of r.checkpoints) {
  const cov = `${(c.coverage.p50 * 100).toFixed(1)} / ${(c.coverage.p80 * 100).toFixed(1)} / ${(c.coverage.p95 * 100).toFixed(1)}`;
  console.log(
    `day ${String(c.day).padStart(2)}  coverage 50/80/95: ${cov}  ` +
      `median |err| engine ${c.medianAbsErrorKcal.engine.toFixed(0)} vs formula ${c.medianAbsErrorKcal.formula.toFixed(0)} kcal`,
  );
}
console.log(`wrote ${out.pathname}`);

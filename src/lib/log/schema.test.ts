import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { INTAKE_RANGE_KCAL, WEIGHT_RANGE_KG, addDays, type LogEntry } from './entries';
import {
  LOG_FORMAT,
  LOG_SCHEMA_VERSION,
  MAX_IMPORT_BYTES,
  exportFileName,
  loadStored,
  migrateDocument,
  parseImportText,
  parseLogDocument,
  serializeExport,
  serializeStored,
  type Migration,
} from './schema';

const doc = (entries: unknown, extra: Record<string, unknown> = {}) => ({
  format: LOG_FORMAT,
  version: LOG_SCHEMA_VERSION,
  entries,
  ...extra,
});

const entryArb: fc.Arbitrary<LogEntry> = fc
  .record(
    {
      weightKg: fc.integer({ min: WEIGHT_RANGE_KG[0] * 1000, max: WEIGHT_RANGE_KG[1] * 1000 }).map((g) => g / 1000),
      intakeKcal: fc.integer({ min: INTAKE_RANGE_KCAL[0], max: INTAKE_RANGE_KCAL[1] }),
    },
    { requiredKeys: [] },
  )
  .filter((e) => e.weightKg !== undefined || e.intakeKcal !== undefined)
  .map((e) => ({ date: '', ...e }));

/** Entries on distinct dates, in random order. */
const logArb = fc
  .uniqueArray(fc.integer({ min: 0, max: 3000 }), { maxLength: 60 })
  .chain((offsets) =>
    fc.tuple(fc.constant(offsets), fc.array(entryArb, { minLength: offsets.length, maxLength: offsets.length })),
  )
  .map(([offsets, entries]) => entries.map((e, i) => ({ ...e, date: addDays('2018-01-01', offsets[i]) })));

describe('export and import', () => {
  it('round-trips any valid log, sorted by date', () => {
    fc.assert(
      fc.property(logArb, (entries) => {
        const text = serializeExport(entries, new Date('2026-11-03T12:00:00Z'));
        const parsed = parseImportText(text);
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) return;
        expect(parsed.value).toEqual([...entries].sort((a, b) => a.date.localeCompare(b.date)));
        expect(parseImportText(serializeStored(parsed.value))).toEqual(parsed);
      }),
      { seed: 20261103, numRuns: 200 },
    );
  });

  it('writes a versioned file with an export time and omits empty fields', () => {
    const text = serializeExport([{ date: '2026-11-03', weightKg: 80.5 }], new Date('2026-11-03T12:00:00Z'));
    expect(JSON.parse(text)).toEqual({
      format: LOG_FORMAT,
      version: 1,
      exportedAt: '2026-11-03T12:00:00.000Z',
      entries: [{ date: '2026-11-03', weightKg: 80.5 }],
    });
    expect(exportFileName('2026-11-03')).toBe('tdee-log-2026-11-03.json');
  });

  it('accepts null for a value that was not logged', () => {
    expect(parseLogDocument(doc([{ date: '2026-11-03', weightKg: null, intakeKcal: 1800 }]))).toEqual({
      ok: true,
      value: [{ date: '2026-11-03', intakeKcal: 1800 }],
    });
  });
});

describe('strict import', () => {
  const rejects = (raw: unknown, message: RegExp) => {
    const result = parseLogDocument(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(message);
  };

  it('rejects text that is not JSON, or too large', () => {
    expect(parseImportText('{"format":')).toEqual({ ok: false, error: 'The file is not valid JSON.' });
    expect(parseImportText(' '.repeat(MAX_IMPORT_BYTES + 1))).toMatchObject({ ok: false, error: expect.stringMatching(/too large/) });
  });

  it('rejects other formats and unknown versions', () => {
    rejects([], /not a TDEE daily log/);
    rejects({ version: 1, entries: [] }, /not a TDEE daily log/);
    rejects({ ...doc([]), format: 'other' }, /not a TDEE daily log/);
    rejects({ ...doc([]), version: undefined }, /no valid version/);
    rejects({ ...doc([]), version: '1' }, /no valid version/);
    rejects({ ...doc([]), version: 0 }, /no valid version/);
    rejects({ ...doc([]), version: 1.5 }, /no valid version/);
    rejects({ ...doc([]), version: LOG_SCHEMA_VERSION + 1 }, /version 2, made by a newer release/);
    rejects({ ...doc([]), entries: 'nope' }, /no list of entries/);
  });

  it('rejects malformed rows, naming the row and the date', () => {
    rejects(doc(['2026-11-03']), /Row 1 is not an entry object/);
    rejects(doc([{ weightKg: 80 }]), /Row 1 has no date/);
    rejects(doc([{ date: '2026-11-31', weightKg: 80 }]), /Row 1 \(2026-11-31\) is invalid: Enter a valid date/);
    rejects(doc([{ date: '2026-11-03', weightKg: '80' }]), /weightKg that is not a number/);
    rejects(doc([{ date: '2026-11-03', weightKg: 400 }]), /Weight must be between 25–350 kg/);
    rejects(doc([{ date: '2026-11-03', intakeKcal: 20000 }]), /Calories must be between/);
    rejects(doc([{ date: '2026-11-03' }]), /no weight or calories|weight, calories, or both/);
    rejects(doc([{ date: '2026-11-03', weight: 180 }]), /unknown field "weight"/);
  });

  it('rejects duplicate dates', () => {
    rejects(
      doc([
        { date: '2026-11-01', weightKg: 80 },
        { date: '2026-11-02', weightKg: 80 },
        { date: '2026-11-01', intakeKcal: 2000 },
      ]),
      /Rows 1 and 3 both have the date 2026-11-01/,
    );
  });

  it('rejects the whole file for one bad row, and counts the problems', () => {
    const rows = [
      { date: '2026-11-01', weightKg: 80 },
      { date: 'bad', weightKg: 80 },
      { date: '2026-11-03', weightKg: 1 },
      { date: '2026-11-04', intakeKcal: -5 },
      { date: '2026-11-05', extra: true },
    ];
    const result = parseLogDocument(doc(rows));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/^4 problems found\. Row 2/);
      expect(result.error).toMatch(/\(and 1 more\)$/);
    }
  });
});

describe('migrations', () => {
  // A hypothetical version 2 that renames `entries` to `days`, to exercise the chain.
  const toV2: Migration = (d) => {
    const { entries, ...rest } = d;
    return { ...rest, days: entries };
  };

  it('upgrades a version 1 document step by step to the target', () => {
    const v1 = doc([{ date: '2026-11-03', weightKg: 80 }]);
    expect(migrateDocument(v1, { 1: toV2 }, 2)).toEqual({
      ok: true,
      value: { format: LOG_FORMAT, version: 2, days: [{ date: '2026-11-03', weightKg: 80 }] },
    });
  });

  it('leaves a current document as it is', () => {
    const v1 = doc([]);
    expect(migrateDocument(v1)).toEqual({ ok: true, value: v1 });
  });

  it('refuses a version with no migration step', () => {
    expect(migrateDocument(doc([]), {}, 2)).toMatchObject({ ok: false, error: expect.stringMatching(/Version 1 files can no longer be read/) });
  });
});

describe('loadStored', () => {
  it('treats nothing saved as an empty log', () => {
    expect(loadStored(null)).toEqual({ status: 'empty', entries: [] });
    expect(loadStored('')).toEqual({ status: 'empty', entries: [] });
  });

  it('loads a saved log and reports an unreadable one', () => {
    const saved = serializeStored([{ date: '2026-11-03', weightKg: 80 }]);
    expect(loadStored(saved)).toEqual({ status: 'ok', entries: [{ date: '2026-11-03', weightKg: 80 }] });
    expect(loadStored('not json')).toMatchObject({ status: 'unreadable', entries: [], error: expect.any(String) });
    expect(loadStored(JSON.stringify(doc([], { version: 9 })))).toMatchObject({ status: 'unreadable' });
  });
});

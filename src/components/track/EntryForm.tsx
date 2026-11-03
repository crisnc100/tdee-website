'use client';

import { useRef, useState, type FormEvent } from 'react';
import {
  MIN_DATE,
  draftFromEntry,
  entryFromDraft,
  type EntryDraft,
  type EntryField,
  type LogEntry,
  type WeightUnit,
} from '@/lib/log/entries';
import { usePendingGuard } from '@/hooks/usePendingGuard';
import { UnitCell, errorClass, formatDay, groupedFieldClass, hintClass, labelClass, primaryButton, secondaryButton } from './shared';

interface EntryFormProps {
  entries: readonly LogEntry[];
  unit: WeightUnit;
  today: string;
  /** The entry being edited, or null to add. Remount (key) the form when it changes. */
  editing: LogEntry | null;
  /** Saves the entry; returns an error message to show, or null on success. */
  onSave: (entry: LogEntry, originalDate: string | null) => Promise<string | null>;
  onCancelEdit: () => void;
}

export default function EntryForm({ entries, unit, today, editing, onSave, onCancelEdit }: EntryFormProps) {
  const [draft, setDraft] = useState<EntryDraft>(() =>
    editing ? draftFromEntry(editing, unit) : { date: today, weight: '', calories: '' },
  );
  const [error, setError] = useState<{ message: string; field?: EntryField } | null>(null);
  const [saving, guard] = usePendingGuard();
  const fields = {
    date: useRef<HTMLInputElement>(null),
    weight: useRef<HTMLInputElement>(null),
    calories: useRef<HTMLInputElement>(null),
  };

  const existing = !editing ? entries.find((e) => e.date === draft.date) : undefined;
  const set = (key: keyof EntryDraft) => (value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (error) setError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    // While a save waits for the log's lock the fields are read-only and the button says so; a second Enter is ignored.
    if (guard.pending) return;
    const parsed = entryFromDraft(draft, unit, today);
    if (!parsed.ok) {
      setError({ message: parsed.error, field: parsed.field });
      fields[parsed.field ?? 'weight'].current?.focus();
      return;
    }
    const saved = await guard.run(() => onSave(parsed.value, editing?.date ?? null));
    if (!saved.ran) return;
    const failure = saved.value;
    if (failure) {
      setError({ message: failure, field: 'date' });
      fields.date.current?.focus();
      return;
    }
    if (!editing) setDraft((d) => ({ ...d, weight: '', calories: '' }));
  };

  const invalid = (field: EntryField) => error !== null && (error.field ?? 'weight') === field;
  const describedBy = (field: EntryField, hint?: string) =>
    [hint, invalid(field) ? 'log-form-error' : null].filter(Boolean).join(' ') || undefined;
  const unitLabel = unit === 'kg' ? 'kg' : 'lbs';

  return (
    <form onSubmit={submit} noValidate aria-busy={saving} aria-labelledby="log-form-heading" className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="log-date" className={labelClass}>
            Date
          </label>
          <input
            readOnly={saving}
            ref={fields.date}
            id="log-date"
            type="date"
            className="field"
            value={draft.date}
            min={MIN_DATE}
            max={today}
            required
            aria-invalid={invalid('date')}
            aria-describedby={describedBy('date')}
            onChange={(e) => set('date')(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="log-weight" className={labelClass}>
            Weight<span className="sr-only"> ({unitLabel}, morning)</span>
          </label>
          <div className="flex">
            <input
              readOnly={saving}
              ref={fields.weight}
              id="log-weight"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              className={groupedFieldClass}
              value={draft.weight}
              placeholder={unit === 'kg' ? 'e.g., 81.6' : 'e.g., 180.0'}
              aria-invalid={invalid('weight')}
              aria-describedby={describedBy('weight', 'log-weight-hint')}
              onChange={(e) => set('weight')(e.target.value)}
            />
            <UnitCell>{unitLabel}</UnitCell>
          </div>
          <p id="log-weight-hint" className={hintClass}>
            Morning, before eating.
          </p>
        </div>
        <div>
          <label htmlFor="log-calories" className={labelClass}>
            Calories<span className="sr-only"> (kcal eaten that day)</span>
          </label>
          <div className="flex">
            <input
              readOnly={saving}
              ref={fields.calories}
              id="log-calories"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className={groupedFieldClass}
              value={draft.calories}
              placeholder="e.g., 2100"
              aria-invalid={invalid('calories')}
              aria-describedby={describedBy('calories', 'log-calories-hint')}
              onChange={(e) => set('calories')(e.target.value)}
            />
            <UnitCell>kcal</UnitCell>
          </div>
          <p id="log-calories-hint" className={hintClass}>
            Everything logged that day.
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {editing
          ? 'Leave a field blank to clear it.'
          : existing
            ? `${formatDay(draft.date)} already has an entry. Values you enter replace those fields; blank fields keep theirs.`
            : 'Log either value, or both. Blank means not logged that day.'}
      </p>

      {error && (
        <p id="log-form-error" role="alert" className={errorClass}>
          {error.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <SubmitButton saving={saving} editing={editing !== null} />
        {editing && (
          <button type="button" className={secondaryButton} onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/** While a save is pending it stays focusable, so focus is not lost, but says it is saving and does nothing. */
export function SubmitButton({ saving, editing }: { saving: boolean; editing: boolean }) {
  return (
    <button type="submit" aria-disabled={saving} className={`${primaryButton} aria-disabled:cursor-wait aria-disabled:opacity-70`}>
      {saving ? 'Saving…' : editing ? 'Save changes' : 'Save entry'}
    </button>
  );
}

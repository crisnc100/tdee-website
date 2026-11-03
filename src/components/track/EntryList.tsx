'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { formatWeight, type LogEntry, type WeightUnit } from '@/lib/log/entries';
import { formatDay, iconButton, kcal } from './shared';

interface EntryListProps {
  entries: readonly LogEntry[];
  unit: WeightUnit;
  outlierDates: ReadonlySet<string>;
  /** Date of the entry open in the form, highlighted in the list. */
  editingDate: string | null;
  /** Omit both to show the list read-only (sample mode). */
  onEdit?: (entry: LogEntry) => void;
  onDelete?: (entry: LogEntry) => void;
}

export default function EntryList({ entries, unit, outlierDates, editingDate, onEdit, onDelete }: EntryListProps) {
  const newestFirst = [...entries].reverse();
  const unitLabel = unit === 'kg' ? 'kg' : 'lbs';
  const anyOutlier = entries.some((e) => outlierDates.has(e.date));

  return (
    <div className="space-y-3">
      <div
        role="region"
        aria-labelledby="log-list-heading"
        tabIndex={0}
        className="max-h-[26rem] overflow-y-auto overscroll-contain border border-border rounded-[2px] bg-card"
      >
        <ul className="divide-y divide-border">
          {newestFirst.map((entry) => {
            const outlier = outlierDates.has(entry.date);
            const editing = entry.date === editingDate;
            return (
              <li
                key={entry.date}
                className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 pl-3 pr-1 py-1.5 border-l-2 ${
                  editing ? 'border-accent-ink bg-muted/70' : 'border-transparent'
                }`}
              >
                <div className="min-w-0 py-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium text-foreground">{formatDay(entry.date, true)}</span>
                    {outlier && (
                      <span className="label-caps tracking-[0.08em] text-warning border border-warning rounded-[2px] px-1.5 leading-5">
                        Outlier<span className="sr-only">: far from your trend, so it counted for less</span>
                      </span>
                    )}
                  </div>
                  <p className="readout text-sm text-muted-foreground mt-0.5">
                    <span className={entry.weightKg !== undefined ? 'text-foreground' : undefined}>
                      {entry.weightKg !== undefined ? `${formatWeight(entry.weightKg, unit)} ${unitLabel}` : `— ${unitLabel}`}
                    </span>
                    <span aria-hidden="true" className="mx-2">
                      ·
                    </span>
                    <span className={entry.intakeKcal !== undefined ? 'text-foreground' : undefined}>
                      {entry.intakeKcal !== undefined ? `${kcal(entry.intakeKcal)} kcal` : '— kcal'}
                    </span>
                    {(entry.weightKg === undefined || entry.intakeKcal === undefined) && (
                      <span className="sr-only">
                        {entry.weightKg === undefined ? ', no weigh-in' : ', no calories logged'}
                      </span>
                    )}
                  </p>
                </div>
                {onEdit && onDelete && (
                  <div className="flex">
                    <button
                      type="button"
                      className={iconButton}
                      onClick={() => onEdit(entry)}
                      aria-label={`Edit entry for ${formatDay(entry.date, true)}`}
                    >
                      <Pencil aria-hidden="true" className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className={`${iconButton} hover:text-danger`}
                      onClick={() => onDelete(entry)}
                      aria-label={`Delete entry for ${formatDay(entry.date, true)}`}
                    >
                      <Trash2 aria-hidden="true" className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {anyOutlier && (
        <p className="text-xs text-muted-foreground">
          <span className="label-caps tracking-[0.08em] text-warning mr-2">Outlier</span>A weigh-in far from your trend. The
          estimate counts it for less, so one typo or odd reading cannot swing it; a real change still comes through over a
          few days.
        </p>
      )}
    </div>
  );
}

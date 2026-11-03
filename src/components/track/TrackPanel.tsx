'use client';

import { useEffect, useRef, useState } from 'react';
import { SectionHeading } from '@/components/ui/lab';
import { addEntry, deleteEntry, updateEntry, type LogEntry, type WeightUnit } from '@/lib/log/entries';
import type { LogEngineResult } from '@/lib/log/engine';
import EntryForm from './EntryForm';
import EntryList from './EntryList';
import LogDataControls from './LogDataControls';
import { band80, formatDay, kcal } from './shared';

export interface LogControls {
  commit: (update: (entries: LogEntry[]) => LogEntry[]) => LogEntry[];
  notice: string | null;
  saveError: string | null;
}

interface TrackPanelProps {
  entries: LogEntry[];
  engine: LogEngineResult | null;
  unit: WeightUnit;
  today: string;
  log: LogControls;
}

interface Status {
  message: string;
  /** The entry a Delete removed, offered back by Undo. */
  undo?: LogEntry;
}

export default function TrackPanel({ entries, engine, unit, today, log }: TrackPanelProps) {
  const [editing, setEditing] = useState<LogEntry | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const undoButton = useRef<HTMLButtonElement>(null);
  const focusAfterEdit = useRef(false);

  // Edit puts the cursor in the form; Delete puts it on Undo, so focus never drops to the page.
  useEffect(() => {
    if (editing && focusAfterEdit.current) document.getElementById('log-weight')?.focus();
    focusAfterEdit.current = false;
  }, [editing]);
  useEffect(() => {
    if (status?.undo) undoButton.current?.focus();
  }, [status]);

  const save = (entry: LogEntry, originalDate: string | null): string | null => {
    if (originalDate) {
      const updated = updateEntry(entries, originalDate, entry);
      if (!updated.ok) return updated.error;
      log.commit(() => updated.value);
      setEditing(null);
      setStatus({ message: `Updated the entry for ${formatDay(entry.date, true)}.` });
    } else {
      log.commit((current) => addEntry(current, entry));
      setStatus({ message: `Saved ${formatDay(entry.date, true)}.` });
    }
    return null;
  };

  const edit = (entry: LogEntry) => {
    focusAfterEdit.current = true;
    setEditing(entry);
    setStatus(null);
  };

  const remove = (entry: LogEntry) => {
    log.commit((current) => deleteEntry(current, entry.date));
    if (editing?.date === entry.date) setEditing(null);
    setStatus({ message: `Deleted the entry for ${formatDay(entry.date, true)}.`, undo: entry });
  };

  const undo = (entry: LogEntry) => {
    log.commit((current) => addEntry(current, entry));
    setStatus({ message: `Restored the entry for ${formatDay(entry.date, true)}.` });
  };

  const replaceAll = (next: LogEntry[]) => {
    log.commit(() => next);
    setEditing(null);
  };

  return (
    <div className="space-y-8">
      <section aria-labelledby="track-heading" className="space-y-4">
        <SectionHeading index="03" title="Expenditure as you log it" id="track-heading" hideIndex />
        {engine && <EstimateReadout engine={engine} />}
        <LoggingExplainer />
      </section>

      {(log.notice || log.saveError) && (
        <div role="alert" className="border-l-2 border-danger bg-muted/70 px-4 py-3 space-y-1">
          {log.notice && <p className="text-sm text-foreground">{log.notice}</p>}
          {log.saveError && <p className="text-sm text-foreground">{log.saveError}</p>}
        </div>
      )}

      <section aria-labelledby="log-form-heading" className="space-y-4">
        <SectionHeading
          index="04"
          title={editing ? `Edit ${formatDay(editing.date, true)}` : 'Log a day'}
          id="log-form-heading"
          hideIndex
        />
        <EntryForm
          key={editing?.date ?? 'new'}
          entries={entries}
          unit={unit}
          today={today}
          editing={editing}
          onSave={save}
          onCancelEdit={() => setEditing(null)}
        />
      </section>

      <p role="status" className="min-h-6 text-sm text-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
        {status?.message}
        {status?.undo && (
          <button
            ref={undoButton}
            type="button"
            className="min-h-11 px-2 -my-2 label-caps text-accent-ink underline underline-offset-4 cursor-pointer"
            onClick={() => undo(status.undo!)}
          >
            Undo
          </button>
        )}
      </p>

      <section aria-labelledby="log-list-heading" className="space-y-4">
        <SectionHeading
          index="05"
          title={`Entries${entries.length ? ` (${entries.length.toLocaleString()})` : ''}`}
          id="log-list-heading"
          hideIndex
        />
        {entries.length > 0 ? (
          <EntryList
            entries={entries}
            unit={unit}
            outlierDates={engine?.outlierDates ?? new Set()}
            editingDate={editing?.date ?? null}
            onEdit={edit}
            onDelete={remove}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No entries yet. Log a morning weigh-in and the day&apos;s calories above; a few weeks of both is enough for the
            estimate to start beating the formula.
          </p>
        )}
      </section>

      <section aria-labelledby="log-data-heading" className="space-y-4">
        <SectionHeading index="06" title="Your data" id="log-data-heading" hideIndex />
        <LogDataControls entries={entries} today={today} onReplace={replaceAll} onStatus={(message) => setStatus({ message })} />
      </section>
    </div>
  );
}

function EstimateReadout({ engine }: { engine: LogEngineResult }) {
  const { current, dayCount, weighIns, intakeDays, outlierDates, learning } = engine;
  const estimate = current.expenditure;
  return (
    <div className="border border-border rounded-[2px] bg-card p-3 sm:p-4">
      <p className="readout text-foreground">
        <span className="text-3xl sm:text-4xl font-semibold text-accent-ink">{kcal(estimate.mean)}</span>{' '}
        <span className="text-sm">± {kcal(band80(estimate))}</span>{' '}
        <span className="text-xs text-muted-foreground">kcal / day</span>
      </p>
      <p className="mt-1 readout text-xs text-muted-foreground">
        80% band {kcal(estimate.intervals.p80.lower)}–{kcal(estimate.intervals.p80.upper)}
        <span aria-hidden="true"> · </span>
        <span className="sr-only">, </span>day {dayCount}
        <span aria-hidden="true"> · </span>
        <span className="sr-only">, </span>
        {weighIns} weigh-in{weighIns === 1 ? '' : 's'}
        <span aria-hidden="true"> · </span>
        <span className="sr-only">, </span>
        {intakeDays} day{intakeDays === 1 ? '' : 's'} of calories
        {outlierDates.size > 0 && (
          <>
            <span aria-hidden="true"> · </span>
            <span className="sr-only">, </span>
            <span className="text-warning">
              {outlierDates.size} outlier{outlierDates.size === 1 ? '' : 's'}
            </span>
          </>
        )}
      </p>
      {!learning && (
        <p className="mt-2 text-sm text-muted-foreground">
          This is still the starting estimate. It begins to learn once there is a weigh-in, a day of logged calories, and a
          later weigh-in.
        </p>
      )}
    </div>
  );
}

function LoggingExplainer() {
  return (
    <div className="border-l-2 border-accent-ink bg-muted/70 px-4 py-3.5 space-y-2">
      <h4 className="label-caps text-foreground">Why it can differ from your true TDEE</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Most people log a little less than they eat. A scale and a food log cannot tell that gap apart from a lower
        expenditure, because the two only ever show up as their sum. So this is the expenditure that makes your{' '}
        <em>logged</em> calories match your weight trend. If you under-log by 200 kcal a day, it reads about 200 below your
        true TDEE, and it is still the number to plan against, because your log is what you will keep using.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        It starts from the formula, lowered 10% for typical under-logging and with a wide band, and the band narrows as
        weigh-ins and calories come in.
      </p>
    </div>
  );
}

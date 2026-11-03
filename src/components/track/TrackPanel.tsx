'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import Link from 'next/link';
import { FlaskConical, X } from 'lucide-react';
import { SectionHeading } from '@/components/ui/lab';
import { addEntry, deleteEntry, updateEntry, type LogEntry, type Result, type WeightUnit } from '@/lib/log/entries';
import type { LogEngineResult } from '@/lib/log/engine';
import type { LogUpdate } from '@/lib/log/storage';
import EntryForm from './EntryForm';
import EntryList from './EntryList';
import LogDataControls from './LogDataControls';
import { band80, formatDay, kcal, primaryButton } from './shared';

export interface LogControls {
  /** Applies a change to the latest saved entries; a failed Result means nothing changed. */
  commit: (update: LogUpdate) => Result<LogEntry[]>;
  notice: string | null;
  saveError: string | null;
}

export interface SampleInfo {
  matched: boolean;
  meanLoggingGapKcal: number;
  /** The simulator's true expenditure as logged on the sample's last day. */
  truthTodayKcal: number;
  /** Entries in the user's own saved log, untouched while the sample shows. */
  savedEntries: number;
  onExit: () => void;
}

interface TrackPanelProps {
  entries: LogEntry[];
  engine: LogEngineResult | null;
  unit: WeightUnit;
  today: string;
  log: LogControls;
  /** The status line, kept by the parent so a Delete's Undo outlives this panel being unmounted. */
  status: TrackStatus | null;
  onStatus: (status: TrackStatus | null) => void;
  /** Set in sample mode: the panel is read-only and the saved log is not touched. */
  sample: SampleInfo | null;
  onLoadSample: () => void;
}

export interface TrackStatus {
  message: string;
  /** The entry a Delete removed, offered back by Undo. */
  undo?: LogEntry;
}

export default function TrackPanel({
  entries,
  engine,
  unit,
  today,
  log,
  status,
  onStatus,
  sample,
  onLoadSample,
}: TrackPanelProps) {
  const [editing, setEditing] = useState<LogEntry | null>(null);
  const undoButton = useRef<HTMLButtonElement>(null);
  const exitButton = useRef<HTMLButtonElement>(null);
  const focusAfterEdit = useRef(false);
  const focusUndo = useRef(false);
  const focusExitAfterLoad = useRef(false);

  // Loading the sample from here removes the button that did it, so focus goes to Exit sample.
  useEffect(() => {
    if (sample && focusExitAfterLoad.current) exitButton.current?.focus();
    focusExitAfterLoad.current = false;
  }, [sample]);

  // Edit puts the cursor in the form; Delete puts it on Undo, so focus never drops to the page.
  useEffect(() => {
    if (editing && focusAfterEdit.current) document.getElementById('log-weight')?.focus();
    focusAfterEdit.current = false;
  }, [editing]);
  // Only right after a Delete: a status kept from before this panel mounted must not pull focus.
  useEffect(() => {
    if (focusUndo.current && status?.undo) undoButton.current?.focus();
    focusUndo.current = false;
  }, [status]);

  const save = (entry: LogEntry, originalDate: string | null): string | null => {
    const result = originalDate
      ? log.commit((current) => updateEntry(current, originalDate, entry))
      : log.commit((current) => addEntry(current, entry));
    if (!result.ok) return result.error;
    if (originalDate) {
      setEditing(null);
      onStatus({ message: `Updated the entry for ${formatDay(entry.date, true)}.` });
    } else {
      onStatus({ message: `Saved ${formatDay(entry.date, true)}.` });
    }
    return null;
  };

  const edit = (entry: LogEntry) => {
    focusAfterEdit.current = true;
    setEditing(entry);
    onStatus(null);
  };

  const remove = (entry: LogEntry) => {
    const result = log.commit((current) => deleteEntry(current, entry.date));
    if (!result.ok) {
      onStatus({ message: result.error });
      return;
    }
    if (editing?.date === entry.date) setEditing(null);
    focusUndo.current = true;
    onStatus({ message: `Deleted the entry for ${formatDay(entry.date, true)}.`, undo: entry });
  };

  const undo = (entry: LogEntry) => {
    const result = log.commit((current) => addEntry(current, entry));
    onStatus(result.ok ? { message: `Restored the entry for ${formatDay(entry.date, true)}.` } : { message: result.error, undo: entry });
  };

  const commitImport = (update: LogUpdate) => {
    const result = log.commit(update);
    if (result.ok) setEditing(null);
    return result;
  };

  if (sample) {
    return (
      <div className="space-y-8">
        <section aria-labelledby="track-heading" className="space-y-4">
          <SectionHeading index="03" title="Expenditure as you log it" id="track-heading" hideIndex />
          <SampleNotice sample={sample} buttonRef={exitButton} />
          {engine && <EstimateReadout engine={engine} />}
          {engine && <SampleTruth sample={sample} engine={engine} />}
          <LoggingExplainer />
        </section>
        <section aria-labelledby="log-list-heading" className="space-y-4">
          <SectionHeading index="04" title={`Sample entries (${entries.length})`} id="log-list-heading" hideIndex />
          <EntryList entries={entries} unit={unit} outlierDates={engine?.outlierDates ?? new Set()} editingDate={null} />
        </section>
      </div>
    );
  }

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
          <div className="border border-dashed border-border-strong rounded-[2px] p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              No entries yet. Log a morning weigh-in and the day&apos;s calories above; a few weeks of both is enough for the
              estimate to start beating the formula. To see it learn first, load eight weeks of a synthetic person.
            </p>
            <button
              type="button"
              className={primaryButton}
              onClick={() => {
                focusExitAfterLoad.current = true;
                onLoadSample();
              }}
            >
              <FlaskConical aria-hidden="true" className="w-4 h-4" />
              Load sample weeks
            </button>
          </div>
        )}
      </section>

      <section aria-labelledby="log-data-heading" className="space-y-4">
        <SectionHeading index="06" title="Your data" id="log-data-heading" hideIndex />
        <LogDataControls entries={entries} today={today} onCommit={commitImport} onStatus={(message) => onStatus({ message })} />
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

function SampleNotice({ sample, buttonRef }: { sample: SampleInfo; buttonRef: RefObject<HTMLButtonElement | null> }) {
  return (
    <div className="bg-accent text-accent-foreground rounded-[3px] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm leading-relaxed min-w-0 flex-1 basis-60">
        <span className="label-caps mr-2">Sample mode</span>
        Read-only and not saved. {sample.matched ? 'It uses your calculator inputs. ' : ''}
        {sample.savedEntries > 0
          ? `Your own log (${sample.savedEntries.toLocaleString()} entries) is untouched and returns when you exit.`
          : 'Your own log is untouched.'}
      </p>
      <button
        ref={buttonRef}
        type="button"
        onClick={sample.onExit}
        className="min-h-11 px-4 border border-accent-foreground rounded-[3px] inline-flex items-center gap-2 label-caps cursor-pointer hover:bg-accent-foreground/10 focus-visible:outline-accent-foreground"
      >
        <X aria-hidden="true" className="w-4 h-4" />
        Exit sample
      </button>
    </div>
  );
}

/** What only a simulation can show: the true value the estimate is chasing. */
function SampleTruth({ sample, engine }: { sample: SampleInfo; engine: LogEngineResult }) {
  const estimate = engine.current.expenditure;
  const truth = sample.truthTodayKcal;
  const inside = truth >= estimate.intervals.p80.lower && truth <= estimate.intervals.p80.upper;
  return (
    <div className="border border-border rounded-[2px] bg-card p-3 sm:p-4 space-y-2">
      <h4 className="label-caps text-foreground">What the sample knows that a real log cannot</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">
        This person logs about <span className="readout text-foreground">{kcal(sample.meanLoggingGapKcal)}</span> kcal a day
        less than they eat. Their true expenditure as logged on day {engine.dayCount} is{' '}
        <span className="readout text-foreground">{kcal(truth)}</span>; the estimate is{' '}
        <span className="readout text-foreground">{kcal(estimate.mean)}</span>, {kcal(Math.abs(estimate.mean - truth))} off,{' '}
        {inside ? 'inside' : 'outside'} its 80% band. Their true TDEE is about{' '}
        <span className="readout text-foreground">{kcal(truth + sample.meanLoggingGapKcal)}</span>: the gap between that
        and the estimate is the under-logging, not an error in the estimate.
      </p>
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
      <p>
        <Link
          href="/lab"
          className="inline-flex items-center gap-1.5 min-h-11 -my-2 text-sm font-medium text-accent-ink underline underline-offset-4 hover:no-underline"
        >
          How accurate is this? <span aria-hidden="true">→</span>
        </Link>
      </p>
    </div>
  );
}

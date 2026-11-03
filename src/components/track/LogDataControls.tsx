'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Download, Upload } from 'lucide-react';
import { mergeEntries, type LogEntry, type MergeSummary, type Result } from '@/lib/log/entries';
import { MAX_IMPORT_BYTES, exportFileName, parseImportText, serializeExport } from '@/lib/log/schema';
import type { LogUpdate } from '@/lib/log/storage';
import { errorClass, formatDay, primaryButton, secondaryButton } from './shared';

interface LogDataControlsProps {
  entries: readonly LogEntry[];
  today: string;
  /** Applies a change to the latest saved entries; a failed Result means nothing changed. */
  onCommit: (update: LogUpdate) => Promise<Result<LogEntry[]>>;
  /** Announces an outcome in the Track tab's status line. */
  onStatus: (message: string) => void;
}

interface PendingImport {
  fileName: string;
  entries: LogEntry[];
}

export default function LogDataControls({ entries, today, onCommit, onStatus }: LogDataControlsProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const importButton = useRef<HTMLButtonElement>(null);
  const replaceWarning = useRef<HTMLParagraphElement>(null);
  const replaceButton = useRef<HTMLButtonElement>(null);
  const returnToReplace = useRef(false);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The warning takes focus so it is read first; the destructive button is one Tab away, never focused for you.
  useEffect(() => {
    if (confirmReplace) replaceWarning.current?.focus();
    else if (returnToReplace.current) replaceButton.current?.focus();
    returnToReplace.current = false;
  }, [confirmReplace]);

  const back = () => {
    returnToReplace.current = true;
    setConfirmReplace(false);
  };

  /** Closes the import panel and puts focus back where it started. */
  const close = () => {
    setPending(null);
    setConfirmReplace(false);
    importButton.current?.focus();
  };

  const exportLog = () => {
    const blob = new Blob([serializeExport(entries, new Date())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFileName(today);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    onStatus(`Exported ${entriesText(entries.length)} to ${link.download}.`);
  };

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // so choosing the same file again still fires
    setPending(null);
    setConfirmReplace(false);
    setError(null);
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setError('Nothing was imported. The file is too large to be a daily log.');
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setError('Nothing was imported. The file could not be read.');
      return;
    }
    const parsed = parseImportText(text, { today });
    if (!parsed.ok) {
      setError(`Nothing was imported. ${parsed.error}`);
      return;
    }
    if (parsed.value.length === 0) {
      setError('Nothing was imported. The file has no entries.');
      return;
    }
    setPending({ fileName: file.name, entries: parsed.value });
    onStatus(`Read ${file.name}: ${entriesText(parsed.value.length)}. Choose how to import it below.`);
  };

  // Merged into the log as saved at this moment, which another tab may have changed since the preview.
  const merge = async () => {
    if (!pending) return;
    // The update can run more than once if another tab saves meanwhile; the last run is the one saved.
    let summary: MergeSummary = { added: 0, replaced: 0, kept: 0 };
    const result = await onCommit((current) => {
      const merged = mergeEntries(current, pending.entries);
      summary = merged.summary;
      return merged.entries;
    });
    if (!result.ok) {
      setError(`Nothing was imported. ${result.error}`);
      return;
    }
    setError(null);
    close();
    onStatus(
      `Imported ${pending.fileName}: ${summary.added} added, ${summary.replaced} replaced on shared dates, ${summary.kept} kept.`,
    );
  };

  const replace = async () => {
    if (!pending) return;
    const result = await onCommit(() => pending.entries);
    if (!result.ok) {
      setError(`Nothing was imported. ${result.error}`);
      return;
    }
    setError(null);
    close();
    onStatus(`Replaced the log with ${pending.fileName}: ${entriesText(pending.entries.length)}.`);
  };

  const preview = pending ? mergeEntries(entries, pending.entries).summary : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={secondaryButton} onClick={exportLog} disabled={entries.length === 0}>
          <Download aria-hidden="true" className="w-4 h-4" />
          Export JSON
        </button>
        <button ref={importButton} type="button" className={secondaryButton} onClick={() => fileInput.current?.click()}>
          <Upload aria-hidden="true" className="w-4 h-4" />
          Import JSON…
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          aria-label="Choose a daily log file to import"
          tabIndex={-1}
          className="sr-only"
          onChange={chooseFile}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        The file stays on this device: export and import never upload anything.
      </p>

      {error && (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      )}

      {pending && preview && (
        <div
          role="group"
          aria-labelledby="import-heading"
          className="border border-border-strong rounded-[2px] bg-background/60 p-3 sm:p-4 space-y-3"
        >
          <p id="import-heading" className="text-sm text-foreground">
            <span className="font-medium break-all">{pending.fileName}</span>: {entriesText(pending.entries.length)},{' '}
            {formatDay(pending.entries[0].date, true)} to {formatDay(pending.entries[pending.entries.length - 1].date, true)}.
          </p>
          {!confirmReplace ? (
            <>
              <p className="text-sm text-muted-foreground">
                {entries.length === 0
                  ? 'Your log is empty, so this simply loads the file.'
                  : `Merge adds ${preview.added}, replaces ${preview.replaced} on dates both have (the file wins), and keeps your other ${preview.kept}. Replace keeps only the file.`}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={primaryButton} onClick={merge}>
                  {entries.length === 0 ? 'Import' : 'Merge'}
                </button>
                {entries.length > 0 && (
                  <button ref={replaceButton} type="button" className={secondaryButton} onClick={() => setConfirmReplace(true)}>
                    Replace…
                  </button>
                )}
                <button type="button" className={secondaryButton} onClick={close}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p ref={replaceWarning} tabIndex={-1} className="text-sm text-foreground border-l-2 border-danger pl-3">
                Replace deletes all {entriesText(entries.length)} in your log and keeps only the {entriesText(pending.entries.length)}{' '}
                from the file. This cannot be undone; export first if you may want them back.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="min-h-11 px-4 border border-danger text-danger rounded-[3px] inline-flex items-center justify-center label-caps hover:bg-muted transition-colors cursor-pointer"
                  onClick={replace}
                >
                  Yes, replace my log
                </button>
                <button type="button" className={secondaryButton} onClick={back}>
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function entriesText(n: number): string {
  return `${n.toLocaleString()} ${n === 1 ? 'entry' : 'entries'}`;
}

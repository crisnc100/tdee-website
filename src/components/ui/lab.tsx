import type { ReactNode } from 'react';

// Small shared pieces of the "lab instrument" look. Colours come from the
// tokens in globals.css; nothing here holds a hard-coded colour.

/** Registration-mark glyph: a ring with a crosshair. Decorative. */
export function Reticle({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 1.5v6M12 16.5v6M1.5 12h6M16.5 12h6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** The strip across the top of a panel: a caps label left, anything right. */
export function PanelBar({ label, children }: { label: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 sm:px-6 min-h-12 py-2">
      <div className="label-caps text-muted-foreground flex items-center gap-2 min-w-0">{label}</div>
      {children}
    </div>
  );
}

/** A small status lamp with a caps word beside it, e.g. ● INPUT. */
export function StatusLamp({ label, live = false }: { label: string; live?: boolean }) {
  return (
    <span className="label-caps text-muted-foreground inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`inline-block w-2 h-2 rounded-full bg-accent-ink ${live ? 'lab-blink' : ''}`}
      />
      {label}
    </span>
  );
}

/**
 * Numbered section heading: "01  FOUNDATION ———" with an optional hint below.
 * The index is part of the heading text; the rule is decorative.
 */
export function SectionHeading({
  index,
  title,
  hint,
  id,
  as: Tag = 'h3',
}: {
  index: string;
  title: string;
  hint?: string;
  id?: string;
  as?: 'h2' | 'h3' | 'h4';
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Tag id={id} className="label-caps text-foreground flex items-baseline gap-3 shrink-0">
          <span className="text-accent-ink">{index}</span>
          <span>{title}</span>
        </Tag>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      {hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

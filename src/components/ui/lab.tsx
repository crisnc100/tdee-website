import type { ReactNode } from 'react';
import Link from 'next/link';

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
 * The index is read as part of the heading unless hideIndex is set, which
 * keeps the heading's accessible name to the title alone. The rule is
 * decorative.
 */
export function SectionHeading({
  index,
  title,
  hint,
  id,
  hideIndex = false,
  as: Tag = 'h3',
}: {
  index: string;
  title: string;
  hint?: string;
  id?: string;
  hideIndex?: boolean;
  as?: 'h2' | 'h3' | 'h4';
}) {
  const indexMark = <span className="label-caps text-accent-ink">{index}</span>;
  return (
    <div>
      <div className="flex items-center gap-3">
        {hideIndex ? (
          <>
            <span aria-hidden="true">{indexMark}</span>
            <Tag id={id} className="label-caps text-foreground min-w-0">
              {title}
            </Tag>
          </>
        ) : (
          <Tag id={id} className="label-caps text-foreground flex items-baseline gap-3 min-w-0">
            {indexMark}
            <span>{title}</span>
          </Tag>
        )}
        <span aria-hidden="true" className="h-px flex-1 min-w-4 bg-border" />
      </div>
      {hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * Two-or-more-way switch. Each option is a toggle button with aria-pressed;
 * the group is named by the element whose id is passed as labelledBy.
 */
export function Segmented<T extends string>({
  labelledBy,
  value,
  options,
  onSelect,
}: {
  labelledBy: string;
  value: T;
  options: { value: T; label: string; detail?: string }[];
  onSelect: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className="grid auto-cols-fr grid-flow-col gap-0.5 p-0.5 border border-input rounded-[3px] bg-background"
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(option.value)}
            className={`min-h-11 px-2 sm:px-3 py-1.5 rounded-[2px] flex flex-col sm:flex-row items-center justify-center gap-x-2 gap-y-0.5 transition-colors cursor-pointer ${
              selected
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span className="label-caps">{option.label}</span>
            {option.detail && (
              <span className={`font-mono text-xs ${selected ? 'opacity-80' : 'opacity-100'}`}>{option.detail}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Shell for the legal pages: a bracketed sheet with a caps document label. */
export function DocSheet({
  label,
  title,
  updated,
  children,
}: {
  label: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        <article className="panel brackets">
          <div aria-hidden="true" className="ruler opacity-70" />
          <div className="p-5 sm:p-10">
            <p className="label-caps text-muted-foreground">
              Document <span className="mx-1">{'//'}</span> {label}
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 readout text-sm text-muted-foreground">{updated}</p>
            <div className="mt-8 border-t border-border">{children}</div>
          </div>
        </article>
      </div>
    </div>
  );
}

/** A numbered section of a legal page, e.g. "§01  Summary". */
export function DocSection({
  index,
  title,
  children,
  className = '',
}: {
  index: number;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`grid gap-2 sm:grid-cols-[4rem_minmax(0,1fr)] py-6 border-b border-border ${className}`}>
      <span aria-hidden="true" className="readout text-sm text-accent-ink pt-0.5">
        §{String(index).padStart(2, '0')}
      </span>
      <div>
        <h2 className="label-caps text-foreground mb-3">{title}</h2>
        <div className="space-y-3 text-foreground leading-relaxed">{children}</div>
      </div>
    </section>
  );
}

/** Bulleted list with mono dash markers. */
export function DashList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden="true" className="font-mono text-muted-foreground">
            —
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Back link at the foot of a document. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div className="mt-8">
      <Link
        href={href}
        className="inline-flex items-center gap-2 min-h-11 label-caps text-accent-ink hover:underline underline-offset-4"
      >
        {children}
      </Link>
    </div>
  );
}

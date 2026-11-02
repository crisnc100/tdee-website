import Link from 'next/link';

const notes = [
  {
    title: 'Straightforward',
    body: 'An estimate built from published formulas and your own activity, shown with a range instead of a single exact number.',
  },
  {
    title: 'Private',
    body: "No accounts. Your inputs and results are saved only in your browser's local storage on this device.",
  },
  {
    title: 'Free',
    body: 'No sign-up and no subscription.',
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <dl className="grid grid-cols-1 md:grid-cols-3 border border-border divide-y md:divide-y-0 md:divide-x divide-border">
          {notes.map((note, i) => (
            <div key={note.title} className="p-5">
              <dt className="label-caps text-foreground flex items-baseline gap-3">
                <span className="text-accent-ink">{String(i + 1).padStart(2, '0')}</span>
                {note.title}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{note.body}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="label-caps text-muted-foreground">Estimates only. Not medical advice.</p>
          <nav aria-label="Legal" className="flex items-center gap-1 -mx-2">
            <Link
              href="/privacy"
              className="label-caps text-muted-foreground hover:text-foreground inline-flex items-center min-h-11 px-2 transition-colors"
            >
              Privacy Policy
            </Link>
            <span aria-hidden="true" className="text-border-strong">
              /
            </span>
            <Link
              href="/terms"
              className="label-caps text-muted-foreground hover:text-foreground inline-flex items-center min-h-11 px-2 transition-colors"
            >
              Terms of Service
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

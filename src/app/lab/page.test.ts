// Renders the /lab page to static markup (no browser) and checks what a reader
// and a screen reader get: every chart named and backed by a table, the
// sections in order, and every number coming from calibration.json.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import committed from '../../lib/engine/calibration.json';
import type { CalibrationReport } from '../../lib/engine/calibration';

async function render(mutate?: (report: CalibrationReport) => void) {
  vi.resetModules();
  const json = structuredClone(committed) as unknown as CalibrationReport;
  mutate?.(json);
  vi.doMock('@/lib/engine/calibration.json', () => ({ default: json }));
  const page = await import('./page');
  return { html: renderToStaticMarkup(createElement(page.default)), metadata: page.metadata };
}

afterEach(() => {
  vi.doUnmock('@/lib/engine/calibration.json');
});

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');

describe('/lab page', () => {
  it('renders with no missing or non-finite values', async () => {
    const { html } = await render();
    expect(html).not.toMatch(/NaN|undefined|Infinity|\[object Object\]/);
  });

  it('names every chart for assistive tech, once per visible drawing', async () => {
    const { html } = await render();
    const svgs = html.match(/<svg[^>]*>/g) ?? [];
    expect(svgs).toHaveLength(4); // two charts, each drawn compact and wide
    for (const svg of svgs) {
      expect(svg).toContain('role="img"');
      expect(svg).toMatch(/aria-label="[^"]{40,}"/);
    }
    const labels = svgs.map((svg) => svg.match(/aria-label="([^"]*)"/)?.[1]);
    expect(labels[0]).toBe(labels[1]);
    expect(labels[2]).toBe(labels[3]);
    // Only one drawing of each pair is displayed at any width.
    expect(html.match(/<div class="sm:hidden[^"]*"><svg/g)).toHaveLength(2);
    expect(html.match(/<div class="hidden sm:block"><svg/g)).toHaveLength(2);
  });

  it('gives each chart a table of its data, and the sweep a real table', async () => {
    const { html } = await render();
    const figures = html.match(/<figure[\s\S]*?<\/figure>/g) ?? [];
    expect(figures).toHaveLength(2);
    for (const figure of figures) expect(figure).toContain('<table');
    expect(html).toMatch(/<caption[^>]*>Coverage of the 50, 80 and 95% bands by mean logging bias and day/);
    expect(html).toContain('scope="rowgroup"');
  });

  it('has the sections in order, as level-2 headings', async () => {
    const { html } = await render();
    const headings = [...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((m) => m[1]);
    expect(headings).toEqual([
      'Accuracy over time',
      'Calibration',
      'Robustness to under-logging',
      'Edge cohorts',
      'Known limits',
      'Reproduce it',
    ]);
  });

  it('states the 20% limit and the gated range plainly', async () => {
    const page = text((await render()).html);
    expect(page).toContain('20% mean under-logging is the limit.');
    expect(page).toContain('CI asserts mean bias from 0 to 15%');
    expect(page).toContain('47/80/96% at day 7');
  });

  it('links the engine README on GitHub, main branch, and gives the commands', async () => {
    const { html } = await render();
    expect(html).toContain('href="https://github.com/crisnc100/tdee-website/blob/main/src/lib/engine/README.md"');
    expect(html).toMatch(/npm ci\nnpm run calibrate\nnpm test/);
  });

  it('carries its own title and description', async () => {
    const { metadata } = await render();
    expect(metadata.title).toBe('Engine Lab · TDEE Calculator');
    expect(typeof metadata.description).toBe('string');
    expect(String(metadata.description).length).toBeGreaterThan(40);
  });

  it('prints the headline numbers from the committed file', async () => {
    const page = text((await render()).html);
    expect(page).toContain('By day 56 its median error is 68 kcal/day against the formula\'s 189');
    expect(page).toContain('holds the true value for 81% of people');
    expect(page).toContain('seed 20261103');
  });

  it('follows the JSON: change the file and the page changes with it', async () => {
    const page = text(
      (
        await render((r) => {
          r.config.seed = 4242;
          r.config.people.realistic = 4321;
          const day56 = r.cohorts.realistic.checkpoints.find((c) => c.day === 56);
          if (!day56) throw new Error('fixture');
          day56.medianAbsErrorKcal.engine = 77.4;
          day56.medianAbsErrorKcal.formula = 201.2;
          day56.coverage.p80 = 0.7712;
          const top = r.sweep.variants[r.config.priorVariant]?.levels.at(-1)?.checkpoints[0];
          if (!top) throw new Error('fixture');
          top.coverage = { p50: 0.41, p80: 0.72, p95: 0.9 };
        })
      ).html,
    );
    expect(page).toContain('By day 56 its median error is 77 kcal/day against the formula\'s 201');
    expect(page).toContain('holds the true value for 77% of people');
    expect(page).toContain('tested on 4,321 synthetic people');
    expect(page).toContain('seed 4242');
    expect(page).toContain('41/72/90% at day 7');
    expect(page).not.toContain('20261103');
    expect(page).not.toContain('47/80/96');
  });

  it('refuses to build from a report of another schema version', async () => {
    await expect(
      render((r) => {
        r.schemaVersion = 3;
      }).then(({ html }) => html),
    ).rejects.toThrow(/schema version 3/);
  });
});

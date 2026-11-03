// The two ways into /lab: the footer on every page, and the Track tab's explainer.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Footer from '../../components/layout/Footer';
import TrackPanel from '../../components/track/TrackPanel';

const LINK = /<a[^>]*href="\/lab"[^>]*>How accurate is this\? <span aria-hidden="true">→<\/span><\/a>/;

describe('links to /lab', () => {
  it('are in the footer', () => {
    expect(renderToStaticMarkup(createElement(Footer))).toMatch(LINK);
  });

  it('are in the Track tab explainer, for a real log and for the sample', () => {
    const props = {
      entries: [],
      engine: null,
      unit: 'kg' as const,
      today: '2026-11-03',
      log: { commit: async () => ({ ok: true as const, value: [] }), notice: null, saveError: null },
      status: null,
      onStatus: () => {},
      onLoadSample: () => {},
    };
    const sample = { matched: false, meanLoggingGapKcal: 200, truthTodayKcal: 2300, savedEntries: 0, onExit: () => {} };
    for (const html of [
      renderToStaticMarkup(createElement(TrackPanel, { ...props, sample: null })),
      renderToStaticMarkup(createElement(TrackPanel, { ...props, sample })),
    ]) {
      const explainer = html.match(/Why it can differ from your true TDEE[\s\S]*?<\/div>/)?.[0] ?? '';
      expect(explainer).toMatch(LINK);
    }
  });
});

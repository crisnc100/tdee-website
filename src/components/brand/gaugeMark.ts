// The app mark: a 270-degree dial with a lime reading arc and needle, drawn on
// a 32-unit grid centred at (16, 17). The same paths feed the header glyph,
// src/app/icon.svg (kept in step by hand), and the PNG icon routes.

export const GAUGE_TRACK = 'M8.929 24.071A10 10 0 1 1 23.071 24.071';
export const GAUGE_ARC = 'M8.929 24.071A10 10 0 1 1 24.66 12';
export const GAUGE_NEEDLE = 'M16 17L21.63 13.75';

// Fixed colours for the icon files, which sit outside the theme: the dark
// tokens' background, accent and border-strong (globals.css .dark).
export const MARK_BG = '#0a0c0b';
export const MARK_LIME = '#c5f03c';
export const MARK_TRACK = '#3d453e';

/**
 * The mark as a standalone SVG string on its near-black tile. `pad` adds
 * grid units of background around the 32-unit tile, for icons that the
 * platform masks (apple-touch). `rounded` gives the tile its own corners.
 */
export function gaugeMarkSvg({ pad = 0, rounded = true }: { pad?: number; rounded?: boolean } = {}): string {
  const size = 32 + pad * 2;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${size} ${size}">`,
    `<rect x="${-pad}" y="${-pad}" width="${size}" height="${size}" rx="${rounded ? 6 : 0}" fill="${MARK_BG}"/>`,
    `<path d="${GAUGE_TRACK}" fill="none" stroke="${MARK_TRACK}" stroke-width="3"/>`,
    `<path d="${GAUGE_ARC}" fill="none" stroke="${MARK_LIME}" stroke-width="3.5"/>`,
    `<path d="${GAUGE_NEEDLE}" stroke="${MARK_LIME}" stroke-width="2.5" stroke-linecap="round"/>`,
    `<circle cx="16" cy="17" r="2.5" fill="${MARK_LIME}"/>`,
    `</svg>`,
  ].join('');
}

export function gaugeMarkDataUri(options?: { pad?: number; rounded?: boolean }): string {
  return `data:image/svg+xml;base64,${Buffer.from(gaugeMarkSvg(options)).toString('base64')}`;
}

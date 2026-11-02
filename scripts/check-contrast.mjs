// Checks WCAG contrast for the colour tokens in src/app/globals.css, in both
// themes. Light values come from @theme, dark values from the .dark block.
// Usage: node scripts/check-contrast.mjs   (exits 1 if any pair fails)
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');

function tokensIn(block) {
  const out = {};
  for (const m of block.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[m[1]] = m[2];
  return out;
}

const themeBlock = css.match(/@theme\s*\{([\s\S]*?)\n\}/)[1];
const darkBlock = css.match(/\.dark\s*\{([\s\S]*?)\n {2}\}/)[1];
const light = tokensIn(themeBlock);
const dark = { ...light, ...tokensIn(darkBlock) };

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// Composite a foreground drawn at `alpha` opacity onto an opaque background,
// giving the colour that actually reaches the screen.
function composite(fg, bg, alpha) {
  const ch = (hex, i) => parseInt(hex.slice(i, i + 2), 16);
  return (
    '#' +
    [1, 3, 5]
      .map((i) => Math.round(alpha * ch(fg, i) + (1 - alpha) * ch(bg, i)).toString(16).padStart(2, '0'))
      .join('')
  );
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground token, background token, minimum ratio, what it is]
const TEXT = 4.5;
const UI = 3; // non-text: field borders, focus rings, gauge arc, meter bars
const pairs = [
  ['foreground', 'background', TEXT, 'body text'],
  ['foreground', 'card', TEXT, 'text on cards'],
  ['foreground', 'muted', TEXT, 'text on inset surfaces'],
  ['muted-foreground', 'background', TEXT, 'secondary text'],
  ['muted-foreground', 'card', TEXT, 'secondary text on cards'],
  ['muted-foreground', 'muted', TEXT, 'secondary text on inset surfaces'],
  ['background', 'foreground', TEXT, 'inverted chip / selected segment'],
  ['accent-foreground', 'accent', TEXT, 'primary button label'],
  ['accent-ink', 'card', TEXT, 'key number / accent text on cards'],
  ['accent-ink', 'background', TEXT, 'accent text on page'],
  ['accent-ink', 'muted', UI, 'meter fill on inset track'],
  ['danger', 'card', TEXT, 'validation errors'],
  ['danger', 'background', TEXT, 'validation errors on page'],
  ['deficit', 'card', TEXT, 'deficit values'],
  ['surplus', 'card', TEXT, 'surplus values'],
  ['warning', 'card', TEXT, 'warning callout text'],
  ['input', 'card', UI, 'field border on card'],
  ['input', 'background', UI, 'field border on page'],
  ['ring', 'card', UI, 'focus ring on card'],
  ['ring', 'background', UI, 'focus ring on page'],
  ['accent', 'background', 1, 'button fill vs page (info only)'],
];

// Text drawn with reduced opacity. The opacity is read from the source, so a
// change there is checked against the composited colour, not the bare token.
const lab = readFileSync(new URL('../src/components/ui/lab.tsx', import.meta.url), 'utf8');
const placeholderRule = css.match(/\.field::placeholder\s*\{([^}]*)\}/);
const placeholderOpacity = placeholderRule
  ? Number(placeholderRule[1].match(/opacity:\s*([\d.]+)/)?.[1] ?? 1)
  : NaN;
const detailClass = lab.match(/option\.detail && \(?\s*<span className=\{`([^`]*)`\}/)?.[1] ?? '';
const detailBranches = detailClass.match(/\$\{selected \? '([^']*)' : '([^']*)'\}/);
const twOpacity = (cls) => Number(cls.match(/(?:^|\s)opacity-(\d+)/)?.[1] ?? 100) / 100;
const [detailSelected, detailUnselected] = detailBranches
  ? [twOpacity(detailBranches[1]), twOpacity(detailBranches[2])]
  : [NaN, NaN];

// [foreground token, background token, opacity, minimum ratio, what it is]
const alphaPairs = [
  ['muted-foreground', 'background', placeholderOpacity, TEXT, 'field placeholder (.field::placeholder)'],
  ['muted-foreground', 'background', detailUnselected, TEXT, 'segmented detail, unselected'],
  ['foreground', 'muted', detailUnselected, TEXT, 'segmented detail, unselected hover'],
  ['background', 'foreground', detailSelected, TEXT, 'segmented detail, selected'],
];

let failed = 0;
for (const [name, theme] of [['light', light], ['dark', dark]]) {
  console.log(`\n${name.toUpperCase()}`);
  for (const [fg, bg, min, what] of pairs) {
    if (!theme[fg] || !theme[bg]) {
      console.log(`  MISSING  ${fg} on ${bg}`);
      failed++;
      continue;
    }
    const r = ratio(theme[fg], theme[bg]);
    const ok = r >= min;
    if (!ok) failed++;
    const tag = min === 1 ? 'info' : ok ? 'pass' : 'FAIL';
    console.log(
      `  ${tag.padEnd(4)}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${fg} ${theme[fg]} on ${bg} ${theme[bg]}  - ${what}`
    );
  }
  for (const [fg, bg, alpha, min, what] of alphaPairs) {
    if (!theme[fg] || !theme[bg] || !(alpha >= 0 && alpha <= 1)) {
      console.log(`  MISSING  ${fg} on ${bg} (opacity ${alpha}) - ${what}; source pattern not found`);
      failed++;
      continue;
    }
    const eff = composite(theme[fg], theme[bg], alpha);
    const r = ratio(eff, theme[bg]);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(
      `  ${(ok ? 'pass' : 'FAIL').padEnd(4)}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${fg} ${theme[fg]} @ ${alpha} = ${eff} on ${bg} ${theme[bg]}  - ${what}`
    );
  }
}
console.log(failed ? `\n${failed} pair(s) below the minimum` : '\nAll pairs meet their minimum');
process.exit(failed ? 1 : 0);

import { describe, expect, it } from 'vitest';
import { resolveTab, settleTab } from './tabs';

describe('results tab', () => {
  it('keeps Track, and its Undo, after the last entry is deleted from the default tab', () => {
    // Results open with one entry: the default is Track, and it is fixed as the choice.
    const chosen = settleTab(null, true, true);
    expect(chosen).toBe('track');
    expect(resolveTab(chosen, true)).toBe('track');
    // Deleting that entry empties the log. Left unsettled, the default would switch to Breakdown.
    expect(resolveTab(null, false)).toBe('calculator');
    expect(settleTab(chosen, false, true)).toBe('track');
    expect(resolveTab(chosen, false)).toBe('track');
  });

  it('does not switch to Track when another tab adds the first entry', () => {
    const chosen = settleTab(null, false, true);
    expect(chosen).toBe('calculator');
    expect(resolveTab(settleTab(chosen, true, true), true)).toBe('calculator');
  });

  it('waits to fix the default until results show and the log has loaded', () => {
    expect(settleTab(null, false, false)).toBeNull();
    expect(resolveTab(null, true)).toBe('track');
  });

  it('keeps a tab the user chose', () => {
    expect(settleTab('meals', true, true)).toBe('meals');
    expect(resolveTab('education', true)).toBe('education');
  });
});

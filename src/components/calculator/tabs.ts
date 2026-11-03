// Which results tab shows. Pure, so the rule is testable without a DOM.

export type Tab = 'calculator' | 'meals' | 'education' | 'track';

/** The tab to show: the one chosen, or by default Track once the log has entries, else Breakdown. */
export function resolveTab(chosen: Tab | null, hasEntries: boolean): Tab {
  return chosen ?? (hasEntries ? 'track' : 'calculator');
}

/**
 * The choice to keep once the results are showing and the log has loaded: the
 * default is fixed then, so a later change to the log never switches tabs on
 * its own. Deleting the last entry keeps Track, and its Undo, on screen.
 */
export function settleTab(chosen: Tab | null, hasEntries: boolean, ready: boolean): Tab | null {
  return chosen === null && ready ? resolveTab(null, hasEntries) : chosen;
}

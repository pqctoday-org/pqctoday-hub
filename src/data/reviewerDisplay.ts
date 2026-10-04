// SPDX-License-Identifier: GPL-3.0-only
/**
 * How a stored reviewer name is shown to readers. The earliest automated records carry a
 * tool-specific name; every public surface (the "reviewed by" badge, the revision feeds and the
 * OSCAL files) calls them "maintainer (automated)" (owner decision, 2026-10-03/04). The stored
 * revision ledger is not edited: this is a display alias only.
 */
export const REVIEWER_DISPLAY_ALIASES: ReadonlyMap<string, string> = new Map([
  ['claude-agent (automated remediation)', 'maintainer (automated)'],
])

/** The name to show for a stored `reviewer_display`. */
export function reviewerDisplay(stored: string): string {
  return REVIEWER_DISPLAY_ALIASES.get(stored) ?? stored
}

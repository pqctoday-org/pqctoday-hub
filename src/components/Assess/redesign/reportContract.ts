// SPDX-License-Identifier: GPL-3.0-only
//
// The contract between the Assess track chooser and the Report page.
//
// Fast track produces the always-visible report sections; the 5 extra full-track
// questions unlock the 4 gated analytical sections (Risk breakdown, Algorithm
// migration, Migration roadmap, Progress over time). The live report gates those
// four on `result.categoryScores` / `result.algorithmMigrations` — i.e. data only
// a comprehensive assessment produces.
//
// FULL_LOCKED_SECTIONS is the HARD contract: these four names must match the
// report's four gated sections. Keep them in sync if the report's gated set
// changes. FAST_REPORT_SECTIONS is a curated summary for the chooser card (it
// merges the report's separate "Key findings" and "Threat landscape" into one
// line), so it is intentionally not a 1:1 section map.

export const FAST_REPORT_SECTIONS: readonly string[] = [
  'Risk score & verdict',
  'Key findings & threat landscape',
  'Assessment profile',
  'HNDL exposure window',
  'Compliance impact',
  'Recommended actions',
]

export const FULL_LOCKED_SECTIONS: readonly string[] = [
  'Per-domain risk breakdown',
  'Algorithm migration map',
  'Dated migration roadmap',
  'Progress over time',
]

/** Count of report sections that stay locked on the fast track. */
export const FAST_LOCKED_COUNT = FULL_LOCKED_SECTIONS.length

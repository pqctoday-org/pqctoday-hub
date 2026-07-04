// SPDX-License-Identifier: GPL-3.0-only
//
// The contract between the Assess track chooser and the Report page.
//
// Fast track produces the always-visible report sections; the extra full-track
// questions unlock the 2 genuinely-gated analytical sections (per-domain risk
// breakdown, progress-over-time). The live report gates exactly those two on
// `result.categoryScores` (ReportLockedOverlay) — the only data a comprehensive
// assessment adds that a quick one lacks. The algorithm migration map and the
// dated roadmap are NOT gated (both tracks populate them), so they are
// deliberately absent here — advertising them as locked was misleading.
//
// FULL_LOCKED_SECTIONS is the HARD contract: these names must match the report's
// `!result.categoryScores` ReportLockedOverlay sections. Keep them in sync if the
// report's gated set changes. FAST_REPORT_SECTIONS is a curated summary for the
// chooser card (it merges the report's separate "Key findings" and "Threat
// landscape" into one line), so it is intentionally not a 1:1 section map.

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
  'Progress over time',
]

/** Count of report sections that stay locked on the fast track. */
export const FAST_LOCKED_COUNT = FULL_LOCKED_SECTIONS.length

// SPDX-License-Identifier: AGPL-3.0-only
//
// The contract between the Assess track chooser and the Report page.
//
// Fast track produces the always-visible report sections; the extra full-track
// questions unlock the 2 genuinely-gated analytical sections (per-domain risk
// breakdown, progress-over-time). The live report gates exactly those two on
// `result.assessmentProfile?.mode === 'comprehensive'` (ReportLockedOverlay) —
// NOT on `result.categoryScores`, which the engine emits (coarse) on every
// track to feed the sim & KPIs, so its mere presence can't distinguish a fast
// report from a full one. `mode` is the honest signal, derived from whether
// the extended full-track questions were actually answered.
//
// FULL_LOCKED_SECTIONS is the HARD contract: these names must match the report's
// `!isComprehensive` ReportLockedOverlay sections. Keep them in sync if the
// report's gated set changes. FAST_REPORT_SECTIONS is a curated summary for the
// chooser card (it merges the report's separate "Key findings" and "Threat
// landscape" into one line), so it is intentionally not a 1:1 section map.

export const FAST_REPORT_SECTIONS: readonly string[] = [
  'Risk score & verdict',
  'Key findings & threat landscape',
  'Assessment profile',
  'Algorithm migration matrix',
  'Compliance impact',
  'Recommended actions',
]

export const FULL_LOCKED_SECTIONS: readonly string[] = [
  'Per-domain risk breakdown',
  'Progress over time',
]

/**
 * Sections the full track adds that the fast track does not lock behind an
 * overlay but simply cannot model, because they need answers only the full
 * track asks (data retention and credential lifetimes). On a fast-track report
 * these show a "not modelled" notice instead of a window, so the chooser lists
 * them as full-track additions rather than as fast-track contents.
 */
export const FULL_ONLY_SECTIONS: readonly string[] = ['HNDL & HNFL risk windows']

/** Count of report sections that stay locked on the fast track. */
export const FAST_LOCKED_COUNT = FULL_LOCKED_SECTIONS.length

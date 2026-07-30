// SPDX-License-Identifier: GPL-3.0-only
/**
 * narrationFacts — single source for the real-world facts the simulation's
 * narration templates (demoDocs / derivedFinancialDocs / realToolDocs) used to
 * restate as hardcoded string literals (2026-07-29 sim review, findings
 * A-M3 / A-M4 / C-M1):
 *
 * - The EO deadline sentence existed as FOUR verbatim string copies. It now
 *   interpolates from `timelineFacts.generated` (regenerated from the newest
 *   timeline CSV at prebuild), so a CSV change propagates into narration at
 *   the next build instead of silently desyncing.
 * - The CRQC "aggressive planning band" was authored as literals ("2029–2033")
 *   alongside Mosca-Z ranges ("≈ 5–9y") that only added up from a 2024
 *   vantage. Both now DERIVE from the sim's one canonical Q-Day anchor
 *   (`QC_FIRST_YEAR`, quantumTimeline.ts — already freshness-stamped as
 *   `q-day-anchor`) and the program start year, so band and Z can never drift
 *   apart, and re-verifying the Q-Day anchor updates every narration doc.
 *
 * Layering: pure data, imports only sibling data modules (+ the Freshness
 * type back from contentFreshness, same one-way convention quantumTimeline
 * uses). The sim components import DOWN into this module, never the reverse.
 */
import { TIMELINE_COUNTRY_MILESTONES } from './timelineFacts.generated'
import { QC_FIRST_YEAR } from './quantumTimeline'
import type { Freshness } from './contentFreshness'

/** Sector vocabulary for sector-aware narration (aliased as DemoSector in demoDocs). */
export type NarrationSector =
  | 'financial'
  | 'healthcare'
  | 'government'
  | 'energy'
  | 'telecom'
  | 'retail'
  | 'general'

/**
 * The sim program's Q1 anchor year (the sim clock starts here; scenarioConfig
 * re-exports it). All in-fiction forward-plan dates in the narration docs are
 * expressed relative to this so they can never read as already-past.
 */
export const PROGRAM_START_YEAR = 2026

/** US EO 14412 (June 2026) milestone years, from the generated timeline facts. */
export const US_EO_KEM_YEAR = TIMELINE_COUNTRY_MILESTONES.US?.['hndl-critical'] ?? 2030
export const US_EO_SIG_YEAR = TIMELINE_COUNTRY_MILESTONES.US?.['tnfl-critical'] ?? 2031

/**
 * The recurring board/regulatory clause. Interpolate it — never re-type the
 * years. (The four previous verbatim copies are exactly how drift happened.)
 */
export const EO_DEADLINE_CLAUSE =
  `the June 2026 US Executive Order sets binding PQC deadlines ` +
  `(key establishment ${US_EO_KEM_YEAR}, signatures ${US_EO_SIG_YEAR}; ` +
  `CNSA 2.0 for national-security systems)`

/** A CRQC planning band plus the matching Mosca-Z label, derived together. */
export interface CrqcPlanningBand {
  startYear: number
  endYear: number
  /** e.g. "2029–2033" */
  label: string
  /** Mosca Z relative to PROGRAM_START_YEAR, e.g. "3–7y" — always consistent with `label`. */
  zLabel: string
}

const band = (offsetYears: number): CrqcPlanningBand => {
  const startYear = QC_FIRST_YEAR + offsetYears
  const endYear = startYear + 4
  return {
    startYear,
    endYear,
    label: `${startYear}–${endYear}`,
    zLabel: `${startYear - PROGRAM_START_YEAR}–${endYear - PROGRAM_START_YEAR}y`,
  }
}

/** Default aggressive planning band, anchored on Q-Day (2029–2033 / Z 3–7y). */
export const CRQC_BAND_STANDARD: CrqcPlanningBand = band(0)
/** Slightly later band for long-horizon estates (healthcare, energy): 2030–2034 / Z 4–8y. */
export const CRQC_BAND_EXTENDED: CrqcPlanningBand = band(1)

/** Per-sector band — the board deck and the sector's CRQC scenario doc MUST agree. */
export const CRQC_BAND_BY_SECTOR: Record<NarrationSector, CrqcPlanningBand> = {
  financial: CRQC_BAND_STANDARD,
  healthcare: CRQC_BAND_EXTENDED,
  government: CRQC_BAND_STANDARD,
  energy: CRQC_BAND_EXTENDED,
  telecom: CRQC_BAND_STANDARD,
  retail: CRQC_BAND_STANDARD,
  general: CRQC_BAND_STANDARD,
}

/**
 * The board-deck framing sentence for the planning band, per sector — one
 * source so the generic deck can never contradict the sector scenario doc
 * again (07-29 finding A-M3).
 */
export function crqcBandSentence(sector: NarrationSector): string {
  return (
    `This deck models an aggressive planning estimate of ` +
    `${CRQC_BAND_BY_SECTOR[sector].label} to stress-test urgency — the Applied ` +
    `Quantum Framework 2.1 range is 10–20 years; treat either as a planning ` +
    `anchor, not a forecast.`
  )
}

/**
 * Freshness stamp for the narration time anchors (PROGRAM_START_YEAR, the
 * in-fiction plan dates expressed relative to it, and derivedFinancialDocs'
 * CURRENT_YEAR which mirrors it). Re-check yearly-ish: when the program-start
 * framing moves, the fiction dates move with it by construction, but the
 * anchor itself should be a deliberate choice, not an heirloom.
 */
export const NARRATION_TIME_ANCHOR_FRESHNESS: Freshness = {
  asOf: '2026-07-29',
  recheck: 'https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=post-quantum',
}

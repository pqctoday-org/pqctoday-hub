// SPDX-License-Identifier: GPL-3.0-only
/**
 * Row-level rules for the threats CSV (`quantum_threats_hsm_industries_*.csv`)
 * that more than one reader needs: the page's loader (`threatsData.ts`), the
 * RAG corpus generator (`scripts/generate-rag-corpus.ts`) and the data
 * validators. Kept free of `import.meta.glob` and of any data import so the
 * Node-side scripts can import it too.
 */

/** Statuses of rows that have been taken off the page for good. */
export const RETIRED_THREAT_STATUSES = ['deprecated', 'obsolete'] as const

/**
 * The status the private add-row tool gives a new row until its substance
 * fields (criticality, crypto at risk, PQC replacement…) are filled — the
 * stub that reached the live page as CROS-008 is what hiding it prevents.
 */
export const DRAFT_THREAT_STATUS = 'draft'

/** Statuses that keep a row off every reader-facing surface. */
export const HIDDEN_THREAT_STATUSES = [...RETIRED_THREAT_STATUSES, DRAFT_THREAT_STATUS] as const

const normalizeStatus = (status: string | null | undefined): string =>
  (status ?? '').trim().toLowerCase()

/** True when a row with this `status` may be shown to readers. */
export function isPublishedThreatStatus(status: string | null | undefined): boolean {
  return !(HIDDEN_THREAT_STATUSES as readonly string[]).includes(normalizeStatus(status))
}

/** True when a row with this `status` was retired (deprecated / obsolete). */
export function isRetiredThreatStatus(status: string | null | undefined): boolean {
  return (RETIRED_THREAT_STATUSES as readonly string[]).includes(normalizeStatus(status))
}

/**
 * Collapses near-duplicate raw `industry` labels that describe the same
 * sector under different CSV wording — verified against the corpus's own
 * `applicable_industries_normalized` tags, which tag both "Critical
 * Infrastructure" and "Energy / Critical Infrastructure" rows with the same
 * `critical-infrastructure` tag (Threats #5). Extend this map, driven by that
 * same tag evidence, if a future CSV snapshot introduces another wording
 * variant of an already-covered sector.
 */
export const THREAT_INDUSTRY_ALIASES: Readonly<Record<string, string>> = {
  'Critical Infrastructure': 'Critical Infrastructure / Energy',
  'Energy / Critical Infrastructure': 'Critical Infrastructure / Energy',
  'Critical Infrastructure / Energy': 'Critical Infrastructure / Energy',
}

/** The industry label the Threats page shows (and filters on) for a raw CSV label. */
export function canonicalThreatIndustry(raw: string): string {
  return THREAT_INDUSTRY_ALIASES[raw] ?? raw
}

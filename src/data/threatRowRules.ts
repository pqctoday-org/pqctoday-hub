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
 * The Threats page's own industry vocabulary (ruling R3, 2026-09-24):
 * "Critical Infrastructure" and "Energy / Critical Infrastructure" (and the
 * earlier merged label "Critical Infrastructure / Energy") became
 * "Critical Infrastructure / OT"; "Aerospace / Aviation" became "Aerospace /
 * Aviation / Space". "Hardware Security Modules" stays its own sector (the
 * ruling's move of HSM-001/HSM-002 to Cross-Industry was reverted on the
 * user's review, quantum_threats_hsm_industries_09242026_r4.csv). The CSV
 * carries the new labels from quantum_threats_hsm_industries_09242026_r2.csv
 * on; these aliases keep every
 * OLD label working — in `?industry=` deep links, persona maps and anything
 * built from an older snapshot. Other modules (Learn, industry landscape,
 * assessment) keep their own site-wide vocabulary; this map is the bridge
 * from theirs into the Threats page's, never a rename of theirs.
 */
export const THREAT_INDUSTRY_ALIASES: Readonly<Record<string, string>> = {
  'Critical Infrastructure': 'Critical Infrastructure / OT',
  'Energy / Critical Infrastructure': 'Critical Infrastructure / OT',
  'Critical Infrastructure / Energy': 'Critical Infrastructure / OT',
  'Aerospace / Aviation': 'Aerospace / Aviation / Space',
}

/** The industry label the Threats page shows (and filters on) for a raw CSV label. */
export function canonicalThreatIndustry(raw: string): string {
  return THREAT_INDUSTRY_ALIASES[raw] ?? raw
}

/**
 * A label's URL/anchor slug — the same derivation the page uses for its
 * `industry-<slug>` section anchors: "Critical Infrastructure / OT" →
 * `critical-infrastructure-ot`, "Aerospace / Aviation / Space" →
 * `aerospace-aviation-space`. `?industry=` accepts these (and the slugs of the
 * old labels above) as well as the labels themselves.
 */
export function threatIndustrySlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** "<id> is no longer in the catalog. This entry was retired on <date>: <reason>"
 *  — what a reader following an old link to a retired row is told. */
export function retiredThreatMessage(retired: {
  threatId: string
  deprecatedAt?: string
  deprecatedReason?: string
}): string {
  const when = retired.deprecatedAt ? ` on ${retired.deprecatedAt}` : ''
  const why = retired.deprecatedReason ? `: ${retired.deprecatedReason}` : '.'
  return `${retired.threatId} is no longer in the catalog. This entry was retired${when}${why}`
}

/**
 * The reviewed `threat_class` values (ruling R1, 2026-09-24): hndl
 * (decrypt-later), hnfl (forge-later) or both. Every published row carries one
 * — validator TP-4 fails a published row without it — so the page reads this
 * column and never guesses a class from keywords.
 */
export const THREAT_CLASSES = ['hndl', 'hnfl', 'both'] as const
export type ReviewedThreatClass = (typeof THREAT_CLASSES)[number]

/** A `threat_class` cell → its reviewed value, or undefined when blank/unknown. */
export function parseThreatClass(raw: string | null | undefined): ReviewedThreatClass | undefined {
  const v = (raw ?? '').trim().toLowerCase()
  return (THREAT_CLASSES as readonly string[]).includes(v) ? (v as ReviewedThreatClass) : undefined
}

/** Shown when a row's criticality cell is blank — never guessed as "Medium". */
export const UNRATED_CRITICALITY = 'Unrated'

/**
 * Every criticality the page can show, most severe first. `Unrated` sorts
 * below `Low`: "we don't know" must never outrank "we checked".
 */
export const CRITICALITY_ORDER = [
  'Critical',
  'High',
  'Medium-High',
  'Medium',
  'Low',
  UNRATED_CRITICALITY,
] as const

/** Sort weight for a criticality (higher = more severe). */
export function criticalityRank(criticality: string): number {
  const i = (CRITICALITY_ORDER as readonly string[]).indexOf(criticality)
  return i === -1 ? -1 : CRITICALITY_ORDER.length - i
}

/** The criticality levels that actually occur in `rows`, in severity order —
 *  so a filter never offers a level no row has. */
export function criticalityLevelsPresent(rows: readonly { criticality: string }[]): string[] {
  const present = new Set(rows.map((r) => r.criticality))
  return CRITICALITY_ORDER.filter((c) => present.has(c))
}

/** Shown in place of a blank at-risk / PQC-replacement field. */
export const NOT_YET_SPECIFIED = 'Not yet specified'

/**
 * The slugs `applicable_industries_normalized` uses (`;`-separated,
 * lowercase-hyphenated, e.g. `financial-services;banking`). Nothing in the hub
 * produces or reads this column beyond parsing it, and the private pipeline
 * records it as hand-derived (`derived_by: hand`), so there is no canonical
 * list to import: this is the vocabulary the data itself uses consistently —
 * every slug in quantum_threats_hsm_industries_09162026_r1.csv except
 * `water-wastewater`, a one-row variant (WATE-001) of the `water;wastewater`
 * pair every other Water / Wastewater row carries. Validator CM-G flags any
 * slug outside this set; add a slug here when a genuinely new sector arrives.
 * `space` arrived with "Aerospace / Aviation / Space" (ruling R3,
 * 2026-09-24); "Critical Infrastructure / OT" rows carry the existing
 * `critical-infrastructure;operational-technology` pair.
 */
export const THREAT_INDUSTRY_SLUGS: ReadonlySet<string> = new Set([
  'aerospace',
  'automotive',
  'aviation',
  'banking',
  'blockchain',
  'cloud',
  'connected-vehicles',
  'critical-infrastructure',
  'cross-industry',
  'cryptocurrency',
  'data-centers',
  'defense',
  'drm',
  'e-commerce',
  'education',
  'energy',
  'entertainment',
  'esignature',
  'financial-services',
  'government',
  'healthcare',
  'hsm',
  'insurance',
  'iot',
  'it',
  'legal',
  'logistics',
  'media',
  'notary',
  'operational-technology',
  'payment-card-industry',
  'pharmaceutical',
  'rail',
  'research',
  'retail',
  'software',
  'space',
  'supply-chain',
  'telecommunications',
  'transit',
  'wastewater',
  'water',
])

// SPDX-License-Identifier: AGPL-3.0-only
/**
 * GENERATED — do not edit by hand.
 * Source: the latest dated CSV of each tracked data source in src/data/.
 * Regenerate: npm run generate:data-filenames
 *
 * Filenames ONLY. This module exists so `useVersionStore` can fingerprint the
 * data sources without importing ten CSV-inlining loaders into the eager
 * first-paint bundle (that cost ~7.2 MB against a 15 MB `gate:precache` cap).
 * See scripts/generate-data-filenames.ts for the full reasoning.
 */

/** Current dated CSV filename per tracked source; `null` if none resolved. */
export interface GeneratedDataFilenames {
  library: string | null
  timeline: string | null
  migrate: string | null
  threats: string | null
  leaders: string | null
  compliance: string | null
  algorithms: string | null
  authoritativeSources: string | null
  certificationXref: string | null
  hsmCapabilityXref: string | null
  quiz: string | null
}

export const DATA_FILENAMES: GeneratedDataFilenames = {
  library: 'library_10302026_r21.csv',
  timeline: 'timeline_10272026.csv',
  migrate: 'pqc_product_catalog_10292026_r8.csv',
  threats: 'quantum_threats_hsm_industries_10302026_r8.csv',
  leaders: 'leaders_10282026.csv',
  compliance: 'compliance_10302026_r1.csv',
  algorithms: 'algorithms_transitions_10282026.csv',
  authoritativeSources: 'pqc_authoritative_sources_reference_10232026_r1.csv',
  certificationXref: 'migrate_certification_xref_10282026.csv',
  hsmCapabilityXref: 'migrate_hsm_capability_xref_10292026.csv',
  quiz: 'pqcquiz_10302026_r23.csv',
}

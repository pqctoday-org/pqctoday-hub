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
  library: 'library_11112026_r5.csv',
  timeline: 'timeline_11082026.csv',
  migrate: 'pqc_product_catalog_11112026_r12.csv',
  threats: 'quantum_threats_hsm_industries_11082026_r1.csv',
  leaders: 'leaders_11092026_r3.csv',
  compliance: 'compliance_11082026_r2.csv',
  algorithms: 'algorithms_transitions_11112026.csv',
  authoritativeSources: 'pqc_authoritative_sources_reference_11112026_r3.csv',
  certificationXref: 'migrate_certification_xref_11072026.csv',
  hsmCapabilityXref: 'migrate_hsm_capability_xref_10312026_r1.csv',
  quiz: 'pqcquiz_11122026_r1.csv',
}

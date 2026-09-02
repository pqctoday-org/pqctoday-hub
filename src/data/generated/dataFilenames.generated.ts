// SPDX-License-Identifier: GPL-3.0-only
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
  quiz: string | null
}

export const DATA_FILENAMES: GeneratedDataFilenames = {
  library: 'library_09012026_r4.csv',
  timeline: 'timeline_09012026_r1.csv',
  migrate: 'pqc_product_catalog_09012026.csv',
  threats: 'quantum_threats_hsm_industries_08292026.csv',
  leaders: 'leaders_08312026.csv',
  compliance: 'compliance_09012026.csv',
  algorithms: 'algorithms_transitions_07282026.csv',
  authoritativeSources: 'pqc_authoritative_sources_reference_09022026.csv',
  certificationXref: 'migrate_certification_xref_09012026.csv',
  quiz: 'pqcquiz_08172026_r2.csv',
}

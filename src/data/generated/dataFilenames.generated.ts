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
  library: 'library_08222026.csv',
  timeline: 'timeline_08212026_r3.csv',
  migrate: 'pqc_product_catalog_08182026_r34.csv',
  threats: 'quantum_threats_hsm_industries_08222026.csv',
  leaders: 'leaders_08092026_r8.csv',
  compliance: 'compliance_08212026.csv',
  algorithms: 'algorithms_transitions_07282026.csv',
  authoritativeSources: 'pqc_authoritative_sources_reference_08182026_r1.csv',
  certificationXref: 'migrate_certification_xref_08112026_r2.csv',
  quiz: 'pqcquiz_08172026_r2.csv',
}

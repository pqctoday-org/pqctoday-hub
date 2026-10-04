// SPDX-License-Identifier: GPL-3.0-only
/**
 * The values the Algorithms page's filter dropdowns offer (and its URL accepts
 * as `?family=`, `?fn=`, `?region=`, `?status=` and `?level=`).
 *
 * Kept in a plain module, with no UI imports, so the PQC Assistant can name
 * these exact values in its link grammar without loading the filter component.
 * `AlgorithmFilters.tsx` re-exports everything here, so existing importers are
 * unchanged.
 */

export const CRYPTO_FAMILY_ITEMS = [
  { id: 'All', label: 'All Families' },
  { id: 'Lattice', label: 'Lattice' },
  { id: 'Code-based', label: 'Code-based' },
  { id: 'Hash-based', label: 'Hash-based' },
  // P2.1 (2026-05-22): renamed from 'Hybrid' to 'Composite (math)' to
  // disambiguate from protocol-level "hybrid signature". The loader maps
  // legacy CSV 'Hybrid' → 'Composite' so this id matches the data.
  { id: 'Composite', label: 'Composite (math)' },
  { id: 'Multivariate', label: 'Multivariate' },
  { id: 'Isogeny', label: 'Isogeny' },
  { id: 'Classical', label: 'Classical' },
]

export const FUNCTION_ITEMS = [
  { id: 'All', label: 'All Functions' },
  { id: 'KEM', label: 'KEM / Encryption' },
  { id: 'Signature', label: 'Signature' },
]

// Grade-A remediation Phase 2 (2026-08-02, PLAN-04-ALGORITHMS.md): the prior
// "grounded-or-removed" pass (2026-07-28) only checked
// algorithms_transitions_*.csv (the Transition Guide tab's data source) and
// missed that the Detailed Comparison tab reads a SEPARATE file
// (pqc_complete_algorithm_reference_*.csv) with its own, coarser `region`
// vocabulary. The two files disagree — the reference CSV never uses bare
// 'BSI', 'ANSSI', 'ECCG', 'ASD', 'CRYPTREC', 'ACN' or 'CCN' (only the
// combined 'BSI/ANSSI'), while it DOES use 'KpqC', 'CACR' and 'Global',
// none of which were in the old list. Net effect: 7 of the 10 old options
// returned zero rows on Detailed Comparison, while real, citation-backed
// values in the data (BSI/ANSSI, KpqC, CACR, Global, plus transitions-only
// 'KR' and 'CN') were unreachable.
//
// Fixed by deriving `id` as the UNION of every distinct, non-blank `region` /
// `Region` value actually present across BOTH loaded CSVs (verified directly
// against pqc_complete_algorithm_reference_07302026.csv and
// algorithms_transitions_07282026.csv — every id below has at least one row
// with a real, dated status_url citation in one or both files). Values are
// kept separate rather than merged (e.g. 'KpqC' vs 'KR', 'CACR' vs 'CN')
// because the two CSVs tag conceptually-similar rows with different literal
// strings and the comparison in useAlgorithmExplorer.ts is exact-string
// (`algo.region !== filterRegion` / `t.region !== filterRegion`) — merging
// them would require inventing match semantics not present in the data
// itself. If a future data-cleanup pass consolidates the CSV vocabulary,
// shrink this list to match.
export const REGION_ITEMS = [
  { id: 'All', label: 'All Regions' },
  { id: 'NIST', label: 'NIST (US)' },
  { id: 'IETF', label: 'IETF (Global)' },
  { id: 'ETSI', label: 'ETSI (Europe)' },
  { id: 'BSI', label: 'BSI (Germany)' },
  { id: 'ANSSI', label: 'ANSSI (France)' },
  { id: 'BSI/ANSSI', label: 'BSI/ANSSI (Germany/France)' },
  { id: 'ECCG', label: 'ECCG (EU)' },
  { id: 'ASD', label: 'ASD (Australia)' },
  { id: 'CRYPTREC', label: 'CRYPTREC (Japan)' },
  { id: 'ACN', label: 'ACN (Italy)' },
  { id: 'CCN', label: 'CCN (Spain)' },
  { id: 'KpqC', label: 'KpqC (South Korea)' },
  { id: 'KR', label: 'KR (South Korea, general)' },
  { id: 'CACR', label: 'CACR (China)' },
  { id: 'CN', label: 'CN (China, general)' },
  { id: 'Global', label: 'Global' },
]

export const STATUS_ITEMS = [
  { id: 'All', label: 'All Statuses' },
  { id: 'Certified', label: 'Certified' },
  { id: 'Candidate', label: 'Candidate' },
  { id: 'To Be Checked', label: 'To Be Checked' },
]

export const LEVEL_ITEMS = [
  { id: 'All', label: 'All Levels' },
  { id: '1', label: 'Level 1' },
  { id: '2', label: 'Level 2' },
  { id: '3', label: 'Level 3' },
  { id: '4', label: 'Level 4' },
  { id: '5', label: 'Level 5' },
]

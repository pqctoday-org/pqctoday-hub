// SPDX-License-Identifier: GPL-3.0-only
/** Slim CVE record produced by `pqctoday-priv/scripts/scrape-nvd.py`. The per-CPE sweep keeps
 *  only Medium+, but a small curated set of famous teaching CVEs (Heartbleed,
 *  POODLE, FREAK, Logjam, DROWN, BEAST) is pinned in even when modern CVSS v3
 *  scores them LOW — so `'LOW'` can appear, but only for those pinned entries. */
export interface CveRecord {
  cveId: string
  summary: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  cvssScore: number | null
  /** ISO date (YYYY-MM-DD). */
  published: string
  /** ISO date (YYYY-MM-DD). */
  lastModified: string
  refUrl: string
  /** True for the curated famous-CVE teaching set pinned past the Medium+ floor.
   *  Lets the UI badge them as a deliberate educational inclusion. */
  pinned?: boolean
}

/** On-disk shape of `public/data/cve-snapshot.json`. Generated nightly. */
export interface CveSnapshot {
  /** ISO timestamp the snapshot was generated. */
  generatedAt: string
  /** Filename of the source migrate_cpe_xref CSV the snapshot was built from. */
  sourceCsv: string
  /** Top-20 CVEs per CPE (MEDIUM+, sorted by severity → CVSS score → date). */
  byCpe: Record<string, CveRecord[]>
  /**
   * NVD `totalResults` for each CPE before the 20-cap is applied.
   * Optional: absent in snapshots generated before this field was added.
   * Used by the UI to show "showing 20 of X total CVEs".
   */
  totalByCpe?: Record<string, number>
}

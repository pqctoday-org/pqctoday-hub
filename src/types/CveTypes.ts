// SPDX-License-Identifier: GPL-3.0-only
/** Slim CVE record produced by `scripts/scrape-nvd.py`. Low / None severity
 *  records are excluded at scrape time, so only Medium+ ever appears here. */
export interface CveRecord {
  cveId: string
  summary: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  cvssScore: number | null
  /** ISO date (YYYY-MM-DD). */
  published: string
  /** ISO date (YYYY-MM-DD). */
  lastModified: string
  refUrl: string
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

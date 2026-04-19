// SPDX-License-Identifier: GPL-3.0-only
/**
 * Max-penalty lookup for compliance frameworks, keyed by the `id` column of
 * `src/data/compliance_*.csv`. Values are in USD millions (rounded to whole
 * millions for headline clarity — these are regulatory maxima, not expected
 * values). Used by the executive-facing regulatory-exposure-index KPI.
 *
 * Sources are public regulatory documents; values are "maximum fine per
 * violation" or "maximum fine per incident", whichever is higher. Revenue-
 * percentage regimes (GDPR, NIS2) are converted to a representative cap
 * appropriate for a mid-sized regulated enterprise; override per org when
 * needed via the user-editable score on the KPI.
 *
 * Add new frameworks here when adding rows to the compliance CSV — a missing
 * entry is treated as "no explicit fine data yet" and contributes 0 to the
 * exposure index (rather than silently defaulting to a false value).
 */
export const FRAMEWORK_MAX_FINE_USD_MILLIONS: Record<string, number> = {
  // EU / global
  GDPR: 25, // up to €20M or 4% global revenue — €25M representative cap
  NIS2: 12, // €10M or 2% global revenue
  'NIS-2': 12,
  DORA: 12, // up to 2% global revenue for financial entities
  EUCC: 5, // scheme sanctions / certificate revocation cost
  eIDAS2: 10,
  'EU-AI-Act': 38, // up to €35M or 7% — top-tier violations

  // United States
  'CNSA-2.0': 500, // not a fine per se — lost USG procurement eligibility ≈ $500M+ for covered vendors
  'NSM-10': 500,
  CMMC: 10, // contract ineligibility + false claims act exposure
  HIPAA: 2, // $1.9M / year per violation category (tier 4)
  'PCI-DSS': 2, // $100K/month per violation × 24 mo representative ceiling
  GLBA: 2,
  SOX: 5, // $5M + prison for executive certification failures
  FISMA: 10, // contract loss

  // UK / other
  'UK-GDPR': 22, // £17.5M
  'UK-NIS': 22,

  // APAC
  'APRA-CPS-234': 5,
  PIPEDA: 0.08, // CAD $100K
  PIPL: 7, // ¥50M or 5% revenue
  PDPA: 1, // SG PDPA up to SGD 1M

  // Financial
  SOC2: 0, // not a fine — loss of attestation has contract impact only
  ISO27001: 0,
  'NY-DFS-500': 10, // civil money penalty potential
  CCPA: 8, // up to $7.5K per intentional violation — aggregate representative

  // Defense
  'DoD-Instruction-8582': 100,
  NIST: 0, // standards body, not a regulator
  'NIST-IR-8547': 0,
  ANSSI: 0,
}

/**
 * Look up the max fine (USD millions) for a framework id. Returns 0 when the
 * id is not in the lookup — the caller should treat 0 as "no exposure data".
 */
export function getFrameworkMaxFine(frameworkId: string): number {
  if (!frameworkId) return 0
  // eslint-disable-next-line security/detect-object-injection
  return FRAMEWORK_MAX_FINE_USD_MILLIONS[frameworkId] ?? 0
}

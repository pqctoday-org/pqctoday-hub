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
 *
 * KEY DISCIPLINE: every key MUST equal the `id` of an *active* row in the
 * latest compliance CSV, OR be listed in `KNOWN_INACTIVE_FINE_KEYS` below.
 * Keys that match nothing are dead weight: the KPI looks fines up by the
 * framework's CSV id, so a mismatched key silently contributes $0.
 * `frameworkFines.test.ts` enforces this invariant.
 */
export const FRAMEWORK_MAX_FINE_USD_MILLIONS: Record<string, number> = {
  // EU / global
  GDPR: 25, // up to €20M or 4% global revenue — €25M representative cap
  NIS2: 12, // €10M or 2% global revenue
  DORA: 12, // up to 2% global revenue for financial entities
  EUCC: 5, // scheme sanctions / certificate revocation cost
  EIDAS: 10, // eIDAS 2.0 (CSV id `EIDAS`, label "eIDAS 2.0")
  'EU-AI-Act': 38, // up to €35M or 7% — top-tier violations

  // United States
  'CNSA-2': 500, // not a fine per se — lost USG procurement eligibility ≈ $500M+ for covered vendors
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
  'SOC-2': 0, // not a fine — loss of attestation has contract impact only
  'ISO-27001': 0,
  'DFS-NYCRR-500': 10, // NY DFS 23 NYCRR 500 — civil money penalty potential
  CCPA: 8, // up to $7.5K per intentional violation — aggregate representative

  // Defense
  'DoD-Instruction-8582': 100,
  NIST: 0, // standards body, not a regulator
  'NIST-IR-8547': 0,
  ANSSI: 0,
}

/**
 * Fine keys that intentionally do NOT match any active compliance-CSV id.
 * These frameworks have documented penalty regimes but no row (yet) in
 * `compliance_*.csv`, so they never contribute to the exposure KPI today.
 * They are kept so the data is ready the moment a CSV row is added — at
 * which point the drift-guard test fails and the key must be REMOVED from
 * this list (it will then start counting).
 *
 * Reviewed 2026-07-10 against compliance_07092026.csv (171 active ids).
 */
export const KNOWN_INACTIVE_FINE_KEYS: ReadonlySet<string> = new Set([
  'EU-AI-Act', // EU AI Act — no compliance row; PQC relevance indirect
  'GLBA', // Gramm-Leach-Bliley — no CSV row
  'SOX', // Sarbanes-Oxley — no CSV row
  'UK-GDPR', // UK GDPR — CSV covers UK via UK-NCSC/ICO-UK-ENC, not UK-GDPR
  'UK-NIS', // UK NIS Regulations — no CSV row
  'PIPEDA', // Canada PIPEDA — CSV covers Canada via CCCS-ITSM
  'PIPL', // China PIPL — CSV covers China via OSCCA ids
  'PDPA', // Singapore PDPA — CSV covers SG via MAS-CIRCULAR / SG-CSA-QUANTUM
  'CCPA', // California CCPA — no CSV row
  'DoD-Instruction-8582', // DoD 8582 — CSV covers DoD via DISA-STIG / CMMC
])

/**
 * Look up the max fine (USD millions) for a framework id. Returns 0 when the
 * id is not in the lookup — the caller should treat 0 as "no exposure data".
 */
export function getFrameworkMaxFine(frameworkId: string): number {
  if (!frameworkId) return 0
  // eslint-disable-next-line security/detect-object-injection
  return FRAMEWORK_MAX_FINE_USD_MILLIONS[frameworkId] ?? 0
}

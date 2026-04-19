// SPDX-License-Identifier: GPL-3.0-only
// Industry breach cost baselines — IBM Cost of a Data Breach Report 2024
// TODO(F11): refresh to IBM 2025 edition (published July 2025) before Q3 exec
// reviews — numbers have shifted materially for Healthcare, Finance, and Tech.
export const INDUSTRY_BREACH_BASELINES_AS_OF = '2024-07'
export const INDUSTRY_BREACH_BASELINES: Record<string, number> = {
  'Finance & Banking': 6_080_000,
  Healthcare: 9_770_000,
  'Government & Defense': 2_760_000,
  Technology: 4_970_000,
  Telecommunications: 4_290_000,
  'Energy & Utilities': 4_780_000,
  'Retail & E-Commerce': 3_280_000,
  Aerospace: 4_560_000,
  Automotive: 3_850_000,
  Education: 2_730_000,
  Other: 4_880_000,
}

// ── Framework-specific compliance penalty baselines (USD/year) ───────────
// Keys MUST match the `label` column from compliance_*.csv exactly.
// Frameworks not listed here fall back to DEFAULT_FRAMEWORK_PENALTY.

/**
 * Category of "penalty" — drives interpretation downstream. Statutory fines are
 * recurring annual exposure; contract-loss and cert-loss figures are one-time
 * revenue impacts and should not be treated as annual. The ROI math currently
 * uses a uniform annual-probability model; tag each record so a future refinement
 * can treat them differently.
 */
export type PenaltyType =
  /** Statutory fine imposed by a regulator. */
  | 'fine'
  /** Lost federal / enterprise contracts due to non-compliance. */
  | 'contract-loss'
  /** Revoked certification (FIPS, CC, ISO, etc.) blocking procurement. */
  | 'certification-loss'

export interface FrameworkPenalty {
  annualPenalty: number
  source: string
  /** Optional — when present, the date the penalty figure was last verified (YYYY-MM). */
  asOf?: string
  /** Optional — defaults to 'fine' when omitted. */
  penaltyType?: PenaltyType
}

export const FRAMEWORK_PENALTY_BASELINES: Record<string, FrameworkPenalty> = {
  // EU regulatory
  GDPR: { annualPenalty: 20_000_000, source: 'Art. 83 GDPR: up to EUR 20M or 4% global turnover' },
  'DORA (EU Digital Operational Resilience)': {
    annualPenalty: 10_000_000,
    source: 'DORA Art. 50-51: significant fines for critical ICT failures',
  },
  'NIS2 Directive': {
    annualPenalty: 10_000_000,
    source: 'NIS2 Art. 34: up to EUR 10M or 2% global turnover',
  },
  'EU Cyber Resilience Act': {
    annualPenalty: 15_000_000,
    source: 'CRA Art. 64: up to EUR 15M or 2.5% global turnover',
  },
  'eIDAS 2.0': {
    annualPenalty: 5_000_000,
    source: 'EU digital identity trust framework penalties',
  },
  MiCA: { annualPenalty: 5_000_000, source: 'MiCA Art. 111: up to 12.5% annual turnover' },
  'EU Recommendation 2024/1101': {
    annualPenalty: 1_000_000,
    source: 'EU recommendation — no direct fine but procurement impact',
  },
  EUCC: { annualPenalty: 2_000_000, source: 'EU cybersecurity certification scheme' },

  // US regulatory
  HIPAA: { annualPenalty: 1_500_000, source: 'HIPAA: up to $1.5M per violation tier per year' },
  'HITECH Act': {
    annualPenalty: 1_900_000,
    source: 'HITECH increases to $1.9M per category per year',
  },
  'CNSA 2.0': {
    annualPenalty: 5_000_000,
    source: 'Loss of DoD/federal contracts; estimated procurement impact',
  },
  FedRAMP: { annualPenalty: 5_000_000, source: 'Loss of federal cloud contracts' },
  FISMA: { annualPenalty: 3_000_000, source: 'Federal agency budget/contract penalties' },
  'DISA STIGs': { annualPenalty: 3_000_000, source: 'DoD system authorization loss' },
  FERPA: { annualPenalty: 500_000, source: 'Loss of federal education funding' },
  COPPA: { annualPenalty: 500_000, source: 'FTC enforcement actions' },
  'CISA PQC Federal Buying Guidance': {
    annualPenalty: 3_000_000,
    source: 'Federal procurement eligibility impact',
  },
  'FDA 21 CFR Part 11': {
    annualPenalty: 1_000_000,
    source: 'FDA warning letters, product holds',
  },

  // Financial sector
  'PCI DSS': { annualPenalty: 500_000, source: 'PCI SSC: $5K-$100K/month, est. annual' },
  'SWIFT CSP': {
    annualPenalty: 2_000_000,
    source: 'SWIFT exclusion and remediation costs',
  },
  'SOC 2': { annualPenalty: 1_000_000, source: 'Loss of enterprise contracts requiring SOC 2' },
  'BOI Quantum Risk Directive': {
    annualPenalty: 1_500_000,
    source: 'Bank of Israel enforcement',
  },
  'MAS Circular': {
    annualPenalty: 2_000_000,
    source: 'Singapore financial regulatory enforcement',
  },
  'HKMA Fintech 2030 Quantum Preparedness': {
    annualPenalty: 1_500_000,
    source: 'Hong Kong monetary authority compliance',
  },
  'G7 Financial Sector PQC Roadmap': {
    annualPenalty: 2_000_000,
    source: 'G7 coordinated financial sector compliance',
  },

  // International standards & certifications
  'FIPS 140-3': {
    annualPenalty: 3_000_000,
    source: 'Module validation loss; federal procurement impact',
  },
  'Common Criteria': { annualPenalty: 2_000_000, source: 'Product certification loss' },
  'ISO 27001': { annualPenalty: 500_000, source: 'Certification loss, contract consequences' },

  // Energy & critical infrastructure
  'NERC CIP': { annualPenalty: 1_000_000, source: 'NERC: up to $1M per violation per day' },
  'TSA Pipeline Security Directive': {
    annualPenalty: 2_000_000,
    source: 'TSA enforcement actions',
  },
  'IEC 62443': {
    annualPenalty: 1_000_000,
    source: 'OT certification loss, industrial contract impact',
  },

  // Automotive & aerospace
  'ISO/SAE 21434': { annualPenalty: 2_000_000, source: 'Vehicle type approval loss' },
  'UN ECE WP.29 R155/R156': {
    annualPenalty: 3_000_000,
    source: 'Vehicle market access denial in 60+ countries',
  },
  'DO-326A / ED-202A': {
    annualPenalty: 5_000_000,
    source: 'Airworthiness certification impact',
  },
  'RTCA DO-355A': { annualPenalty: 3_000_000, source: 'Avionics security certification' },
  TISAX: { annualPenalty: 1_000_000, source: 'Automotive supply chain access loss' },

  // Telecom
  'GSMA NG.116 / FS.40': {
    annualPenalty: 2_000_000,
    source: 'Network equipment certification impact',
  },
  'ETSI TS 103 744': {
    annualPenalty: 1_000_000,
    source: 'Technical standard non-compliance',
  },

  // Country-specific guidance
  ANSSI: { annualPenalty: 1_000_000, source: 'French government procurement impact' },
  'BSI TR-02102': { annualPenalty: 1_000_000, source: 'German government IT compliance' },
  'UK NCSC PQC Guidance': {
    annualPenalty: 500_000,
    source: 'UK government procurement guidance',
  },
  'ASD ISM': {
    annualPenalty: 500_000,
    source: 'Australian government IT security compliance',
  },
  'INCD PQC Guidance': {
    annualPenalty: 1_000_000,
    source: 'Israeli government directive compliance',
  },
  'NATO STANAG 4774': {
    annualPenalty: 3_000_000,
    source: 'NATO alliance interoperability requirements',
  },
}

export const DEFAULT_FRAMEWORK_PENALTY = 500_000

// ── Per-layer infrastructure migration base costs (USD) ──────────────────
// Keys match INFRA_COMPLEXITY in assessmentData.ts

export const INFRA_LAYER_COST: Record<string, number> = {
  Hardware: 120_000, // HSM firmware, smart card reissuance, hardware refresh
  'Security Stack': 80_000, // PKI, KMS, IAM crypto rebuild
  OS: 60_000, // OS crypto library updates, testing across fleet
  Network: 50_000, // VPN/IPsec reconfiguration, network encryptor updates
  Application: 40_000, // TLS endpoints, SSH, app-level crypto
  Database: 35_000, // TDE/column encryption key rotation
  Cloud: 30_000, // Cloud KMS/HSM config — vendor-managed path
}

export const DEFAULT_INFRA_LAYER_COST = 40_000

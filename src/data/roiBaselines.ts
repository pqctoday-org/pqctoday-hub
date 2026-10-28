// SPDX-License-Identifier: AGPL-3.0-only
import type { Freshness } from './contentFreshness'
// Industry breach-cost baselines — NetDiligence Cyber Claims Study 2025, Table 5
// "Incident Cost by Sector—SMEs" (2020-2024), read from the report itself.
// Owner decision 2026-10-27: these replace the IBM Cost of a Data Breach
// per-sector table, whose current edition is registration-walled and so cannot
// be cited (no gated references).
//
// WHAT THE FIGURES MEASURE. NetDiligence asked claim participants for "the
// amount of money paid on a claim and ... an estimate of the total cost of the
// incident, including self-insured retention (SIR) and other costs that may
// have been excluded due to the terms of the policy." Table 5 is that incident
// cost, averaged per sector over SME claims (under $2B revenue). It only counts
// incidents that became insurance claims, and the report itself advises the
// reader "to consider the costs reported in this report as lower bounds". So
// it is NOT a total-cost-of-breach estimate for a large organisation, and the
// tools say so wherever the figure appears (BREACH_BASELINE_NOTE).
//
// The large-company table exists but is NOT used: several of its sectors rest
// on one or two claims (Hospitality N=1 -> $268M, Telecommunications N=1 ->
// $503.5M), which is an anecdote wearing an average's clothing.
export const INDUSTRY_BREACH_BASELINES_AS_OF = '2025-09'

/**
 * Freshness stamp for the NetDiligence per-sector baselines (aggregated in
 * contentFreshness). NetDiligence publishes the study yearly (the 2025 report
 * is dated September 2025); re-source the table from the next edition.
 */
export const NETDILIGENCE_CLAIM_COST_FRESHNESS: Freshness = {
  asOf: '2026-10-27',
  recheck: 'https://netdiligence.com/cyber-claims-study-2025-report/',
}

/**
 * Evidence status for the financial sources behind every dollar figure in the
 * business tools.
 * The GRI 2025 CRQC curve (hndlExposureCurve.json) IS properly proven — its
 * cached capture states "quite possible (28-49%) within the next 10 years, and
 * likely (51-70%) in the next 15" from 26 experts, exactly reproducing the
 * curve's 2035/2040 anchors.
 * The 2026-08-10 audit (W1-7) found the other sources at landing-page-only
 * evidence: a page ABOUT a report is not the report. Two were closed on
 * 2026-08-11 by retrieving the primary documents, and BOTH turned out to
 * contain a wrong figure — the landing pages had been hiding real errors, not
 * merely leaving them unproven:
 *  - Cyentia IRIS 2025 — PRIMARY RETRIEVED. 36-page report,
 *    https://www.cyentia.com/wp-content/uploads/2026/03/IRIS-2025.pdf (linked
 *    from cyentia.com/publication/iris2025/). Figures 6 and 7 carry the
 *    probabilities; see ANNUAL_BREACH_PROBABILITY_PCT below. Two of the three
 *    tier values were wrong.
 *  - NetDiligence Cyber Claims Study 2025 — PRIMARY RETRIEVED. 80-page report,
 *    https://netdiligence.com/wp-content/uploads/2025/09/NetDiligence-Cyber-Claims-Study-2025-Report-.pdf
 *    (the download form is HubSpot-gated; the asset itself is public — located
 *    via the Wayback CDX index and then fetched from the live origin). Figures
 *    9 and 10 carry the cost anchors (one of the two was wrong); Table 5 carries
 *    the per-sector baselines below (re-read 2026-10-27, every figure matches).
 *  - IBM Cost of a Data Breach — no longer used (2026-10-27): its per-sector
 *    figures are inside a registration-walled PDF with no public asset path.
 * Both PDFs are archived so every figure cited here is re-checkable without
 * re-fetching:
 *   pqctoday-priv/local-evidence-cache/library/Cyentia-IRIS-2025.pdf
 *     sha256 00706bbbfefcc7b6cc321dcbcc2347b3082af92572cbd55abd2239a901cf8f1c
 *   pqctoday-priv/local-evidence-cache/library/NetDiligence-Cyber-Claims-Study-2025.pdf
 *     sha256 4014f4e7a52c55125e3287b2c61ca788f9ae133a8e49408d7e34ec35ba7166cb
 */
export const FINANCIAL_BASELINE_EVIDENCE = {
  cyentiaBreachProbability: 'primary-verified',
  netDiligenceOrgSize: 'primary-verified',
  netDiligenceIndustryClaimCosts: 'primary-verified',
} as const

/**
 * User-facing statement of what the per-industry baseline is. Surfaced wherever
 * the baseline is presented as a source, including exports, since those are
 * what reach a CFO.
 */
export const BREACH_BASELINE_NOTE =
  'Insurance-claim incident cost (lower bound): the average incident cost on cyber-insurance ' +
  'claims from organisations under $2B revenue in that industry (NetDiligence Cyber Claims ' +
  'Study 2025, Table 5: 8,936 claims, 2020–2024). It covers what the insurer paid plus the ' +
  'policyholder’s retention and costs the policy excluded, but only for incidents that became ' +
  'claims, so NetDiligence advises reading it as a lower bound. A full-cost estimate for a ' +
  'large organisation would be higher.'

/** Short label for the per-industry baseline, used in tool labels and exports. */
export const BREACH_BASELINE_LABEL = 'Insurance-claim incident cost (lower bound)'

/** Short source line for the per-industry baseline, used in exports and tooltips. */
export const BREACH_BASELINE_SOURCE = 'NetDiligence Cyber Claims Study 2025, Table 5 (SMEs)'

/**
 * Per-industry baseline (SLE anchor) for every business tool. Figures are the
 * SME table (under $2B revenue, N=8,936 claims, 2020–2024), Table 5, page 54.
 *
 * Source, re-checkable without re-fetching:
 *   pqctoday-priv/local-evidence-cache/library/NetDiligence-Cyber-Claims-Study-2025.pdf
 *   sha256 4014f4e7a52c55125e3287b2c61ca788f9ae133a8e49408d7e34ec35ba7166cb
 */
export const INDUSTRY_CLAIM_COST_BASELINES: Record<string, number> = {
  'Finance & Banking': 329_000, // NetDiligence Financial Services (N=579)
  Healthcare: 566_000, // NetDiligence Healthcare (N=599)
  'Government & Defense': 180_000, // NetDiligence Public Entity (N=300)
  Technology: 876_000, // NetDiligence Technology (N=450)
  Telecommunications: 1_600_000, // NetDiligence Telecommunications (N=21 — thin)
  'Energy & Utilities': 431_000, // NetDiligence Energy (N=62)
  'Retail & E-Commerce': 219_000, // NetDiligence Retail (N=623)
  Aerospace: 395_000, // proxy — NetDiligence Manufacturing (N=773)
  Automotive: 395_000, // proxy — NetDiligence Manufacturing (N=773)
  Education: 172_000, // NetDiligence Education (N=277)
  Other: 62_000, // NetDiligence "Other" (N=2,828)
}

/** The baseline every tool reads (same table; kept under its long-standing name). */
export const INDUSTRY_BREACH_BASELINES: Record<string, number> = INDUSTRY_CLAIM_COST_BASELINES

/** Sectors above with no dedicated NetDiligence figure — surfaced in the UI as "proxy". */
export const INDUSTRY_BASELINE_IS_PROXY: Record<string, boolean> = {
  Aerospace: true,
  Automotive: true,
}

/**
 * Claim counts behind each figure above. A sector resting on a handful of
 * claims is not a baseline, and the UI should say so rather than render it at
 * the same weight as one built from hundreds.
 */
export const INDUSTRY_CLAIM_COST_SAMPLE_SIZE: Record<string, number> = {
  'Finance & Banking': 579,
  Healthcare: 599,
  'Government & Defense': 300,
  Technology: 450,
  Telecommunications: 21,
  'Energy & Utilities': 62,
  'Retail & E-Commerce': 623,
  Aerospace: 773,
  Automotive: 773,
  Education: 277,
  Other: 2828,
}

/** Below this, treat the sector figure as indicative only. */
export const CLAIM_COST_THIN_SAMPLE_THRESHOLD = 50

/** What the baseline column means, for wherever it is described. */
export const BREACH_COST_BASIS_NOTE = {
  netDiligence:
    'NetDiligence Cyber Claims Study - 2025 Report (Table 5, N=8,936): the average incident ' +
    'cost on cyber-insurance claims from SMEs over 2020–2024 — the amount paid on the claim ' +
    'plus the self-insured retention and costs the policy excluded. Only claimed incidents ' +
    'count, so the report treats these costs as lower bounds. Read from the report itself.',
} as const

// ── Organization-size anchors (NetDiligence Cyber Claims Study 2025) ──────
// 10,402 real cyber-insurance claims from incidents in 2020–2024. The study's
// own split: SME = under $2B annual revenue (N=8,936), large company = $2B or
// more (N=235). SMEs are 98% of claims by volume but large orgs dominate total
// cost through scale.
//
// NOT CURRENTLY WIRED TO ANY TOOL. The previous comment said these were "used
// to scale the industry-average baseline for organizations far from that
// average"; nothing imports this constant. Left in place with the corrected
// figures rather than deleted, but do not read the presence of an anchor as
// evidence that a tool applies it.
//
// Read from the report itself on 2026-08-11 (see FINANCIAL_BASELINE_EVIDENCE):
// Figure 9 (SMEs) and Figure 10 (large companies), "5-Year Average Incident
// Cost" series. The report states both in prose as well: SME average total
// incident cost "rose from $205 to $264K"; at large companies it "was $10.3M".
export const ORG_SIZE_BREACH_COST_ANCHORS = {
  // WAS 246_000. That number IS in the report — but it is the 2020 value of a
  // DIFFERENT series: Figure 11, average incident cost for the SME subset
  // WHERE CRISIS-SERVICES COSTS ARE ABOVE ZERO (N=4,712, five-year average
  // $325K). Conditioning on "a crisis-services bill exists" is not the
  // all-claims population this constant is used as. The right figure for an
  // unconditional SME anchor is Figure 9's five-year average.
  sme: 264_000, // <$2B revenue — NetDiligence 2025 Fig. 9, 5-yr avg incident cost
  large: 10_300_000, // >=$2B revenue — NetDiligence 2025 Fig. 10, 5-yr avg incident cost
}

// ── Annual breach-probability defaults, by org-size tier ──────────────────
// Source: Cyentia Institute, Information Risk Insights Study (IRIS) 2025.
// Read from the report PDF on 2026-08-11 (see FINANCIAL_BASELINE_EVIDENCE);
// replaces a single unsourced flat default (previously 15% for all sizes).
//
// Figure 6 gives the headline curve for a "typical" firm: 2.5% in 2008 -> 6.1%
// -> 9.3% in 2024. Figure 7 splits that by revenue tier (rolling 12-month,
// read off the 2024 endpoint): under $10M 8.7%, $100M-$1B 9.0%, $10B-$100B
// 12.8%, over $100B 19.4%. The $10M-$100M and $1B-$10B series overlap at the
// 2024 endpoint at roughly 9.8% and cannot be separated cleanly, so neither is
// used as an anchor here.
//
// Figure 7's axis is a SQUARE-ROOT scale, not linear and not logarithmic —
// misreading it as linear inflates every value. The calibration used here was
// fitted on the 70% and 5% gridlines and then checked against the other three:
// it reproduces the 50% line exactly and 30% within 5px, and reads the 2008
// start of the ">$100B" series as 69.0% where the chart labels 70%.
//
// The report is a raster-figure document: none of these values appear in the
// extracted text layer. They were read from a 400dpi render of page 12.
export type OrgSizeTier = 'smb' | 'average' | 'fortune1000'
export const ANNUAL_BREACH_PROBABILITY_PCT: Record<OrgSizeTier, number> = {
  // WAS 2. IRIS 2025 Fig. 7 puts the under-$10M tier at 8.7% in 2024 — the ~2%
  // reading is where that series STARTS, in 2008. The report's own key finding
  // is that small-firm probability "has more than doubled" while the largest
  // firms' has fallen, so the SMB discount this constant encoded has closed.
  smb: 8.7, // IRIS 2025 Fig. 7, 2024: firms under $10M revenue
  average: 9.3, // IRIS 2025 Fig. 6, 2024: "typical" firm
  // WAS 25. "About 1 in 4" was IRIS 2022's finding for the largest firms, and
  // IRIS 2025 exists precisely to show that it moved: the >$100B series falls
  // from ~69% (2008) to 19.4% (2024).
  //
  // JUDGEMENT CALL, so that it can be argued with. Fortune 1000 membership
  // starts near $3B of revenue, so the list straddles three of Fig. 7's tiers
  // and reads 9.8% ($1B-$10B, where most members sit) to 19.4% (>$100B). The
  // $10B-$100B endpoint is taken as the anchor: the $1B-$10B series coincides
  // with $10M-$100M at the 2024 endpoint and cannot be read off cleanly, and
  // anchoring a tier explicitly labelled "Fortune-1000-class" at the bottom of
  // its own range would understate it.
  fortune1000: 12.8, // IRIS 2025 Fig. 7, 2024: firms $10B-$100B revenue
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
    source:
      'Cyber Resilience Act, Regulation (EU) 2024/2847, Art. 64: up to EUR 15M or 2.5% of global turnover',
  },
  'eIDAS 2.0': {
    annualPenalty: 5_000_000,
    source: 'EU digital identity trust framework penalties',
  },
  MiCA: { annualPenalty: 5_000_000, source: 'MiCA Art. 111: up to 12.5% annual turnover' },
  'EU Recommendation 2024/1101': {
    annualPenalty: 1_000_000,
    source: 'EU recommendation — no direct fine but procurement impact',
    penaltyType: 'contract-loss',
  },
  EUCC: {
    annualPenalty: 2_000_000,
    source: 'EU cybersecurity certification scheme',
    penaltyType: 'certification-loss',
  },

  // US regulatory
  HIPAA: { annualPenalty: 1_500_000, source: 'HIPAA: up to $1.5M per violation tier per year' },
  'HITECH Act': {
    annualPenalty: 1_900_000,
    source:
      'HITECH tier caps, inflation-adjusted under 45 CFR 102.3: up to $2,134,831 per category per year',
  },
  'CNSA 2.0': {
    annualPenalty: 5_000_000,
    source: 'Loss of DoD/federal contracts; estimated procurement impact',
    penaltyType: 'contract-loss',
  },
  FedRAMP: {
    annualPenalty: 5_000_000,
    source: 'Loss of federal cloud contracts',
    penaltyType: 'contract-loss',
  },
  FISMA: { annualPenalty: 3_000_000, source: 'Federal agency budget/contract penalties' },
  'DISA STIGs': {
    annualPenalty: 3_000_000,
    source: 'DoD system authorization loss',
    penaltyType: 'contract-loss',
  },
  FERPA: { annualPenalty: 500_000, source: 'Loss of federal education funding' },
  COPPA: { annualPenalty: 500_000, source: 'FTC enforcement actions' },
  'CISA PQC Federal Buying Guidance': {
    annualPenalty: 3_000_000,
    source: 'Federal procurement eligibility impact',
    penaltyType: 'contract-loss',
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
  'SOC 2': {
    annualPenalty: 1_000_000,
    source: 'Loss of enterprise contracts requiring SOC 2',
    penaltyType: 'contract-loss',
  },
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
    penaltyType: 'certification-loss',
  },
  'Common Criteria': {
    annualPenalty: 2_000_000,
    source: 'Product certification loss',
    penaltyType: 'certification-loss',
  },
  'ISO 27001': {
    annualPenalty: 500_000,
    source: 'Certification loss, contract consequences',
    penaltyType: 'certification-loss',
  },

  // Energy & critical infrastructure
  'NERC CIP': { annualPenalty: 1_000_000, source: 'NERC: up to $1M per violation per day' },
  'TSA Pipeline Security Directive': {
    annualPenalty: 2_000_000,
    source: 'TSA enforcement actions',
  },
  'IEC 62443': {
    annualPenalty: 1_000_000,
    source: 'OT certification loss, industrial contract impact',
    penaltyType: 'certification-loss',
  },

  // Automotive & aerospace
  'ISO/SAE 21434': { annualPenalty: 2_000_000, source: 'Vehicle type approval loss' },
  'UN ECE WP.29 R155/R156': {
    annualPenalty: 3_000_000,
    source: 'Vehicle market access denial in 60+ countries',
    penaltyType: 'contract-loss',
  },
  'DO-326A / ED-202A': {
    annualPenalty: 5_000_000,
    source: 'Airworthiness certification impact',
    penaltyType: 'certification-loss',
  },
  'RTCA DO-355A': {
    annualPenalty: 3_000_000,
    source: 'Avionics security certification',
    penaltyType: 'certification-loss',
  },
  TISAX: {
    annualPenalty: 1_000_000,
    source: 'Automotive supply chain access loss',
    penaltyType: 'contract-loss',
  },

  // Telecom
  'GSMA NG.116 / FS.40': {
    annualPenalty: 2_000_000,
    source: 'Network equipment certification impact',
    penaltyType: 'certification-loss',
  },
  'ETSI TS 103 744': {
    annualPenalty: 1_000_000,
    source: 'Technical standard non-compliance',
  },

  // Country-specific guidance
  ANSSI: {
    annualPenalty: 1_000_000,
    source: 'French government procurement impact',
    penaltyType: 'contract-loss',
  },
  'BSI TR-02102': { annualPenalty: 1_000_000, source: 'German government IT compliance' },
  'UK NCSC PQC Guidance': {
    annualPenalty: 500_000,
    source: 'UK government procurement guidance',
    penaltyType: 'contract-loss',
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

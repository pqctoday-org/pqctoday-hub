// SPDX-License-Identifier: GPL-3.0-only
/**
 * Reference data for the PQC GRC module.
 *
 * Source: Marin Ivezic / Applied Quantum, "The Applied Quantum PQC Migration
 * Framework" (CC BY 4.0), GRC Implementation section (pp. 176-185). The KRI
 * thresholds, risk-appetite tolerances, and regulatory-classification scheme
 * below are the framework's *illustrative* values; the educational point is the
 * cascade structure and the trigger-on-threshold discipline, not the exact
 * numbers, which every organization must calibrate to its own sector, data
 * profile, and risk culture.
 */

export type KriLevel = 'board' | 'ciso' | 'operational'

export type KriStatus = 'green' | 'amber' | 'red'

export interface Kri {
  id: string
  /** KRI name as it appears on a dashboard. */
  name: string
  /** Which level of the three-level cascade this KRI lives at. */
  level: KriLevel
  /** Reporting cadence for this level/KRI. */
  cadence: string
  /** The director / executive / operator question the KRI answers. */
  answers: string
  /** Illustrative threshold and the action it triggers. */
  threshold: string
  /** Who consumes / acts on the KRI at this level. */
  audience: string
}

export const KRI_LEVELS: Record<
  KriLevel,
  { label: string; audience: string; cadence: string; question: string }
> = {
  board: {
    label: 'Board-Level KRIs',
    audience: 'Board of Directors / Risk Committee',
    cadence: 'Quarterly',
    question: 'Are we on track, compliant, exposed — and what has changed?',
  },
  ciso: {
    label: 'CISO-Level KRIs',
    audience: 'CISO / Steering Committee',
    cadence: 'Monthly',
    question: 'Is the program executing, or has it hit a blocker?',
  },
  operational: {
    label: 'Operational KRIs',
    audience: 'Program / SOC / Engineering',
    cadence: 'Weekly / Real-time',
    question: 'What is happening right now that could compound?',
  },
}

/** The three-level KRI cascade (Applied Quantum framework, pp. 178-180). */
export const KRIS: Kri[] = [
  // ── Board-level (quarterly) ────────────────────────────────────────────────
  {
    id: 'migration-completion-rate',
    name: 'Migration Completion Rate',
    level: 'board',
    cadence: 'Quarterly',
    answers: 'Are we on track?',
    threshold:
      'Variance > 5 percentage points from plan triggers SteerCo review and board notification.',
    audience: 'Board of Directors',
  },
  {
    id: 'hndl-residual-exposure',
    name: 'HNDL Residual Exposure',
    level: 'board',
    cadence: 'Quarterly',
    answers: 'How much sensitive data is harvestable now?',
    threshold: 'Any quarter where this fails to decrease triggers a risk-committee escalation.',
    audience: 'Risk Committee',
  },
  {
    id: 'regulatory-compliance-buffer',
    name: 'Regulatory Compliance Buffer',
    level: 'board',
    cadence: 'Quarterly',
    answers: 'Do we have margin against the deadlines?',
    threshold: 'Buffer < 12 months: amber. Buffer < 6 months: red — board intervention.',
    audience: 'Board of Directors',
  },
  {
    id: 'third-party-quantum-readiness',
    name: 'Third-Party Quantum Readiness',
    level: 'board',
    cadence: 'Quarterly',
    answers: 'Are our vendors keeping up?',
    threshold: 'Any Tier 1 vendor below "planning" triggers formal engagement.',
    audience: 'Risk Committee',
  },
  {
    id: 'material-developments-flag',
    name: 'Material Developments Flag',
    level: 'board',
    cadence: 'Quarterly',
    answers: 'Has the risk picture changed?',
    threshold: 'Qualitative — produced by the CTI function, packaged by GRC for the board.',
    audience: 'Board of Directors',
  },

  // ── CISO-level (monthly) ───────────────────────────────────────────────────
  {
    id: 'inventory-completeness',
    name: 'Inventory Completeness',
    level: 'ciso',
    cadence: 'Monthly',
    answers: 'Is our migration plan based on a complete map?',
    threshold: 'Below 80%: the migration plan is unreliable; priority shifts back to inventorying.',
    audience: 'CISO',
  },
  {
    id: 'migration-velocity',
    name: 'Migration Velocity',
    level: 'ciso',
    cadence: 'Monthly',
    answers: 'Have we hit a blocker?',
    threshold: 'Velocity < 70% of plan for two consecutive months triggers a program review.',
    audience: 'Steering Committee',
  },
  {
    id: 'crypto-agility-adoption',
    name: 'Crypto-Agility Adoption',
    level: 'ciso',
    cadence: 'Monthly',
    answers: 'Are we creating new technical debt?',
    threshold: 'Any month below 95% triggers an architecture-governance review.',
    audience: 'CISO',
  },
  {
    id: 'regulatory-horizon-tracker',
    name: 'Regulatory Horizon Tracker',
    level: 'ciso',
    cadence: 'Monthly',
    answers: 'What is coming?',
    threshold: 'Count of pending requirements with a compliance status tracked for each.',
    audience: 'Steering Committee',
  },
  {
    id: 'vendor-readiness-scores',
    name: 'Vendor Readiness Scores',
    level: 'ciso',
    cadence: 'Monthly',
    answers: 'Are vendors regressing?',
    threshold: 'Any Tier 1 vendor dropping a level triggers an engagement review.',
    audience: 'CISO',
  },
  {
    id: 'budget-consumption-vs-plan',
    name: 'Budget Consumption vs. Plan',
    level: 'ciso',
    cadence: 'Monthly',
    answers: 'Is the program executing or stalling?',
    threshold: 'Underspend > 15% triggers a review (usually signals blocked workstreams).',
    audience: 'Steering Committee',
  },

  // ── Operational (weekly / real-time) ──────────────────────────────────────
  {
    id: 'weekly-migration-throughput',
    name: 'Weekly Migration Throughput',
    level: 'operational',
    cadence: 'Weekly',
    answers: 'Where are the bottlenecks before they compound?',
    threshold: 'Instances migrated in the past 7 days, broken down by system tier.',
    audience: 'Program Team',
  },
  {
    id: 'cryptographic-drift-count',
    name: 'Cryptographic Drift Count',
    level: 'operational',
    cadence: 'Real-time',
    answers: 'Are migrated systems reverting?',
    threshold: 'Any non-zero value investigated; persistent drift indicates a systemic issue.',
    audience: 'SOC',
  },
  {
    id: 'hybrid-downgrade-alerts',
    name: 'Hybrid Downgrade Alerts',
    level: 'operational',
    cadence: 'Real-time',
    answers: 'Are we seeing active attacks or misconfiguration?',
    threshold: 'Broken down by confirmed attacks, misconfigs, and false positives.',
    audience: 'SOC',
  },
  {
    id: 'certificate-transition-progress',
    name: 'Certificate Transition Progress',
    level: 'operational',
    cadence: 'Weekly',
    answers: 'How is the PKI migration tracking?',
    threshold: '% of certificates reissued with PQC signature algorithms.',
    audience: 'PKI / Engineering',
  },
  {
    id: 'open-exceptions-deferrals',
    name: 'Open Exceptions / Deferrals',
    level: 'operational',
    cadence: 'Weekly',
    answers: 'Is governance drifting?',
    threshold: 'Any exception > 6 months without a remediation plan triggers escalation.',
    audience: 'GRC',
  },
  {
    id: 'ttr-pqc',
    name: 'TTR-PQC',
    level: 'operational',
    cadence: 'Real-time',
    answers: 'How fast do we remediate?',
    threshold: 'Time from PQC-vulnerability disclosure to confirmed remediation.',
    audience: 'SOC',
  },
]

// ─── Risk-appetite tolerances (pp. 177) ──────────────────────────────────────

export interface RiskTolerance {
  id: string
  dimension: string
  /** The illustrative operational threshold in program language. */
  statement: string
  /** Near-term target the framework gives, if any. */
  target?: string
}

export const STRATEGIC_APPETITE =
  'The organization will complete migration of all systems protecting data with ' +
  'confidentiality requirements exceeding 10 years before the earliest credible ' +
  'CRQC estimates, and will achieve compliance with all applicable PQC regulatory ' +
  'deadlines with a minimum 12-month buffer.'

export const RISK_TOLERANCES: RiskTolerance[] = [
  {
    id: 'hndl',
    dimension: 'HNDL exposure tolerance',
    statement:
      'No more than 20% of data classified as having secrecy requirements exceeding ' +
      '10 years will remain protected by quantum-vulnerable algorithms by end of 2027.',
    target: 'Target 0% by end of 2029.',
  },
  {
    id: 'tnfl',
    dimension: 'TNFL exposure tolerance',
    statement:
      'All production software and firmware signing will use NIST-approved ' +
      'quantum-resistant signatures (SP 800-208 hash-based or ML-DSA, dual-signed ' +
      'with classical) by end of 2027.',
    target:
      'All CA signing keys PQC-capable, with hybrid or PQC issuance available, by end of 2029.',
  },
  {
    id: 'regulatory',
    dimension: 'Regulatory compliance tolerance',
    statement:
      'The organization will achieve compliance with all PQC-related regulatory ' +
      'requirements at least 12 months before the applicable deadline.',
    target: 'Zero tolerance for deadline non-compliance.',
  },
  {
    id: 'crypto-agility',
    dimension: 'Crypto-agility tolerance',
    statement:
      'All newly deployed systems from Q3 2026 onward must implement crypto-agile ' +
      'architecture as a mandatory design requirement.',
    target: 'No exceptions without Steering Committee approval and a remediation plan.',
  },
]

// ─── Regulatory Horizon Report (pp. 180) ─────────────────────────────────────

export type RegStatus = 'confirmed' | 'proposed' | 'signaled'

export interface RegClassification {
  status: RegStatus
  label: string
  definition: string
  escalation: string
}

export const REG_CLASSIFICATIONS: RegClassification[] = [
  {
    status: 'confirmed',
    label: 'Confirmed',
    definition: 'Enacted; a final rule is in force.',
    escalation:
      'A new confirmed requirement affecting the migration timeline triggers an ' +
      'immediate Steering Committee assessment, outside the quarterly cycle.',
  },
  {
    status: 'proposed',
    label: 'Proposed',
    definition: 'In the legislative or regulatory process.',
    escalation: 'Triggers an impact assessment within 30 days.',
  },
  {
    status: 'signaled',
    label: 'Signaled',
    definition: 'Guidance, recommendations, or speeches by senior officials indicating direction.',
    escalation: 'Triggers a monitoring entry for the next quarterly review.',
  },
]

export const REG_SOURCES: string[] = [
  'NIST PQC publications and the NCCoE migration project',
  'NSA CNSA 2.0 updates',
  'EU NIS Cooperation Group outputs and the coordinated PQC implementation roadmap',
  'CISA advisories and product-category updates',
  'Sector regulators (BIS/BCBS banking, EMA pharma, NERC energy)',
  'Standards bodies (ETSI, ISO, IETF)',
  'National cybersecurity agencies in jurisdictions of operation',
]

// ─── GRC → SOC handoff (pp. 184) ─────────────────────────────────────────────

export interface GrcSocOutput {
  id: string
  output: string
  /** What the SOC does with it. */
  socUse: string
}

export const GRC_SOC_OUTPUTS: GrcSocOutput[] = [
  {
    id: 'risk-appetite',
    output: 'Risk appetite statement',
    socUse:
      'Defines escalation thresholds. A hybrid downgrade is Medium or High depending ' +
      'on whether the data traversing that connection has HNDL-relevant secrecy needs.',
  },
  {
    id: 'compliance-tracker',
    output: 'Regulatory compliance tracker',
    socUse:
      'Tells the SOC which systems are highest priority. Systems approaching a ' +
      'compliance deadline receive more intensive monitoring.',
  },
  {
    id: 'vendor-assessments',
    output: 'Vendor readiness assessments',
    socUse:
      'Inform monitoring of third-party connections. A vendor with no PQC timeline ' +
      'warrants different treatment.',
  },
  {
    id: 'exception-register',
    output: 'Exception and deferral register',
    socUse:
      'Ingested as a dynamic suppression list. Without it, drift-detection rules ' +
      'alarm constantly on legitimately deferred legacy systems, drowning out real regressions.',
  },
]

// ─── Vendor tiering (pp. 181) ────────────────────────────────────────────────

export interface VendorTier {
  tier: number
  name: string
  description: string
  examples: string
  treatment: string
}

export const VENDOR_TIERS: VendorTier[] = [
  {
    tier: 1,
    name: 'Migration-constraining',
    description: 'PQC readiness directly constrains the migration timeline.',
    examples: 'HSM vendors, certificate authorities, cloud platforms, payment processors, MSSPs.',
    treatment:
      'Detailed assessment + active engagement. Require a CycloneDX 1.6+ CBOM and a product-security review.',
  },
  {
    tier: 2,
    name: 'Cryptographic dependency',
    description: 'Cryptographic operations, but no direct timing constraint.',
    examples:
      'SaaS handling sensitive data, API partners, analytics platforms with encryption at rest.',
    treatment: 'Standard third-party assessment.',
  },
  {
    tier: 3,
    name: 'No cryptographic dependency',
    description: 'No cryptographic touchpoint.',
    examples: 'Vendors with no encryption, signing, or key-handling role.',
    treatment: 'No PQC assessment required.',
  },
]

// ─── Audit & assurance (pp. 182-183) ─────────────────────────────────────────

export const AUDIT_TARGETS: string[] = [
  'The cryptographic inventory — is it complete and current?',
  'The migration program plan — is it realistic, resourced, and governed?',
  'Migration execution — are systems actually migrated, or only marked migrated?',
  'The risk appetite statement — board-approved, and consistent with decisions?',
  'The KRI framework — measured, reported, and acted on?',
  'Regulatory compliance — tracking the right requirements?',
  'Vendor quantum-readiness assessments — conducted and findings acted on?',
]

export interface AuditMilestone {
  when: string
  focus: string
}

export const AUDIT_TIMELINE: AuditMilestone[] = [
  { when: 'First 6 months', focus: 'Governance and inventory validation.' },
  { when: '18-24 months', focus: 'Execution against plan.' },
  { when: 'Annual thereafter', focus: 'Until migration is substantially complete.' },
]

// ─── Crisis-comms templates (pp. 183-184) ────────────────────────────────────

export interface CrisisCommsTemplate {
  id: string
  audience: string
  purpose: string
}

export const CRISIS_COMMS_TEMPLATES: CrisisCommsTemplate[] = [
  {
    id: 'customer',
    audience: 'Customer notification',
    purpose: 'What is known, what was already migrated, what changes for them.',
  },
  {
    id: 'regulator',
    audience: 'Regulator disclosure',
    purpose:
      'Mapped to each jurisdiction’s incident-reporting deadlines from the regulatory-intelligence function.',
  },
  {
    id: 'counterparty',
    audience: 'Counterparty / partner notices',
    purpose: 'For shared connections; supplies migration status of the link.',
  },
  {
    id: 'market',
    audience: 'Market / investor statement',
    purpose: 'For listed entities; the evidence dossier supplies the numbers.',
  },
]

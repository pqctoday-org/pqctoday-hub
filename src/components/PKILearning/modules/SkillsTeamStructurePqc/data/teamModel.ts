// SPDX-License-Identifier: GPL-3.0-only
/**
 * View-model data for the Skills & Team Structure module.
 *
 * The FTE-counted role spine is *reused* from the hub's single source of truth
 * `@/data/roleCrosswalk.ts` (ROLE_CROSSWALK, FTE_PER_CRYPTO_INSTANCES). This
 * file only layers the Applied Quantum framework's per-role "Skills Required"
 * and "Source" columns (pp. 160–161) on top of that spine, keyed by the same
 * FrameworkRoleId, plus the build/borrow/buy, training-levels, and skills-matrix
 * tables from pp. 162–164. It deliberately does not re-state FTE numbers — those
 * are read from ROLE_CROSSWALK.typicalFte so the two files can never disagree.
 */
import {
  ROLE_CROSSWALK,
  FTE_PER_CRYPTO_INSTANCES,
  type FrameworkRoleId,
  type RoleMapping,
} from '@/data/roleCrosswalk'

export { ROLE_CROSSWALK, FTE_PER_CRYPTO_INSTANCES }
export type { FrameworkRoleId, RoleMapping }

/** The seven core roles in the order the framework table lists them (p. 160–161). */
export const CORE_ROLE_ORDER: FrameworkRoleId[] = [
  'qrpm',
  'crypto-architect',
  'security-eng',
  'appsec-lead',
  'ot-specialist',
  'vendor-lead',
  'pmo-analyst',
]

/**
 * Per-role "Skills Required" and recommended "Source" — the two framework table
 * columns the role spine does not carry. Keyed by FrameworkRoleId so each entry
 * pairs 1:1 with a ROLE_CROSSWALK role. `dedicatedOverhead` marks the three
 * roles the framework calls dedicated overhead regardless of estate size.
 */
export interface RoleDetail {
  /** Bulleted skills required (framework "Skills Required" column). */
  skills: string[]
  /** Recommended staffing source (framework "Source" column). */
  source: string
  /** True for QRPM, Cryptographic Architect, PMO Analyst (sizing-independent). */
  dedicatedOverhead: boolean
}

export const ROLE_DETAIL: Record<FrameworkRoleId, RoleDetail> = {
  qrpm: {
    skills: [
      'Program management',
      'Stakeholder management',
      'Risk governance',
      'Basic crypto literacy',
      'Board-level communication',
    ],
    source: 'Internal senior PM with PQC training',
    dedicatedOverhead: true,
  },
  'crypto-architect': {
    skills: [
      'Deep cryptography expertise',
      'PKI architecture',
      'Protocol design',
      'PQC algorithm knowledge',
      'Crypto-agility design patterns',
    ],
    source: 'Internal security architect + specialized training; rare external hire',
    dedicatedOverhead: true,
  },
  'security-eng': {
    skills: [
      'TLS/SSH/IPsec configuration',
      'HSM management',
      'Certificate lifecycle',
      'Library evaluation',
      'Hybrid deployment',
    ],
    source: 'Internal security engineers with PQC training',
    dedicatedOverhead: false,
  },
  'appsec-lead': {
    skills: [
      'Code review',
      'SAST/DAST tooling',
      'Library management',
      'CI/CD pipeline integration',
      'Crypto-agility patterns',
    ],
    source: 'Internal AppSec team with crypto-agility focus',
    dedicatedOverhead: false,
  },
  'ot-specialist': {
    skills: [
      'ICS/SCADA knowledge',
      'OT network architecture',
      'Safety case management',
      'Vendor coordination',
    ],
    source: 'Specialized hire or external partner; very scarce',
    dedicatedOverhead: false,
  },
  'vendor-lead': {
    skills: [
      'Contract negotiation',
      'RFP management',
      'Vendor relationship management',
      'SLA design',
    ],
    source: 'Internal procurement with PQC requirements training',
    dedicatedOverhead: false,
  },
  'pmo-analyst': {
    skills: ['KPI tracking', 'Reporting', 'Evidence dossier management', 'SteerCo coordination'],
    source: 'Internal PMO or shared resource',
    dedicatedOverhead: true,
  },
  'exec-sponsor': {
    skills: [
      'Executive leadership',
      'Budget authority',
      'Board-level communication',
      'Cross-BU mandate',
      'Risk-appetite ownership',
    ],
    source: 'Existing C-suite sponsor (CISO/CIO/CTO); not a dedicated hire',
    dedicatedOverhead: false,
  },
}

/**
 * Sizing ratios (p. 161). The first-two-years ratio is the canonical
 * FTE_PER_CRYPTO_INSTANCES reused from roleCrosswalk; the production-rollout
 * ratio is the framework's "drops to one per 1,000" maturity figure.
 */
export const SIZING = {
  /** Discovery / CBOM / risk-scoring / pilot phases — first two years. */
  firstTwoYearsRatio: FTE_PER_CRYPTO_INSTANCES, // 1 FTE per 500 instances
  /** Production rollout, once tooling automates repetitive tasks. */
  productionRolloutRatio: 1000, // 1 FTE per 1,000 instances
  /** Below this estate size, a part-time QRPM + consulting is viable. */
  partTimeBelow: 1000,
  /** Above this estate size, plan a dedicated program office. */
  programOfficeAbove: 10000,
  /** Dedicated program-office band at peak for very large estates. */
  programOfficeFteLow: 8,
  programOfficeFteHigh: 12,
} as const

/** Build / Borrow / Buy guidance per capability (p. 162–163). */
export interface BuildBorrowBuyRow {
  capability: string
  /** Primary recommended model. */
  model: 'Build' | 'Borrow' | 'Buy'
  /** Short recommendation label as printed in the framework table. */
  recommendation: string
  rationale: string
}

export const BUILD_BORROW_BUY: BuildBorrowBuyRow[] = [
  {
    capability: 'Program management',
    model: 'Build',
    recommendation: 'Build. Internal QRPM.',
    rationale:
      'Institutional knowledge and continuity matter for multi-year programs. Acceptable to borrow for the first 6 months while identifying an internal QRPM.',
  },
  {
    capability: 'Cryptographic architecture',
    model: 'Build',
    recommendation: 'Build if possible; borrow for design.',
    rationale:
      'This capability has lasting value beyond PQC. Use consultants to design the architecture; train internal staff to maintain it.',
  },
  {
    capability: 'Discovery and inventory',
    model: 'Buy',
    recommendation: 'Buy the tool; run it internally.',
    rationale:
      'Internal staff understand the estate better than any external team. Acceptable to borrow for initial deployment and configuration.',
  },
  {
    capability: 'PKI modernization',
    model: 'Build',
    recommendation: 'Build, augmented as needed.',
    rationale:
      'PKI errors cause outages. Production CA operations require people who understand the production environment. Borrow for architecture design and migration planning.',
  },
  {
    capability: 'Vendor governance',
    model: 'Build',
    recommendation: 'Build. Internal procurement.',
    rationale:
      'Vendor relationships are organizational assets. Acceptable to borrow for developing questionnaire frameworks and assessment criteria.',
  },
  {
    capability: 'Strategic quantum CTI',
    model: 'Borrow',
    recommendation: 'Borrow for most organizations.',
    rationale:
      'The skill set (interpreting resource-estimation papers, tracking national quantum programs) is specialized and scarce. Contract quarterly strategic assessments from a qualified provider.',
  },
]

/** The four training levels (p. 163–164). */
export interface TrainingLevel {
  level: number
  name: string
  duration: string
  audience: string
  content: string
  outcome: string
}

export const TRAINING_LEVELS: TrainingLevel[] = [
  {
    level: 1,
    name: 'Executive education',
    duration: 'Half-day to one day',
    audience: 'SteerCo members, board risk committee, senior leadership',
    content:
      'Quantum threat in business terms, regulatory deadlines, program governance responsibilities, KPI interpretation.',
    outcome: 'Informed sponsors who can approve risk-appetite statements and budget commitments.',
  },
  {
    level: 2,
    name: 'PQC foundations',
    duration: '3–5 days',
    audience:
      'All workstream participants, security engineers, architects, application developers with cryptographic touchpoints',
    content:
      'Algorithm overview (ML-KEM, ML-DSA, SLH-DSA, FN-DSA), hybrid deployment mechanics, CBOM concepts, risk-assessment methodology, crypto-agility design patterns.',
    outcome: 'A team that can execute Phase 1–3 activities without constant expert supervision.',
  },
  {
    level: 3,
    name: 'Deep technical',
    duration: 'Ongoing, lab-based',
    audience: 'Security engineers and architects who configure, test, and deploy PQC',
    content:
      'Hands-on hybrid TLS deployment, HSM PQC configuration, CBOM generation with CycloneDX, certificate-lifecycle automation, performance-testing methodology.',
    outcome: 'Practitioners who can run pilots and production deployments.',
  },
  {
    level: 4,
    name: 'Crypto Champion Program',
    duration: 'Standing / quarterly briefings',
    audience: 'One designated champion per platform or application team',
    content:
      'PQC foundations training plus quarterly crypto-agility briefings; champions liaise between the PQC program and their platform team.',
    outcome:
      'Champions sign off on crypto readiness in design reviews and shepherd PQC library upgrades — scaling program reach without making every developer a cryptographer.',
  },
]

/** Default platform/application teams that each get a crypto champion (p. 164). */
export const CHAMPION_PLATFORMS = [
  'Web',
  'Mobile',
  'Data',
  'Infrastructure',
  'OT',
  'Identity',
] as const

export type ChampionPlatform = (typeof CHAMPION_PLATFORMS)[number]

/** Skills-matrix domains (p. 162): a domain with no name against it is a risk. */
export interface SkillDomain {
  domain: string
  primaryRoles: string
  proficiencyTarget: string
}

export const SKILL_DOMAINS: SkillDomain[] = [
  {
    domain: 'Program governance and strategy',
    primaryRoles: 'QRPM, executive sponsor, SteerCo members',
    proficiencyTarget:
      'Can defend the roadmap, budget, and risk acceptances to the board and regulators.',
  },
  {
    domain: 'Cryptographic discovery and CBOM',
    primaryRoles: 'Security architects, Inventory & Discovery workstream lead',
    proficiencyTarget:
      'Can operate multi-layer discovery tooling and maintain a queryable CycloneDX CBOM.',
  },
  {
    domain: 'PKI, KMS, and HSM engineering',
    primaryRoles: 'PKI engineers, infrastructure security',
    proficiencyTarget:
      'Can execute dual-stack CA operation, HSM PQC migration, and key ceremonies.',
  },
  {
    domain: 'Protocol and application engineering',
    primaryRoles: 'Application security leads, platform engineers',
    proficiencyTarget:
      'Can implement and debug hybrid TLS/IPsec/SSH and cryptographic library migrations.',
  },
  {
    domain: 'Assurance, testing, and performance',
    primaryRoles: 'Security testing and performance engineers',
    proficiencyTarget:
      'Can design negative tests, interoperability matrices, and PQC performance baselines.',
  },
  {
    domain: 'OT and embedded',
    primaryRoles: 'OT security, embedded engineers',
    proficiencyTarget:
      'Can apply gateway and compensating-control patterns within safety constraints.',
  },
]

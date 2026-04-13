// SPDX-License-Identifier: GPL-3.0-only
/**
 * Static reference data for the Migration Program Management workshop steps.
 * Covers migration phases, KPI dimensions, stakeholder roles, and playbook checklists.
 */

// ─── Migration Phases ───────────────────────────────────────────────────────

export interface MigrationPhase {
  id: string
  name: string
  nistPhase: string
  defaultDurationMonths: number
  description: string
  gateExitCriteria: string[]
}

export const MIGRATION_PHASES: MigrationPhase[] = [
  {
    id: 'discovery',
    name: 'Discovery',
    nistPhase: 'Phase 1',
    defaultDurationMonths: 3,
    description:
      'Identify all systems, services, and data flows that rely on classical public-key cryptography.',
    gateExitCriteria: [
      'Cryptographic inventory baseline documented',
      'All system owners identified',
      'Data sensitivity classifications assigned',
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory & Prioritization',
    nistPhase: 'Phase 2–3',
    defaultDurationMonths: 4,
    description:
      'Catalog all cryptographic assets by algorithm, key size, protocol, and business criticality. Rank migration priority using risk and compliance deadlines.',
    gateExitCriteria: [
      'All cryptographic assets cataloged with metadata',
      'Priority tiers (Critical / High / Medium / Low) assigned',
      'Dependency map for inter-system crypto flows complete',
    ],
  },
  {
    id: 'planning',
    name: 'Planning & Pilot',
    nistPhase: 'Phase 4–5',
    defaultDurationMonths: 5,
    description:
      'Design the migration architecture, select PQC algorithms, and run a controlled pilot on non-production or low-risk systems.',
    gateExitCriteria: [
      'Algorithm selection documented and approved',
      'Hybrid scheme strategy defined',
      'Pilot environment stood up and tested',
      'Rollback procedure validated',
    ],
  },
  {
    id: 'migration',
    name: 'Migration',
    nistPhase: 'Phase 6',
    defaultDurationMonths: 12,
    description:
      'Execute PQC migration across prioritized systems in waves, starting with Critical tier assets.',
    gateExitCriteria: [
      'All Critical-tier systems migrated and validated',
      'High-tier systems migration complete',
      'Monitoring dashboards updated with PQC metrics',
    ],
  },
  {
    id: 'validation',
    name: 'Validation & Closure',
    nistPhase: 'Phase 7',
    defaultDurationMonths: 3,
    description:
      'Validate all migrated systems against compliance requirements, update documentation, and archive legacy key material.',
    gateExitCriteria: [
      'All compliance controls verified and documented',
      'Legacy classical keys securely archived or destroyed',
      'Program closure report filed with steering committee',
    ],
  },
]

// ─── KPI Dimensions ─────────────────────────────────────────────────────────

export interface KpiDimension {
  id: string
  label: string
  weight: number // percentage, all weights sum to 100
  description: string
  measurementUnit: string
  targetThreshold: string
}

export const KPI_DIMENSIONS: KpiDimension[] = [
  {
    id: 'systems-inventoried',
    label: 'Systems Inventoried',
    weight: 15,
    description: 'Percentage of in-scope systems with a complete cryptographic inventory on file.',
    measurementUnit: '% of total in-scope systems',
    targetThreshold: '100% by end of Phase 2',
  },
  {
    id: 'algorithms-migrated',
    label: 'Algorithms Migrated',
    weight: 25,
    description:
      'Percentage of classical public-key algorithm instances replaced with approved PQC alternatives.',
    measurementUnit: '% of inventoried algorithm instances',
    targetThreshold: '100% Critical-tier by compliance deadline',
  },
  {
    id: 'vendors-assessed',
    label: 'Vendors Assessed',
    weight: 15,
    description:
      'Percentage of third-party vendors who have provided a documented PQC readiness status.',
    measurementUnit: '% of material vendors',
    targetThreshold: '90% assessed by start of migration phase',
  },
  {
    id: 'compliance-gaps-closed',
    label: 'Compliance Gaps Closed',
    weight: 20,
    description:
      'Percentage of identified regulatory compliance gaps (CNSA 2.0, NIST IR 8547, local mandates) that have been remediated.',
    measurementUnit: '% of open compliance gaps',
    targetThreshold: '100% critical gaps closed before regulatory deadline',
  },
  {
    id: 'budget-utilization',
    label: 'Budget Utilization',
    weight: 15,
    description:
      'Ratio of actual spend to approved budget, tracked quarterly to flag over/under-runs early.',
    measurementUnit: 'Actual spend / approved budget (%)',
    targetThreshold: 'Within ±10% of quarterly plan',
  },
  {
    id: 'risk-trend',
    label: 'Risk Trend',
    weight: 10,
    description:
      'Direction of the aggregate quantum-threat risk score over the past 90 days (improving, stable, or worsening).',
    measurementUnit: 'Trend direction + delta score',
    targetThreshold: 'Improving or stable at each quarterly review',
  },
]

// ─── Stakeholder Roles ───────────────────────────────────────────────────────

export interface StakeholderRole {
  id: string
  audience: string
  primaryConcerns: string[]
  messagingFocus: string
  reportingCadence: string
  escalationTrigger: string
}

export const STAKEHOLDER_ROLES: StakeholderRole[] = [
  {
    id: 'board',
    audience: 'Board / C-Suite',
    primaryConcerns: [
      'Regulatory liability',
      'Reputational risk',
      'Budget impact',
      'Competitive positioning',
    ],
    messagingFocus:
      'Risk and compliance posture — frame PQC migration as a business continuity and regulatory obligation, not a technology project.',
    reportingCadence: 'Quarterly executive summary (1 page + dashboard)',
    escalationTrigger: 'Any compliance deadline at risk or budget variance >20%',
  },
  {
    id: 'technical-leadership',
    audience: 'Technical Leadership (CTO, CISO, VP Eng)',
    primaryConcerns: [
      'Architecture decisions',
      'Algorithm selection',
      'Hybrid scheme risks',
      'Integration complexity',
    ],
    messagingFocus:
      'Technical roadmap and design decisions — algorithm choices, hybrid scheme rationale, toolchain readiness, and pilot results.',
    reportingCadence: 'Monthly technical steering committee briefing',
    escalationTrigger: 'Pilot failure, interoperability blockers, or critical vendor non-readiness',
  },
  {
    id: 'dev-teams',
    audience: 'Development & Operations Teams',
    primaryConcerns: [
      'Library availability',
      'API changes',
      'Testing overhead',
      'Deployment downtime',
    ],
    messagingFocus:
      'Practical migration playbooks — library versions, code patterns, testing frameworks, and rollback procedures.',
    reportingCadence: 'Sprint-level updates via team channels; quarterly all-hands',
    escalationTrigger: 'Blocked migration wave or critical defect in PQC library',
  },
  {
    id: 'external-partners',
    audience: 'External Partners & Vendors',
    primaryConcerns: ['Contract obligations', 'Certification timelines', 'Interoperability SLAs'],
    messagingFocus:
      'Contractual PQC requirements, shared migration milestones, and interoperability testing schedules.',
    reportingCadence: 'Bi-annual vendor readiness survey + milestone checkpoints',
    escalationTrigger: 'Vendor misses contracted PQC milestone or certification target',
  },
]

// ─── Deployment Playbook Checklist Items ────────────────────────────────────

export interface PlaybookCheckItem {
  id: string
  phase: 'pre-migration' | 'migration' | 'post-migration'
  category: string
  action: string
  owner: string
  critical: boolean
}

export const PLAYBOOK_CHECKLIST: PlaybookCheckItem[] = [
  // Pre-migration
  {
    id: 'pre-01',
    phase: 'pre-migration',
    category: 'Readiness',
    action: 'Confirm all target systems are in the cryptographic inventory with algorithm metadata',
    owner: 'Security Architecture',
    critical: true,
  },
  {
    id: 'pre-02',
    phase: 'pre-migration',
    category: 'Readiness',
    action:
      'Validate PQC library versions are pinned and approved in the internal artifact registry',
    owner: 'Platform Engineering',
    critical: true,
  },
  {
    id: 'pre-03',
    phase: 'pre-migration',
    category: 'Backup',
    action:
      'Take a full backup of key material and certificate stores before migration window opens',
    owner: 'Operations',
    critical: true,
  },
  {
    id: 'pre-04',
    phase: 'pre-migration',
    category: 'Communication',
    action:
      'Send stakeholder notification with migration window, expected downtime, and rollback contact',
    owner: 'Program Manager',
    critical: false,
  },
  {
    id: 'pre-05',
    phase: 'pre-migration',
    category: 'Testing',
    action: 'Run integration smoke tests in staging environment with PQC configuration',
    owner: 'QA / Dev Team',
    critical: true,
  },
  // Migration
  {
    id: 'mig-01',
    phase: 'migration',
    category: 'Execution',
    action: 'Deploy hybrid PQC + classical configuration to enable gradual traffic shift',
    owner: 'Platform Engineering',
    critical: true,
  },
  {
    id: 'mig-02',
    phase: 'migration',
    category: 'Monitoring',
    action: 'Monitor error rates, latency, and certificate validation failures in real time',
    owner: 'Operations',
    critical: true,
  },
  {
    id: 'mig-03',
    phase: 'migration',
    category: 'Execution',
    action: 'Shift 100% of traffic to PQC configuration after hybrid validation period',
    owner: 'Platform Engineering',
    critical: true,
  },
  {
    id: 'mig-04',
    phase: 'migration',
    category: 'Rollback',
    action:
      'Verify rollback procedure is ready to execute within SLA if critical failure is detected',
    owner: 'Operations',
    critical: true,
  },
  // Post-migration
  {
    id: 'post-01',
    phase: 'post-migration',
    category: 'Validation',
    action: 'Run full compliance control verification against CNSA 2.0 / NIST IR 8547 checklist',
    owner: 'Security Architecture',
    critical: true,
  },
  {
    id: 'post-02',
    phase: 'post-migration',
    category: 'Documentation',
    action: 'Update cryptographic inventory to reflect new PQC algorithm assignments',
    owner: 'Security Architecture',
    critical: true,
  },
  {
    id: 'post-03',
    phase: 'post-migration',
    category: 'Key Management',
    action: 'Archive or destroy legacy classical key material per retention policy',
    owner: 'Operations',
    critical: false,
  },
  {
    id: 'post-04',
    phase: 'post-migration',
    category: 'Communication',
    action: 'Send migration completion report to steering committee and update KPI tracker',
    owner: 'Program Manager',
    critical: false,
  },
]

// SPDX-License-Identifier: GPL-3.0-only
/**
 * phaseObjectives — the player-facing "what do I do here" for each phase.
 * Plain-language mission + concrete to-dos + the deliverables that clear it,
 * derived from the framework's per-phase Purpose / Tasks / Outputs / L2 success.
 */
import type { PhaseId } from './frameworkPhases'

export interface PhaseObjective {
  /** One plain sentence: what you're trying to achieve this phase. */
  mission: string
  /** Concrete actions the player takes (use the Activities below to do them). */
  todo: string[]
  /** The deliverables that prove the phase is done (these auto-clear the level). */
  produces: string[]
  /** Plain restatement of the Level-2 win bar. */
  winHint: string
}

export const PHASE_OBJECTIVES: Partial<Record<PhaseId, PhaseObjective>> = {
  p0: {
    mission: 'Get leadership to commit — turn the quantum threat into a funded, governed program.',
    todo: [
      'Make the business case and brief the board',
      'Secure a multi-year budget (not a one-off)',
      'Stand up governance: a SteerCo + a Quantum-Readiness Program Manager (QRPM)',
      'Approve a charter and a first-cut scope (your top-20 systems)',
    ],
    produces: [
      'Approved charter',
      'Multi-year budget',
      'Governance (SteerCo / QRPM)',
      'Board deck',
    ],
    winHint: 'Charter approved, QRPM appointed, Year-1 budget secured.',
  },
  p1: {
    mission: "Find all your cryptography — you can't migrate what you can't see.",
    todo: [
      'Scope by risk, then discover across three tracks (passive, active, source-integration)',
      'Run automated discovery on your Priority-A systems',
      'Cross-reference multiple sources (CMDB, SBOM, scanners) — not just one tool',
      "Don't forget OT, and capture your classical-crypto findings too",
    ],
    produces: [
      'Scoping doc',
      'Cryptographic asset inventory (≥70% of Tier-1)',
      'Sensitive-data map',
      'Systems register',
    ],
    winHint: 'Automated discovery on Priority-A, ≥70% Tier-1 coverage, queryable, multi-source.',
  },
  p2: {
    mission: 'Turn your inventory into a living, queryable Cryptographic Bill of Materials (CBOM).',
    todo: [
      'Adopt CycloneDX as your CBOM format and tooling',
      'Populate Layers 1–2 for your key applications',
      'Link the CBOM to your SBOMs',
      'Wire it into CI/CD so it stays fresh',
    ],
    produces: ['CycloneDX CBOM (Layers 1–2)', 'SBOM linkage', 'Freshness governance'],
    winHint: 'CycloneDX CBOM operational for Layers 1–2, queryable, linked to SBOMs.',
  },
  p3: {
    mission: 'Decide what to migrate first — score and sequence by real quantum risk.',
    todo: [
      'Build a risk-scoring model and score your Tier-1 CBOM entries',
      'Produce a prioritized migration backlog',
      'Generate a Quantum Risk Assessment (QRA)',
      'Factor in feasibility and legal/data-retention — not just severity',
    ],
    produces: ['Scored/tiered CBOM', 'QRA (heatmap, backlog, gap analysis)', 'Sequencing plan'],
    winHint: 'Formal scoring of Tier-1, a prioritized backlog, and a QRA produced.',
  },
  p4: {
    mission: 'Turn the backlog into a funded, multi-year execution plan.',
    todo: [
      'Draft a multi-year roadmap and a resourced Year-1 plan',
      'Stand up the PMO and a SteerCo cadence',
      'Set KPI baselines',
      'Align with refresh cycles and define milestone gates',
    ],
    produces: ['Multi-year roadmap', 'Year-1 plan', 'PMO operating model', 'KPI dashboard'],
    winHint: 'Roadmap approved, Year-1 resourced, SteerCo running, KPI baseline set.',
  },
  p5: {
    mission: 'Prove it in production — pilot, validate, then roll out in waves.',
    todo: [
      'Pick important (not just easy) pilot targets',
      'Deploy hybrid (classical + PQC) and test rollback',
      'Document validated patterns (TLS / VPN / mTLS / code-signing)',
      "Plan the waves + defense-in-depth for what can't migrate yet",
    ],
    produces: ['Pilot results', 'Validated patterns', 'Wave plan', 'Rollback procedures'],
    winHint: '2+ production pilots running, rollback tested, patterns documented.',
  },
  p6: {
    mission: 'Modernize the plumbing — PKI, HSM/KMS and network — to carry PQC.',
    todo: [
      'Inventory your HSMs with their PQC status',
      'Draft a PKI modernization plan',
      'Test middleboxes for PQC compatibility',
      'Baseline performance and plan capacity',
    ],
    produces: [
      'PKI modernization plan',
      'HSM/KMS upgrade schedule',
      'Network compatibility report',
      'Performance baseline',
    ],
    winHint: 'HSMs inventoried with PQC status, PKI plan drafted, middlebox testing started.',
  },
  p7: {
    mission: "Get your vendors on a PQC timeline — they're your biggest external constraint.",
    todo: [
      'Classify vendors by criticality',
      'Engage your top-10 with questionnaires',
      'Put PQC into procurement language and contracts',
      'Deploy bridging patterns where a vendor blocks you',
    ],
    produces: [
      'Vendor readiness register',
      'Procurement requirements',
      'Questionnaire responses',
      'Bridging deployments',
    ],
    winHint: 'Top-10 vendors engaged, questionnaires sent, criticality classified.',
  },
}

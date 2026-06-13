// SPDX-License-Identifier: GPL-3.0-only
/**
 * Canonical Migration-Program phase model (Applied Quantum Phase 0–7 + Foundations).
 *
 * This is the single source of truth for the phase overlay (Option C): the
 * AQ phase journey rendered as a *lens* over the existing NIST CSWP.39 spine.
 * See `reports/framework-gap/PHASE-OVERLAY-SPEC.md` §2 (data model), §3 (phase
 * table) and §7 (App. G crosswalk targets).
 *
 * Everything downstream — the Phase 0–7 rail, the `?phase=` filters, the QRA
 * assembly, and the App. G view on Compliance — is a read over this table.
 * Adding or retuning a phase means editing only this file.
 *
 * CSWP.39 linkage uses the canonical `ZoneId` union from `./cswp39ZoneData`.
 * The drift-guard test (`frameworkPhases.test.ts`) asserts every phase's
 * `cswp39Zones` is a subset of the real `ZoneId` set, mirroring the existing
 * `cswp39ZoneData.test.ts` guard.
 */

import type { ZoneId, Cswp39StepId } from './cswp39ZoneData'

/** The Applied Quantum migration phases. `foundations` is the spanning base band. */
export type PhaseId = 'p0' | 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'foundations'

/** How a phase progresses relative to its neighbours (drives the rail layout). */
export type Cadence = 'sequential' | 'parallel' | 'iterative' | 'continuous' | 'spanning'

/**
 * CSWP.39 5-step spine ids — canonical home is `./cswp39ZoneData`; re-exported
 * here so consumers can import the step union alongside `PhaseId`.
 */
export type { Cswp39StepId }

/** Page routes that participate in the cross-page phase journey. */
export type Route =
  | '/assess'
  | '/report'
  | '/business'
  | '/migrate'
  | '/timeline'
  | '/compliance'
  | '/learn'

/**
 * A pointer from a phase to a concrete surface on a page, tagged with whether
 * the surface already exists (`live`), is missing (`gap`, an artifact to build
 * in this pass — see spec §6), or is only partly there (`partial`).
 */
export interface SurfaceRef {
  route: Route
  ref: string
  status: 'live' | 'gap' | 'partial'
}

/**
 * An informational decision gate (G0–G7). In v1 these are surfaced as labels —
 * phase context, not enforced sign-off criteria (spec §3 note).
 */
export interface PhaseGate {
  id: string
  criterion: string
  authority: string
}

/**
 * App. G crosswalk targets — the same data closes the Compliance/Library App. G
 * gap (spec §6.7). `nistCsf` entries are real NIST CSF 2.0 subcategory codes
 * (GV / ID / PR functions).
 */
export interface PhaseCrosswalk {
  /** NIST CSF 2.0 subcategory codes (e.g. 'GV.OC-01'). */
  nistCsf: string[]
  /** PQCC (Post-Quantum Cryptography Coalition) roadmap step. */
  pqcc: string
  /** ETSI TR 103 619 migration phase reference. */
  etsiTr103619: string
  /** Dutch PQC Migration Handbook step reference. */
  dutchHandbook: string
}

export interface FrameworkPhase {
  id: PhaseId
  /** Phase number 0–7; `null` for Foundations. */
  number: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | null
  name: string
  /** Diagram caption verbatim from the spec/diagram. */
  tagline: string
  cadence: Cadence
  /** Phases that run alongside this one (P1∥P2; P5↔P6 iterative). */
  parallelWith?: PhaseId[]
  /** Informational gate (G0–G7) — labels only in v1. */
  gate?: PhaseGate
  /** CSWP.39 Fig 3 zones this phase exercises (derivation key). */
  cswp39Zones: ZoneId[]
  /** CSWP.39 5-step spine ids this phase advances. */
  cswp39Steps: Cswp39StepId[]
  /** Diagnose expression on /assess. */
  diagnose?: SurfaceRef
  /** Communicate expression on /report. */
  communicate?: SurfaceRef
  /** Produce expressions on Command Center / other pages. */
  produce?: SurfaceRef[]
  /** Every page that participates in this phase. */
  surfaces: Route[]
  /** App. G crosswalk to other frameworks. */
  crosswalk: PhaseCrosswalk
}

export const FRAMEWORK_PHASES: Record<PhaseId, FrameworkPhase> = {
  p0: {
    id: 'p0',
    number: 0,
    name: 'Executive Mandate',
    tagline: 'budget · authority · charter',
    cadence: 'sequential',
    gate: {
      id: 'G0',
      criterion: 'Mandate signed',
      authority: 'Executive Sponsor',
    },
    cswp39Zones: ['governance'],
    cswp39Steps: ['govern'],
    diagnose: { route: '/assess', ref: 'org-context-intake', status: 'partial' },
    communicate: { route: '/report', ref: 'exec-summary', status: 'live' },
    produce: [
      { route: '/business', ref: 'roi-calculator', status: 'live' },
      { route: '/business', ref: 'board-pitch', status: 'live' },
      { route: '/business', ref: 'crqc-scenario', status: 'live' },
      { route: '/business', ref: 'raci-builder', status: 'live' },
      { route: '/business', ref: 'policy-generator', status: 'live' },
      { route: '/business', ref: 'program-charter', status: 'gap' },
      { route: '/business', ref: 'initial-scoping', status: 'gap' },
    ],
    surfaces: ['/assess', '/business', '/report'],
    crosswalk: {
      nistCsf: ['GV.OC-01', 'GV.RM-01', 'GV.RR-01'],
      pqcc: 'Prepare — establish governance & executive sponsorship',
      etsiTr103619: 'Phase 1 — Preparation (organisational readiness)',
      dutchHandbook: 'Step 1 — Diagnosis (management mandate & scope)',
    },
  },
  p1: {
    id: 'p1',
    number: 1,
    name: 'Discovery & Inventory',
    tagline: 'crypto inventory · asset map',
    cadence: 'parallel',
    parallelWith: ['p2'],
    gate: {
      id: 'G1',
      criterion: '≥70% Tier-1 systems inventoried',
      authority: 'Cryptographic Architect',
    },
    cswp39Zones: ['assets'],
    cswp39Steps: ['inventory'],
    diagnose: { route: '/assess', ref: 'scope-inputs', status: 'partial' },
    communicate: { route: '/report', ref: 'inventory-appendix', status: 'live' },
    produce: [
      { route: '/migrate', ref: 'migrate-stack', status: 'live' },
      { route: '/migrate', ref: 'cbom-scanner', status: 'live' },
      { route: '/business', ref: 'management-tools-audit', status: 'partial' },
    ],
    surfaces: ['/assess', '/migrate', '/business', '/report'],
    crosswalk: {
      nistCsf: ['ID.AM-01', 'ID.AM-02', 'ID.AM-07'],
      pqcc: 'Discover — build the cryptographic inventory',
      etsiTr103619: 'Phase 2 — Identification (cryptographic inventory)',
      dutchHandbook: 'Step 2 — Inventory (locate cryptography in the estate)',
    },
  },
  p2: {
    id: 'p2',
    number: 2,
    name: 'CBOM',
    tagline: 'MV-CBOM · queryable records',
    cadence: 'parallel',
    parallelWith: ['p1'],
    gate: {
      id: 'G2',
      criterion: 'Machine-verifiable CBOM published',
      authority: 'Cryptographic Architect',
    },
    cswp39Zones: ['assets'],
    cswp39Steps: ['inventory'],
    communicate: { route: '/report', ref: 'cbom-section', status: 'live' },
    produce: [
      { route: '/business', ref: 'crypto-cbom-builder', status: 'live' },
      { route: '/migrate', ref: 'cyclonedx-export', status: 'gap' },
    ],
    surfaces: ['/business', '/migrate', '/report'],
    crosswalk: {
      nistCsf: ['ID.AM-08', 'ID.AM-02'],
      pqcc: 'Discover — codify the inventory as a CBOM',
      etsiTr103619: 'Phase 2 — Identification (structured inventory records)',
      dutchHandbook: 'Step 2 — Inventory (machine-readable CBOM)',
    },
  },
  p3: {
    id: 'p3',
    number: 3,
    name: 'Risk Scoring',
    tagline: 'prioritized backlog',
    cadence: 'sequential',
    gate: {
      id: 'G3',
      criterion: 'QRA approved',
      authority: 'QRPM',
    },
    cswp39Zones: ['risk-management'],
    cswp39Steps: ['identify-gaps', 'prioritise'],
    diagnose: { route: '/assess', ref: 'assess-engine', status: 'live' },
    communicate: { route: '/report', ref: 'qra', status: 'gap' },
    produce: [
      { route: '/assess', ref: 'two-track-output', status: 'gap' },
      { route: '/business', ref: 'risk-register', status: 'live' },
      { route: '/business', ref: 'risk-treatment-plan', status: 'live' },
    ],
    surfaces: ['/assess', '/business', '/report'],
    crosswalk: {
      nistCsf: ['ID.RA-01', 'ID.RA-04', 'ID.RA-05', 'GV.RM-02'],
      pqcc: 'Assess — prioritise by risk (HNDL / HNFL)',
      etsiTr103619: 'Phase 3 — Risk assessment & prioritisation',
      dutchHandbook: 'Step 3 — Risk analysis (prioritised migration backlog)',
    },
  },
  p4: {
    id: 'p4',
    number: 4,
    name: 'Roadmap & Governance',
    tagline: 'multi-year · PMO · gates',
    cadence: 'sequential',
    gate: {
      id: 'G4',
      criterion: 'Multi-year roadmap & PMO established',
      authority: 'QRPM',
    },
    cswp39Zones: ['migration', 'governance'],
    cswp39Steps: ['implement'],
    produce: [
      { route: '/business', ref: 'roadmap-builder', status: 'live' },
      { route: '/timeline', ref: 'compliance-timeline', status: 'live' },
    ],
    communicate: { route: '/report', ref: 'migration-roadmap', status: 'live' },
    surfaces: ['/business', '/timeline', '/report'],
    crosswalk: {
      nistCsf: ['GV.RM-03', 'ID.IM-01', 'GV.RR-02'],
      pqcc: 'Plan — multi-year migration roadmap & governance',
      etsiTr103619: 'Phase 4 — Migration planning (roadmap & governance)',
      dutchHandbook: 'Step 4 — Migration plan (roadmap, PMO, gates)',
    },
  },
  p5: {
    id: 'p5',
    number: 5,
    name: 'Pilots & Migration',
    tagline: 'pilots · waves · cutover',
    cadence: 'iterative',
    parallelWith: ['p6'],
    gate: {
      id: 'G5',
      criterion: 'Pilots validated; wave migration underway',
      authority: 'Application Security Lead',
    },
    cswp39Zones: ['mitigation', 'migration'],
    cswp39Steps: ['implement'],
    produce: [
      { route: '/business', ref: 'deployment-playbook', status: 'live' },
      { route: '/business', ref: 'hybrid-transition-planner', status: 'live' },
      { route: '/business', ref: 'mti-negotiator', status: 'live' },
      { route: '/business', ref: 'crypto-api-refactor-audit', status: 'live' },
      { route: '/migrate', ref: 'migrate', status: 'live' },
      { route: '/migrate', ref: 'wave-data-at-rest-ai', status: 'gap' },
    ],
    communicate: { route: '/report', ref: 'pilot-results', status: 'gap' },
    surfaces: ['/business', '/migrate', '/report'],
    crosswalk: {
      nistCsf: ['PR.PS-01', 'ID.IM-02', 'PR.PS-02'],
      pqcc: 'Execute — pilots, waves & cutover',
      etsiTr103619: 'Phase 5 — Migration execution',
      dutchHandbook: 'Step 5 — Execution (pilots & phased migration)',
    },
  },
  p6: {
    id: 'p6',
    number: 6,
    name: 'Infrastructure & Performance',
    tagline: 'HSM · KMS · network · perf',
    cadence: 'iterative',
    parallelWith: ['p5'],
    gate: {
      id: 'G6',
      criterion: 'Infrastructure PQC-ready; performance validated',
      authority: 'Security Engineers (PQC)',
    },
    cswp39Zones: ['management-tools'],
    cswp39Steps: ['implement'],
    produce: [
      { route: '/learn', ref: 'learn-hsm-kms-network-testing', status: 'live' },
      { route: '/business', ref: 'cc-infra-plan', status: 'gap' },
      { route: '/migrate', ref: 'algorithms-perf', status: 'gap' },
    ],
    surfaces: ['/learn', '/business', '/migrate'],
    crosswalk: {
      nistCsf: ['PR.IR-01', 'PR.PS-02', 'PR.IR-04'],
      pqcc: 'Execute — modernise infrastructure & validate performance',
      etsiTr103619: 'Phase 5 — Migration execution (infrastructure)',
      dutchHandbook: 'Step 5 — Execution (infrastructure readiness)',
    },
  },
  p7: {
    id: 'p7',
    number: 7,
    name: 'Vendor & Supply Chain',
    tagline: 'continuous vendor governance',
    cadence: 'continuous',
    cswp39Zones: ['governance'],
    cswp39Steps: ['govern'],
    produce: [
      { route: '/business', ref: 'vendor-scorecard', status: 'live' },
      { route: '/business', ref: 'contract-clause', status: 'live' },
      { route: '/business', ref: 'supply-chain-matrix', status: 'live' },
      { route: '/business', ref: 'cloud-responsibility-matrix', status: 'live' },
      { route: '/compliance', ref: 'compliance', status: 'live' },
    ],
    communicate: { route: '/report', ref: 'vendor-appendix', status: 'live' },
    surfaces: ['/business', '/compliance', '/report'],
    crosswalk: {
      nistCsf: ['GV.SC-01', 'GV.SC-04', 'GV.SC-06', 'ID.RA-10'],
      pqcc: 'Govern — continuous supply-chain assurance',
      etsiTr103619: 'Phase 1 — Preparation (supply-chain dependencies, ongoing)',
      dutchHandbook: 'Cross-cutting — supply-chain & vendor management',
    },
  },
  foundations: {
    id: 'foundations',
    number: null,
    name: 'Foundations',
    tagline: 'Maturity · KPIs · Crypto-Agility · Reg-Mapping · Skills',
    cadence: 'spanning',
    cswp39Zones: [
      'governance',
      'assets',
      'management-tools',
      'risk-management',
      'mitigation',
      'migration',
    ],
    cswp39Steps: ['govern', 'inventory', 'identify-gaps', 'prioritise', 'implement'],
    diagnose: { route: '/assess', ref: 'maturity-l0-l4', status: 'gap' },
    communicate: { route: '/report', ref: 'kpi-strip', status: 'partial' },
    produce: [
      { route: '/business', ref: 'kpi-dashboard', status: 'live' },
      { route: '/business', ref: 'kpi-tracker', status: 'live' },
      { route: '/business', ref: 'skills-team-plan', status: 'gap' },
      { route: '/learn', ref: 'crypto-agility', status: 'live' },
      { route: '/compliance', ref: 'reg-mapping', status: 'live' },
    ],
    surfaces: ['/assess', '/business', '/learn', '/compliance', '/report'],
    crosswalk: {
      nistCsf: ['GV.OC-03', 'PR.AT-01', 'PR.AT-02', 'ID.IM-03'],
      pqcc: 'Cross-cutting — maturity, agility, skills & metrics',
      etsiTr103619: 'Cross-cutting — crypto-agility & competence',
      dutchHandbook: 'Cross-cutting — crypto-agility, KPIs & skills',
    },
  },
}

/** Canonical iteration order for the phases (rail layout: 0→1∥2→3→4→5⇄6, 7, Foundations). */
export const PHASE_ORDER: PhaseId[] = [
  'p0',
  'p1',
  'p2',
  'p3',
  'p4',
  'p5',
  'p6',
  'p7',
  'foundations',
]

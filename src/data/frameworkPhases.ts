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

/**
 * Canonical Applied Quantum framework version this phase model is derived from.
 * The simulation trees stamp it into each `PhaseTree.source`; the sim drift guard
 * (`trees.test.ts`) fails when this moves ahead of the snapshots, signalling
 * "regenerate the sim trees" (run `node scripts/gen-sim-trees.mjs`). Bump this
 * only when the framework itself revises.
 */
export const FRAMEWORK_VERSION = 'v2.1'

/**
 * Source attribution for the framework this product's phase model is built on.
 * The framework is published under CC BY 4.0 (credit + link required); these
 * constants are the single source of truth for the acknowledgment shown in the
 * tools that surface the framework.
 */
export const FRAMEWORK_NAME = 'Applied Quantum PQC Migration Framework'
export const FRAMEWORK_AUTHOR = 'Marin Ivezic / Applied Quantum'
export const FRAMEWORK_LICENSE = 'CC BY 4.0'
/** Canonical framework site (home + license + research). */
export const FRAMEWORK_URL = 'https://pqcframework.com'

/** The Applied Quantum migration phases. `foundations` is the spanning base band. */
export type PhaseId =
  | 'p0'
  | 'p1'
  | 'p2'
  | 'p3'
  | 'p4'
  | 'p5'
  | 'p6'
  | 'p7'
  | 'verify-close'
  | 'foundations'

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
  /**
   * Deliberate-resolution note for a `gap`/`partial` ref (simulation.md item 3,
   * 07082026 remediation): what already exists nearby and/or why this specific
   * surface isn't built yet. Required reading before ever wiring this table to
   * render real "produce this artifact" links — a ref with no note is not a
   * ref anyone has actually decided what to do with.
   */
  note?: string
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
  /**
   * PQCC (Post-Quantum Cryptography Coalition) migration roadmap category.
   * Web-verified 2026-07-18: the real roadmap (pqcc.org, May 2025) has
   * exactly FOUR categories — Preparation, Baseline Understanding, Planning
   * and Execution, Monitoring and Evaluation. Do not invent finer-grained
   * step names; a sim phase maps to one of these four, honestly, even when
   * several phases share a category.
   */
  pqcc: string
  /**
   * ETSI TR 103 619 stage reference.
   * Web-verified 2026-07-18: the TR ("Migration strategies and
   * recommendations to Quantum Safe schemes", V1.1.1, 2020) has exactly
   * THREE stages — (1) Inventory compilation, (2) Migration-plan
   * preparation, (3) Migration execution. There is no "Phase 4/5" and no
   * "Identification" or "Preparation (organisational readiness)" stage —
   * that mislabeling shipped for months before this correction. Where a sim
   * phase (e.g. p0, p7) has no honest single-stage home, say so explicitly
   * rather than force-fitting a stage name.
   */
  etsiTr103619: string
  /**
   * Dutch PQC Migration Handbook (TNO/CWI/AIVD) step reference.
   * Web-verified 2026-07-18: the handbook has exactly THREE top-level steps
   * — Diagnosis, Planning, Execution. Inventory and risk analysis are
   * activities *inside* Diagnosis, not separate steps — there is no 5-step
   * structure.
   */
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
      criterion: 'Charter, budget & QRPM approved',
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
      { route: '/business', ref: 'program-charter', status: 'live' },
      { route: '/business', ref: 'initial-scoping', status: 'live' },
      { route: '/business', ref: 'cost-of-inaction', status: 'live' },
      { route: '/business', ref: 'cost-model-explorer', status: 'live' },
      { route: '/business', ref: 'breach-simulator', status: 'live' },
    ],
    surfaces: ['/assess', '/business', '/report'],
    crosswalk: {
      nistCsf: ['GV.OC-01', 'GV.RM-01', 'GV.RR-01'],
      pqcc: 'Preparation (governance & executive sponsorship)',
      etsiTr103619:
        'Not a discrete TR stage — nearest is Stage 2, migration-plan preparation (an org mandate feeds the plan)',
      dutchHandbook: 'Diagnosis (management mandate & scope)',
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
      criterion:
        'Scoping doc done; Priority-A inventory ≥90%; classical findings reported; continuous discovery live',
      authority: 'SteerCo',
    },
    cswp39Zones: ['assets'],
    cswp39Steps: ['inventory'],
    diagnose: { route: '/assess', ref: 'scope-inputs', status: 'partial' },
    communicate: { route: '/report', ref: 'inventory-appendix', status: 'live' },
    produce: [
      { route: '/migrate', ref: 'migrate-stack', status: 'live' },
      { route: '/migrate', ref: 'cbom-scanner', status: 'live' },
      { route: '/business', ref: 'management-tools-audit', status: 'partial' },
      { route: '/business', ref: 'crypto-architecture-diagram', status: 'live' },
      { route: '/business', ref: 'crypto-vulnerability-watch', status: 'live' },
    ],
    surfaces: ['/assess', '/migrate', '/business', '/report'],
    crosswalk: {
      nistCsf: ['ID.AM-01', 'ID.AM-02', 'ID.AM-07'],
      pqcc: 'Baseline Understanding (build the cryptographic inventory)',
      etsiTr103619: 'Stage 1 — Inventory compilation',
      dutchHandbook: 'Diagnosis (cryptography inventory is compiled within this step)',
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
      criterion:
        'CBOM live for Layers 1–2; freshness governance enforced; protection controls applied',
      authority: 'SteerCo',
    },
    cswp39Zones: ['assets'],
    cswp39Steps: ['inventory'],
    communicate: { route: '/report', ref: 'cbom-section', status: 'live' },
    produce: [
      { route: '/business', ref: 'crypto-cbom-builder', status: 'live' },
      { route: '/migrate', ref: 'cyclonedx-export', status: 'live' },
    ],
    surfaces: ['/business', '/migrate', '/report'],
    crosswalk: {
      nistCsf: ['ID.AM-08', 'ID.AM-02'],
      pqcc: 'Baseline Understanding (codify the inventory as a CBOM)',
      etsiTr103619: 'Stage 1 — Inventory compilation (structured, machine-readable output)',
      dutchHandbook: 'Diagnosis (CBOM is the inventory step’s structured output)',
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
      criterion: 'Risk scoring complete; QRA with prioritized backlog delivered',
      authority: 'Executive Sponsor',
    },
    cswp39Zones: ['risk-management'],
    cswp39Steps: ['identify-gaps', 'prioritise'],
    diagnose: { route: '/assess', ref: 'assess-engine', status: 'live' },
    // Corrected 07082026 (simulation.md item 3): stale — QRASection.tsx has
    // rendered this on /report since it was built, verified wired in
    // ReportContent.tsx and covered by QRASection.test.tsx.
    communicate: { route: '/report', ref: 'qra', status: 'live' },
    produce: [
      { route: '/assess', ref: 'two-track-output', status: 'gap' },
      { route: '/business', ref: 'risk-register', status: 'live' },
      { route: '/business', ref: 'risk-treatment-plan', status: 'live' },
    ],
    surfaces: ['/assess', '/business', '/report'],
    crosswalk: {
      nistCsf: ['ID.RA-01', 'ID.RA-04', 'ID.RA-05', 'GV.RM-02'],
      pqcc: 'Planning and Execution (prioritise the backlog by risk — HNDL / HNFL)',
      etsiTr103619: 'Stage 2 — Migration-plan preparation (risk assessment feeds the plan)',
      dutchHandbook: 'Diagnosis (risk analysis closes this step, per the handbook’s own structure)',
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
      criterion: 'Multi-year roadmap approved; Year 1 plan resourced',
      authority: 'Executive Sponsor',
    },
    cswp39Zones: ['migration', 'governance'],
    cswp39Steps: ['implement'],
    produce: [
      { route: '/business', ref: 'roadmap-builder', status: 'live' },
      { route: '/timeline', ref: 'compliance-timeline', status: 'live' },
      { route: '/business', ref: 'stakeholder-comms', status: 'live' },
      { route: '/business', ref: 'refresh-cycle-alignment', status: 'live' },
      { route: '/business', ref: 'accelerated-execution-profile', status: 'live' },
    ],
    communicate: { route: '/report', ref: 'migration-roadmap', status: 'live' },
    surfaces: ['/business', '/timeline', '/report'],
    crosswalk: {
      nistCsf: ['GV.RM-03', 'ID.IM-01', 'GV.RR-02'],
      pqcc: 'Planning and Execution (multi-year roadmap & governance)',
      etsiTr103619: 'Stage 2 — Migration-plan preparation (roadmap & governance)',
      dutchHandbook: 'Planning (roadmap, PMO, gates)',
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
      criterion: 'Pilots validated; performance baselines established; Tier-1 rollout approved',
      authority: 'SteerCo',
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
      { route: '/business', ref: 'data-at-rest-strategy', status: 'live' },
    ],
    communicate: {
      route: '/report',
      ref: 'pilot-results',
      status: 'live',
      note: 'Wave 5 (WP5.1, 07182026): SimulationOutcomesSection on /report reads the committed sim-roadmap doc — readiness, compliance, phase maturity, transformation objectives with dates, and the run grade.',
    },
    surfaces: ['/business', '/migrate', '/report'],
    crosswalk: {
      nistCsf: ['PR.PS-01', 'ID.IM-02', 'PR.PS-02'],
      pqcc: 'Planning and Execution (pilots, waves & cutover)',
      etsiTr103619: 'Stage 3 — Migration execution',
      dutchHandbook: 'Execution (pilots & phased migration)',
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
      criterion: 'Infrastructure upgrades scheduled; vendor commitments tracked',
      authority: 'QRPM',
    },
    cswp39Zones: ['management-tools'],
    cswp39Steps: ['implement'],
    produce: [
      { route: '/learn', ref: 'learn-hsm-kms-network-testing', status: 'live' },
      // Corrected 07082026 (simulation.md item 3): stale ref — the
      // 'infra-modernization-planner' business tool (frameworkPhase p6) already
      // consolidates the PKI modernization plan, HSM/KMS upgrade schedule,
      // network/middlebox compatibility report, and PQC capacity plan this
      // entry described. Renamed to the real tool id.
      { route: '/business', ref: 'infra-modernization-planner', status: 'live' },
      {
        route: '/migrate',
        ref: 'algorithms-perf',
        status: 'gap',
        note: 'No per-product performance-benchmark surface on /migrate. Closest existing destination: /algorithms → Detailed Comparison tab, which already renders cycle-count/PerfBar performance data per algorithm (AlgorithmDetailedComparison.tsx) — just not scoped to /migrate product selections. Scoped down for now (simulation.md item 3, 07082026).',
      },
    ],
    surfaces: ['/learn', '/business', '/migrate'],
    crosswalk: {
      nistCsf: ['PR.IR-01', 'PR.PS-02', 'PR.IR-04'],
      pqcc: 'Planning and Execution (modernise infrastructure & validate performance)',
      etsiTr103619: 'Stage 3 — Migration execution (infrastructure)',
      dutchHandbook: 'Execution (infrastructure readiness)',
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
      pqcc: 'Monitoring and Evaluation (continuous vendor & supply-chain governance)',
      etsiTr103619:
        'Not a discrete TR stage — dependency identification recurs across all three stages',
      dutchHandbook:
        'Cross-cutting — spans Planning and Execution (supply-chain & vendor management)',
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
      { route: '/business', ref: 'skills-team-plan', status: 'live' },
      { route: '/learn', ref: 'crypto-agility', status: 'live' },
      { route: '/compliance', ref: 'reg-mapping', status: 'live' },
    ],
    surfaces: ['/assess', '/business', '/learn', '/compliance', '/report'],
    crosswalk: {
      nistCsf: ['GV.OC-03', 'PR.AT-01', 'PR.AT-02', 'ID.IM-03'],
      pqcc: 'Cross-cutting — maturity/agility/skills span every PQCC category from Preparation through Monitoring and Evaluation',
      etsiTr103619: 'Cross-cutting — not a discrete TR stage',
      dutchHandbook: 'Cross-cutting — not a discrete handbook step',
    },
  },
  'verify-close': {
    id: 'verify-close',
    number: null,
    name: 'Verification & Closure',
    tagline: 'evidence · decommission · BAU handover',
    cadence: 'sequential',
    gate: {
      id: 'G8',
      criterion: 'Verification complete; classical material decommissioned; closed to BAU',
      authority: 'Executive Sponsor',
    },
    cswp39Zones: ['governance'],
    cswp39Steps: ['implement', 'govern'],
    // Wave 5 (WP5.1, 07182026): SimulationOutcomesSection now surfaces a
    // closure-record block on /report when verify-close was cleared in the
    // committed sim run — the summary points to the full evidence dossier in
    // the 'migration-verification' business tool (produce entry below).
    communicate: {
      route: '/report',
      ref: 'closure-record',
      status: 'live',
      note: "SimulationOutcomesSection shows a closure-record summary when the sim run cleared verify-close; the full evidence dossier stays in the 'migration-verification' business tool.",
    },
    produce: [{ route: '/business', ref: 'migration-verification', status: 'live' }],
    surfaces: ['/business', '/report'],
    crosswalk: {
      nistCsf: ['GV.OV-03', 'ID.IM-03', 'PR.PS-06'],
      pqcc: 'Monitoring and Evaluation (verify, decommission classical material, sustain)',
      etsiTr103619:
        'Stage 3 — Migration execution (verification & decommissioning close this stage)',
      dutchHandbook:
        'Execution (verify migration & decommission classical material — the handbook has no distinct closure step)',
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
  'verify-close',
  'foundations',
]

/**
 * The PLAYED migration phases for the simulation board — PHASE_ORDER minus only
 * the spanning Foundations band. Includes the terminal Verification & Closure
 * phase (the run-complete ceremony withholds until it clears, so "done" requires
 * the closure evidence dossier). Single source of truth shared by SimulationView
 * and the quarter engine so the two can never drift on the phase count.
 */
export const LIFECYCLE_PHASES: PhaseId[] = PHASE_ORDER.filter((p) => p !== 'foundations')

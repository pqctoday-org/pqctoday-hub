// SPDX-License-Identifier: GPL-3.0-only
//
// Curated data for the redesigned CSWP.39 explorer that isn't already in
// cswp39Data.ts: which persona owns each agility step, the regulation→deliverable
// "satisfies" map, the hybrid-vs-pure-PQC jurisdiction stances, and the auditor
// evidence dossiers. Derived from NIST CSWP.39 and the cited regulations.

import type { PersonaId } from '@/data/learningPersonas'
import { CSWP39_STEPS, CSWP39_TIERS, type CSWP39Step } from '../cswp39Data'
import type { Cswp39Params } from '../useComplianceUrlState'
import type { Tone } from './tones'

/**
 * Which personas own each agility step (drives the role-lens highlight).
 *
 * `grc` added 2026-09-07 (Executive/GRC split) to govern/inventory/
 * identify-gaps/prioritise — matching its own BC_ZONE_EMPHASIS_BY_PERSONA
 * entry in personaConfig.ts (governance + risk-management zones, audit
 * checklist/policy/vendor scorecard/risk register/treatment plan) and its
 * `grc-governance-inventory` learning checkpoint. Not added to `implement`:
 * GRC governs, tracks and verifies — it doesn't hands-on implement, the
 * same reasoning that excludes it from the engineering-workbench surfaces.
 */
export const STEP_OWNERS: Record<CSWP39Step['id'], PersonaId[]> = {
  govern: ['executive', 'grc', 'architect'],
  inventory: ['ops', 'grc', 'architect'],
  'identify-gaps': ['ops', 'grc', 'developer', 'researcher'],
  prioritise: ['executive', 'grc', 'architect', 'researcher'],
  implement: ['developer', 'ops', 'architect'],
}

/** Per-step accent tone for the agility cycle. */
export const STEP_TONE: Record<CSWP39Step['id'], Tone> = {
  govern: 'secondary',
  inventory: 'primary',
  'identify-gaps': 'info',
  prioritise: 'warning',
  implement: 'success',
}

export interface SatisfiesRow {
  regulation: string
  obligation: string
  deliverable: string
  phase: string
}

export const SATISFIES_ROWS: SatisfiesRow[] = [
  {
    regulation: 'PCI DSS 4.0 — 12.3.3',
    obligation: 'Inventory of cipher suites & protocols in use',
    deliverable: 'Machine-verifiable CBOM (CycloneDX)',
    phase: 'CBOM',
  },
  {
    regulation: 'NIS2 — Art. 21',
    obligation: 'Risk-based assessment of crypto exposure',
    deliverable: 'Quantum Risk Assessment (QRA)',
    phase: 'Risk scoring',
  },
  {
    regulation: 'OMB M-23-02 / NSM-10',
    obligation: 'Prioritised crypto inventory of in-scope systems',
    deliverable: 'Crypto inventory & asset map',
    phase: 'Inventory',
  },
  {
    regulation: 'EU DORA',
    obligation: 'Board-approved governance for ICT/crypto resilience',
    deliverable: 'Program Charter & governance',
    phase: 'Program',
  },
  {
    regulation: 'CNSA 2.0 (NSM-8)',
    obligation: 'Multi-year plan to transition NSS to PQC',
    deliverable: 'Multi-year migration roadmap',
    phase: 'Roadmap',
  },
  {
    regulation: 'FIPS 140-3',
    obligation: 'Use validated modules; document performance',
    deliverable: 'PKI-HSM modernisation plan',
    phase: 'Infra / PKI',
  },
]

export interface HybridStanceRow {
  regime: string
  jurisdiction: string
  stance: string
  tone: Tone
  position: string
}

export const HYBRID_ROWS: HybridStanceRow[] = [
  {
    regime: 'BSI (TR-02102)',
    jurisdiction: 'Germany / EU',
    stance: 'Hybrid mandated',
    tone: 'success',
    position: 'Requires classical + PQC during transition; pure PQC not yet trusted.',
  },
  {
    regime: 'ANSSI',
    jurisdiction: 'France',
    stance: 'Hybrid mandated',
    tone: 'success',
    position: 'Defence-in-depth: hybrid required until PQC has longer field exposure.',
  },
  {
    regime: 'NSA / CNSA 2.0',
    jurisdiction: 'United States (NSS)',
    stance: 'Hybrid interim',
    tone: 'warning',
    position: 'Tolerated as interim; end-state is pure CNSA-2.0 algorithms.',
  },
  {
    regime: 'NCSC',
    jurisdiction: 'United Kingdom',
    stance: 'Pure PQC preferred',
    tone: 'info',
    position: 'Prefers pure standardised PQC; hybrid only where unavoidable.',
  },
]

export interface DossierDef {
  id: string
  regulation: string
  focus: string
  items: string[]
}

export const DOSSIER_DEFS: DossierDef[] = [
  {
    id: 'pci',
    regulation: 'PCI DSS 4.0 — 12.3.3',
    focus: 'Documented, current inventory of cipher suites & protocols.',
    items: [
      'CycloneDX CBOM export with timestamp',
      'Scan / inventory report covering in-scope systems',
      'Change log: inventory reviewed ≥ annually',
    ],
  },
  {
    id: 'nis2',
    regulation: 'NIS2 — Art. 21',
    focus: 'Risk-based crypto exposure assessment & treatment.',
    items: [
      'Quantum Risk Assessment (QRA)',
      'Risk register entries with owners & status',
      'Board / SteerCo minutes accepting residual risk',
    ],
  },
  {
    id: 'cnsa2',
    regulation: 'CNSA 2.0 (NSM-8)',
    focus: 'Multi-year transition plan for NSS to PQC.',
    items: [
      'Signed multi-year roadmap with gate dates',
      'Per-system migration status tracker',
      'Pilot evidence using ML-KEM-1024 / ML-DSA-87',
    ],
  },
  {
    id: 'dora',
    regulation: 'EU DORA — ICT risk framework',
    focus: 'Board-approved governance & resilience testing.',
    items: [
      'Program Charter with executive sponsor sign-off',
      'Governance structure (SteerCo / QRPM cadence)',
      'Tabletop records referencing PQC scenarios',
    ],
  },
  {
    id: 'fips',
    regulation: 'FIPS 140-3 (validated modules)',
    focus: 'Use of validated modules; performance fitness.',
    items: [
      'CMVP certificate numbers for deployed modules',
      'Dual-stack CA modernisation schedule',
      'Performance-test results under load',
    ],
  },
]

const PERSONA_LABEL: Record<PersonaId, string> = {
  executive: 'Executive',
  grc: 'GRC',
  architect: 'Architect',
  ops: 'Ops',
  developer: 'Developer',
  researcher: 'Researcher',
  'cert-engineer': 'Certification',
  curious: 'Curious',
}

export function personaLabel(persona: PersonaId): string {
  // eslint-disable-next-line security/detect-object-injection
  return PERSONA_LABEL[persona]
}

// ── URL state (deep-link PR 2, 2026-09-29) ──────────────────────────────────

export type Cswp39SubView = 'cycle' | 'maturity' | 'evidence'

function isSubView(v: string | null | undefined): v is Cswp39SubView {
  return v === 'cycle' || v === 'maturity' || v === 'evidence'
}

/**
 * Resolve the explorer's URL params to what it shows. Unknown values fall
 * back to the defaults rather than blanking a view. Without an explicit
 * `cswpview`, the param a link carries picks the view: `evref` / `dossier`
 * → evidence, `mtier` → maturity, otherwise the cycle.
 */
export function resolveCswp39View(params: Cswp39Params, evref?: string) {
  const step = CSWP39_STEPS.find((s) => s.id === params.step)?.id ?? 'govern'
  const tierNum = Number(params.mtier)
  const tier = CSWP39_TIERS.some((t) => t.level === tierNum) ? tierNum : 2
  const dossier = DOSSIER_DEFS.some((d) => d.id === params.dossier)
    ? (params.dossier as string)
    : null
  const view: Cswp39SubView = isSubView(params.cswpview)
    ? params.cswpview
    : evref || dossier
      ? 'evidence'
      : params.mtier && tier === tierNum
        ? 'maturity'
        : 'cycle'
  return { view, step, tier, dossier }
}

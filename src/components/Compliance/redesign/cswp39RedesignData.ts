// SPDX-License-Identifier: AGPL-3.0-only
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
  inventory: ['ops', 'grc', 'architect', 'cert-engineer'],
  'identify-gaps': ['ops', 'grc', 'developer', 'researcher', 'cert-engineer'],
  prioritise: ['executive', 'grc', 'architect', 'researcher'],
  implement: ['developer', 'ops', 'architect', 'cert-engineer'],
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
    regulation: 'PCI DSS v4.0.1',
    obligation:
      'No PQC deadline on the public PCI pages; a cryptographic inventory is a sensible planning basis',
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

// Each row cites the position document it summarises and keeps three things
// apart: what an authority recommends, what it approves, and what binds
// anyone. `stance` is a short label; `position` carries the document, its date
// and the scope it covers.
export const HYBRID_ROWS: HybridStanceRow[] = [
  {
    regime: 'BSI (TR-02102-1)',
    jurisdiction: 'Germany',
    stance: 'Hybrid recommended',
    tone: 'info',
    position:
      'A technical guideline of recommendations, not a law. Version 2026-01 (23 January 2026) recommends quantum-safe key agreement only combined with a classical mechanism, and quantum-safe signatures only together with a classical signature; hash-based signatures may in principle be used alone. Classical-only key agreement is recommended just to the end of 2031.',
  },
  {
    regime: 'ANSSI',
    jurisdiction: 'France',
    stance: 'Hybrid recommended; mandatory in regulated scope',
    tone: 'warning',
    position:
      "ANSSI's PQC FAQ on cyber.gouv.fr (undated; it cites the June 2025 EU roadmap) insists on hybridisation wherever PQC protection is needed, except for hash-based signatures (SLH-DSA, XMSS, LMS). Hybridisation is mandatory only in the regulated perimeter: defence-classified and Diffusion Restreinte data, vital-importance systems (SAIV) and ANSSI product certification and qualification. Elsewhere ANSSI states its PQC advice, hybridisation included, is not a regulatory obligation.",
  },
  {
    regime: 'NSA / CNSA 2.0',
    jurisdiction: 'United States (national security systems only)',
    stance: 'No hybrid requirement',
    tone: 'info',
    position:
      'CNSA 2.0 FAQ v2.2 (October 2026): NSA has confidence in the CNSA 2.0 algorithms and does not require hybrid products for security. Where it has issued public guidance on a hybrid, such as its IKEv2 profile, only that hybrid counts as CNSA 2.0 compliant. NSA sets requirements for national security systems and mandates nothing outside them.',
  },
  {
    regime: 'NCSC',
    jurisdiction: 'United Kingdom',
    stance: 'Hybrid optional; interim if used',
    tone: 'info',
    position:
      'NCSC guidance "Next steps in preparing for post-quantum cryptography" (published November 2023, updated August 2024): a hybrid can be justified by interoperability, implementation security or protocol constraints. If one is chosen, NCSC recommends it as an interim measure within a framework that allows a straightforward move to PQC-only. For PKI it prefers one migration to a fully post-quantum PKI over an intermediate hybrid PKI. Its TLS guidance of 15 October 2026 recommends both hybrid and pure post-quantum cipher choices.',
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
    regulation: 'PCI DSS v4.0.1',
    focus:
      'A cryptographic inventory as a planning basis (a suggestion of this tracker, not a PCI statement).',
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

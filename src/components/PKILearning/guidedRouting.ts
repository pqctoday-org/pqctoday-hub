// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The "Where do I start?" routing rules, shared by the desktop disclosure
 * (WhereToStartTree) and the phone's Guided tab (MobileGuidedRoutingView), so the
 * two cannot drift: six statements about where a migration programme stands today,
 * each pointing at one first module or page, plus the framework crosswalk read off
 * the canonical phase model. Pure data and lookups: no JSX, no routing.
 *
 * Routing follows Applied Quantum App. B (p.192); the crosswalk reads App. G (p.199).
 */
import {
  FRAMEWORK_PHASES,
  PHASE_ORDER,
  type PhaseCrosswalk,
  type PhaseId,
} from '@/data/frameworkPhases'

/** A branch in the App. B router: a learner situation → a recommended first stop. */
export interface StartBranch {
  id: string
  /** Self-reported situation. */
  question: string
  /** Why this route. */
  rationale: string
  /** Route target — a learn module path or a top-level page. */
  to: string
  /** Button label for the target. */
  cta: string
  /** Phase this branch enters, used to surface the crosswalk row. */
  phase: PhaseId
}

export const START_BRANCHES: readonly StartBranch[] = [
  {
    id: 'never-started',
    question: 'Haven’t started — no mandate or budget yet',
    rationale:
      'Begin with the threat and the executive case so you can secure sponsorship before any technical work.',
    to: '/learn/quantum-threats',
    cta: 'Start: Quantum Threats',
    phase: 'p0',
  },
  {
    id: 'mandate-no-inventory',
    question: 'Have a mandate, but don’t know what crypto we run',
    rationale:
      'You are at Discovery. Build a cryptographic inventory / CBOM before scoring or planning.',
    to: '/learn/crypto-agility',
    cta: 'Start: Crypto Agility & CBOM',
    phase: 'p1',
  },
  {
    id: 'inventory-no-priorities',
    question: 'Have an inventory, but no risk priorities',
    rationale:
      'You are at Risk Scoring. Produce a prioritised, two-track backlog from your inventory.',
    to: '/learn/pqc-risk-management',
    cta: 'Start: PQC Risk Management',
    phase: 'p3',
  },
  {
    id: 'priorities-no-roadmap',
    question: 'Know the priorities, need a multi-year plan',
    rationale: 'You are at Roadmap & Governance. Stand up a program, PMO, and gated roadmap.',
    to: '/learn/migration-program',
    cta: 'Start: Migration Program',
    phase: 'p4',
  },
  {
    id: 'roadmap-migrating',
    question: 'Roadmap exists — actively migrating systems',
    rationale: 'You are at Execution. Use the migration workbench to sequence waves and cutovers.',
    to: '/migrate',
    cta: 'Open: Migrate',
    phase: 'p5',
  },
  {
    id: 'unsure',
    question: 'Not sure — assess me',
    rationale: 'Run the guided readiness assessment; it routes you to the right phase and modules.',
    to: '/assess',
    cta: 'Open: Risk Assessment',
    phase: 'foundations',
  },
]

/** The frameworks the crosswalk lists, in display order. */
export const CROSSWALK_FRAMEWORKS: ReadonlyArray<{ key: keyof PhaseCrosswalk; label: string }> = [
  { key: 'nistCsf', label: 'NIST CSF 2.0' },
  { key: 'pqcc', label: 'PQCC' },
  { key: 'etsiTr103619', label: 'ETSI TR 103 619' },
  { key: 'dutchHandbook', label: 'Dutch PQC Handbook' },
]

/** "Phase 3: Risk Scoring", or "Phase —: Foundations" for the unnumbered Foundations phase. */
export function phaseHeading(phase: PhaseId): string {
  const p = FRAMEWORK_PHASES[phase]
  return `Phase ${p?.number ?? '—'}: ${p?.name}`
}

/** One crosswalk row: a framework's name and what it calls this phase. */
export interface CrosswalkRow {
  key: keyof PhaseCrosswalk
  label: string
  text: string
}

/** What each listed framework calls this phase, as display text. Empty when the phase is unknown. */
export function crosswalkRows(phase: PhaseId): CrosswalkRow[] {
  const crosswalk = FRAMEWORK_PHASES[phase]?.crosswalk
  if (!crosswalk) return []
  return CROSSWALK_FRAMEWORKS.map(({ key, label }) => {
    const value = crosswalk[key]
    return { key, label, text: Array.isArray(value) ? value.join(', ') : value }
  })
}

/** The footer line naming where the routing and the crosswalk come from. */
export function routingSourceNote(): string {
  return `Routing follows Applied Quantum App. B; crosswalk reads App. G (${PHASE_ORDER.length} phases) from the canonical framework model.`
}

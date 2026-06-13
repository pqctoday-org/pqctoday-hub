// SPDX-License-Identifier: GPL-3.0-only
import type { CSWP39StepId } from '@/components/shared/CSWP39StepBadge'
import type { PhaseId } from './frameworkPhases'

/**
 * Maps an /assess wizard step key to the CSWP.39 process step it primarily
 * contributes to. Used by the CSWP39StepBadge rendered next to the wizard
 * step indicator so users see how each input feeds the Command Center
 * (Govern → Inventory → Identify Gaps → Prioritise → Implement).
 *
 * Some steps span multiple CSWP.39 steps (e.g., sensitivity feeds both
 * Inventory metadata and Identify Gaps prioritisation). The mapping picks
 * the primary affiliation; the resource panels on /business surface the
 * cross-references.
 *
 * Each step is also tagged with the Applied Quantum migration `frameworkPhase`
 * (see `./frameworkPhases.ts`) its data primarily advances. Assess inputs feed
 * scoping/discovery (p0/p1), risk inputs (p3), planning (p4), infrastructure
 * gaps (p6), or the spanning Foundations band (reg-mapping, crypto-agility).
 */
export interface AssessStepMapping {
  /** CSWP.39 process step this wizard step primarily contributes to. */
  cswp39: CSWP39StepId
  /** Applied Quantum migration phase this step's data primarily advances. */
  frameworkPhase: PhaseId
}

export const ASSESS_STEP_MAPPINGS: Record<string, AssessStepMapping> = {
  // Org context & scoping → Executive Mandate (org-context-intake / initial-scoping).
  industry: { cswp39: 'govern', frameworkPhase: 'p0' },
  country: { cswp39: 'govern', frameworkPhase: 'p0' },
  // Cryptographic estate inputs → Discovery & Inventory.
  crypto: { cswp39: 'inventory', frameworkPhase: 'p1' },
  // Sensitivity is an inventory attribute but primarily drives HNDL risk scoring.
  sensitivity: { cswp39: 'inventory', frameworkPhase: 'p3' },
  // Regulatory obligations → spanning Foundations reg-mapping.
  compliance: { cswp39: 'govern', frameworkPhase: 'foundations' },
  // Migration posture feeds the roadmap/planning track.
  migration: { cswp39: 'implement', frameworkPhase: 'p4' },
  'use-cases': { cswp39: 'inventory', frameworkPhase: 'p1' },
  // Data retention windows feed the HNDL risk horizon (risk scoring).
  retention: { cswp39: 'inventory', frameworkPhase: 'p3' },
  // Credential lifetimes feed the exposure window used in risk scoring.
  'credential-lifetime': { cswp39: 'inventory', frameworkPhase: 'p3' },
  scale: { cswp39: 'prioritise', frameworkPhase: 'p3' },
  // Crypto-agility maturity → spanning Foundations band.
  agility: { cswp39: 'implement', frameworkPhase: 'foundations' },
  // Infrastructure readiness gaps → Infrastructure & Performance.
  infra: { cswp39: 'identify-gaps', frameworkPhase: 'p6' },
  timeline: { cswp39: 'prioritise', frameworkPhase: 'p3' },
}

/**
 * Back-compat view: the wizard-step → CSWP.39-step map, derived from
 * {@link ASSESS_STEP_MAPPINGS}. Consumers that only need the CSWP.39 step
 * (e.g. the CSWP39StepBadge) read this unchanged shape.
 */
export const ASSESS_STEP_TO_CSWP39: Record<string, CSWP39StepId> = Object.fromEntries(
  Object.entries(ASSESS_STEP_MAPPINGS).map(([step, { cswp39 }]) => [step, cswp39])
)

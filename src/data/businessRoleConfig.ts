// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Shared "recommended start sequence" for the Business Center, per persona.
 *
 * Before the 2026-09-07 Executive/GRC split, every Business Center surface
 * (BusinessToolsGrid's "Start with the essentials" banner, BusinessCenterView
 * and MobileCommandCenterView's WelcomeState "top tools") hard-coded the SAME
 * generic, executive-flavored tool sequence and showed it to every visitor
 * regardless of persona — a developer or a curious visitor saw "Business
 * case → Risk → Governance → Roadmap → Verify" with no connection to their
 * own path. This file centralizes the two sequences the split plan calls
 * out explicitly (executive-grc-split-plan.md §D) so every consumer reads
 * the same data instead of re-typing it with the risk of drifting apart.
 *
 * Every tool id here is validated against `businessToolsRegistry.tsx` by
 * `businessRoleConfig.test.ts` — a typo'd id fails the build, not silently
 * renders a missing card.
 */
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import type { PersonaId } from './learningPersonas'

export interface BusinessRoleStep {
  /** 1-based position in the recommended sequence. */
  step: number
  /** Short label for the compact chip/pill UI. */
  label: string
  /** Real id from businessToolsRegistry.tsx. */
  id: string
}

export interface BusinessRoleSequence {
  /** Heading shown above the sequence banner. */
  heading: string
  /** One-line guidance on what building the sequence in order gets you. */
  guidance: string
  steps: BusinessRoleStep[]
}

export const EXECUTIVE_SEQUENCE: BusinessRoleSequence = {
  heading: 'New here? Fund and sponsor the program',
  guidance: 'Build these in order to reach a board-ready package.',
  steps: [
    { step: 1, label: 'Charter', id: 'program-charter' },
    { step: 2, label: 'Business case', id: 'roi-calculator' },
    { step: 3, label: 'Governance', id: 'raci-builder' },
    { step: 4, label: 'Roadmap', id: 'roadmap-builder' },
    { step: 5, label: 'Board deck', id: 'board-pitch' },
  ],
}

export const GRC_SEQUENCE: BusinessRoleSequence = {
  heading: 'New here? Scope, record, and verify',
  guidance: 'Build these in order to reach an audit-ready record.',
  steps: [
    { step: 1, label: 'Checklist', id: 'compliance-checklist' },
    { step: 2, label: 'Risk register', id: 'risk-register' },
    { step: 3, label: 'Treatment plan', id: 'risk-treatment-plan' },
    { step: 4, label: 'Vendor evidence', id: 'vendor-scorecard' },
    { step: 5, label: 'Audit checklist', id: 'audit-checklist' },
    { step: 6, label: 'Verify closure', id: 'migration-verification' },
  ],
}

/**
 * The generic sequence every OTHER persona (and no-persona visitors) sees —
 * this is the literal sequence every Business Center surface hard-coded
 * before the split; kept as the explicit fallback rather than silently
 * defaulting to Executive's, which would misrepresent it as executive-only
 * content available to everyone.
 */
export const GENERIC_SEQUENCE: BusinessRoleSequence = {
  heading: 'New here? Start with the essentials',
  guidance: 'Build these in order, or jump straight to the full tool set below.',
  steps: [
    { step: 1, label: 'Business case', id: 'roi-calculator' },
    { step: 2, label: 'Risk', id: 'risk-register' },
    { step: 3, label: 'Governance', id: 'raci-builder' },
    { step: 4, label: 'Roadmap', id: 'roadmap-builder' },
    { step: 5, label: 'Verify', id: 'migration-verification' },
  ],
}

/**
 * Developer / Engineer: the four Command Center tools the Developer home
 * board already links to, in the order an engineer uses them — find the call
 * sites, record them as a CBOM, check what the change must satisfy, then
 * verify it. Without this Developers got GENERIC_SEQUENCE, which starts at
 * the ROI calculator.
 */
export const DEVELOPER_SEQUENCE: BusinessRoleSequence = {
  heading: 'New here? From call sites to a verified change',
  guidance: 'Build these in order to reach a reviewable engineering record.',
  steps: [
    { step: 1, label: 'Refactor audit', id: 'crypto-api-refactor-audit' },
    { step: 2, label: 'CBOM', id: 'crypto-cbom-builder' },
    { step: 3, label: 'Requirements', id: 'compliance-checklist' },
    { step: 4, label: 'Verify', id: 'migration-verification' },
  ],
}

/**
 * Researcher / Academic: the researcher's questions are answered by the
 * Library, the Playground, Threats and Patents rather than by Command Center
 * deliverables, so the sequence holds only the two existing tools a
 * researcher would open — the CRQC scenario model behind the threat timeline
 * (also the researcher board's threat-model CTA) and the CVE digest. Without
 * this researchers got GENERIC_SEQUENCE, which starts at the ROI calculator.
 */
export const RESEARCHER_SEQUENCE: BusinessRoleSequence = {
  heading: 'New here? Test the threat model',
  guidance: 'Two tools that let you vary the assumptions behind the dates.',
  steps: [
    { step: 1, label: 'CRQC scenarios', id: 'crqc-scenario' },
    { step: 2, label: 'CVE watch', id: 'crypto-vulnerability-watch' },
  ],
}

const BUSINESS_ROLE_SEQUENCES: Partial<Record<PersonaId, BusinessRoleSequence>> = {
  executive: EXECUTIVE_SEQUENCE,
  grc: GRC_SEQUENCE,
  developer: DEVELOPER_SEQUENCE,
  researcher: RESEARCHER_SEQUENCE,
}

/** Resolve the recommended sequence for a persona, falling back to the
 *  persona-neutral generic sequence for every role without one of its own. */
export function getBusinessRoleSequence(persona: PersonaId | null): BusinessRoleSequence {
  if (!persona) return GENERIC_SEQUENCE
  // eslint-disable-next-line security/detect-object-injection -- persona is a typed PersonaId union, not user input
  return BUSINESS_ROLE_SEQUENCES[persona] ?? GENERIC_SEQUENCE
}

const VALID_TOOL_IDS = new Set(BUSINESS_TOOLS.map((t) => t.id))

/** True if `id` is a real tool id in businessToolsRegistry.tsx. */
export function isValidBusinessToolId(id: string): boolean {
  return VALID_TOOL_IDS.has(id)
}

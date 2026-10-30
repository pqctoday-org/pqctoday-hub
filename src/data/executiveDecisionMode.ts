// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Executive home "decision mode" (design note 16 Oct 2026, owner-approved).
 *
 * For the executive role only, each of the six board questions shows ONE next
 * step and ONE "after that" link; everything else on the board folds under
 * "More for this question". This table is the whole of that choice.
 *
 * Owner decision 3: once the board pack includes figure sources, the Evidence
 * board opens that worked example. Content revisions remain one step away.
 *
 * Every href is checked against the app's real routes and Command Center tool
 * ids in executiveDecisionMode.test.ts.
 */
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'

export interface ExecutiveDecisionStep {
  /** The one thing to do next — the board's primary action. */
  nextLabel: string
  nextHref: string
  /** The one link offered after it. */
  afterLabel: string
  afterHref: string
}

export const EXECUTIVE_DECISION_STEPS: Readonly<Record<string, ExecutiveDecisionStep>> = {
  mandate: {
    nextLabel: 'Draft the program charter',
    nextHref: '/business/tools/program-charter',
    afterLabel: 'Run the 3-minute assessment',
    afterHref: '/assess',
  },
  deadlines: {
    nextLabel: 'Build your compliance timeline',
    nextHref: '/business/tools/compliance-timeline',
    afterLabel: 'See every regulatory deadline',
    afterHref: '/timeline?deadlines=1',
  },
  risk: {
    nextLabel: 'Start your risk register',
    nextHref: '/business/tools/risk-register',
    afterLabel: 'See an example risk report',
    afterHref: '/report?example=1',
  },
  roadmap: {
    nextLabel: 'Build your migration roadmap',
    nextHref: '/business/tools/roadmap-builder',
    afterLabel: 'Check what regulators require',
    afterHref: '/compliance',
  },
  evidence: {
    nextLabel: 'Inspect a sample board pack',
    nextHref: '/report?example=1',
    afterLabel: 'See what changed and why',
    afterHref: '/revisions',
  },
  verify: {
    nextLabel: 'Draft your board pitch',
    nextHref: '/business/tools/board-pitch',
    afterLabel: 'Watch the executive walkthrough',
    afterHref: '/simulation?run=exec',
  },
}

/**
 * The decision-mode step for a board, or null when decision mode does not
 * apply (flag off, another role, or a variant with no entry).
 */
export function executiveDecisionStep(
  personaId: PersonaId,
  variantId: string,
  enabled: boolean
): ExecutiveDecisionStep | null {
  if (!enabled || personaId !== 'executive') return null
  return Object.prototype.hasOwnProperty.call(EXECUTIVE_DECISION_STEPS, variantId)
    ? // eslint-disable-next-line security/detect-object-injection -- own-property checked above
      EXECUTIVE_DECISION_STEPS[variantId]
    : null
}

/** Modules on the role's full path, not counting the closing quiz. */
export function fullPathModuleCount(personaId: PersonaId): number {
  // eslint-disable-next-line security/detect-object-injection -- personaId is the typed PersonaId union
  return PERSONAS[personaId].recommendedPath.filter((id) => id !== 'quiz').length
}

/** 130 -> "2 hours 10", 60 -> "1 hour", 45 -> "45 minutes". */
export function formatTrackMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} minutes`
  const hours = `${h} ${h === 1 ? 'hour' : 'hours'}`
  return m === 0 ? hours : `${hours} ${m}`
}

/** Where "Full path, optional" goes: the Learn page's own path view. */
export const FULL_PATH_HREF = '/learn?mode=mypath'

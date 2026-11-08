// SPDX-License-Identifier: AGPL-3.0-only
import { ANNUAL_BREACH_PROBABILITY_PCT, type OrgSizeTier } from '@/data/roiBaselines'

export type BreachProbabilityOrigin =
  'source-anchor' | 'model-anchor' | 'learner-assumption' | 'restored-unrecorded'

export const BREACH_PROBABILITY_ORIGIN_LABELS = {
  'source-anchor': 'Source reference anchor (IRIS 2025, Figure 6)',
  'model-anchor': 'Model-derived tier anchor (IRIS 2025, Figure 7)',
  'learner-assumption': 'Learner assumption — not a source-verified probability',
  'restored-unrecorded': 'Restored scenario input — origin unrecorded',
} as const
export type BreachProbabilityOriginLabel =
  (typeof BREACH_PROBABILITY_ORIGIN_LABELS)[BreachProbabilityOrigin]
export const BREACH_PROBABILITY_SOURCE_URL =
  'https://www.cyentia.com/wp-content/uploads/2026/03/IRIS-2025.pdf'

function anchorProbability(tier: OrgSizeTier): number {
  switch (tier) {
    case 'smb':
      return ANNUAL_BREACH_PROBABILITY_PCT.smb
    case 'fortune1000':
      return ANNUAL_BREACH_PROBABILITY_PCT.fortune1000
    default:
      return ANNUAL_BREACH_PROBABILITY_PCT.average
  }
}

function originLabel(origin: BreachProbabilityOrigin): BreachProbabilityOriginLabel {
  switch (origin) {
    case 'source-anchor':
      return BREACH_PROBABILITY_ORIGIN_LABELS['source-anchor']
    case 'model-anchor':
      return BREACH_PROBABILITY_ORIGIN_LABELS['model-anchor']
    case 'learner-assumption':
      return BREACH_PROBABILITY_ORIGIN_LABELS['learner-assumption']
    default:
      return BREACH_PROBABILITY_ORIGIN_LABELS['restored-unrecorded']
  }
}

export function anchorOrigin(tier: OrgSizeTier): BreachProbabilityOrigin {
  return tier === 'average' ? 'source-anchor' : 'model-anchor'
}

export function restoredProbabilityOrigin(
  savedOrigin: unknown,
  value: number,
  tier: OrgSizeTier,
  hadRecordedValue: boolean
): BreachProbabilityOrigin {
  if (!hadRecordedValue) return anchorOrigin(tier)
  if (savedOrigin === 'learner-assumption' || savedOrigin === 'restored-unrecorded')
    return savedOrigin
  if (savedOrigin === anchorOrigin(tier) && value === anchorProbability(tier))
    return anchorOrigin(tier)
  return 'restored-unrecorded'
}

export interface BreachProbabilityProvenance {
  activeProbabilityPct: number
  origin: BreachProbabilityOrigin
  originLabel: BreachProbabilityOriginLabel
  referenceTier: OrgSizeTier
  referenceProbabilityPct: number
  referenceKind: 'source-anchor' | 'model-anchor'
  referenceFigure: 'Figure 6' | 'Figure 7'
  referenceSourceUrl: string
}

export function probabilityProvenance(
  value: number,
  tier: OrgSizeTier,
  origin: BreachProbabilityOrigin
): BreachProbabilityProvenance {
  return {
    activeProbabilityPct: value,
    origin,
    originLabel: originLabel(origin),
    referenceTier: tier,
    referenceProbabilityPct: anchorProbability(tier),
    referenceKind: tier === 'average' ? 'source-anchor' : 'model-anchor',
    referenceFigure: tier === 'average' ? 'Figure 6' : 'Figure 7',
    referenceSourceUrl: BREACH_PROBABILITY_SOURCE_URL,
  }
}

export function probabilityProvenanceMarkdown(value: BreachProbabilityProvenance): string {
  return `## Annual probability provenance\n\nActive scenario input: ${value.activeProbabilityPct}% — ${value.originLabel}.\n\nReference anchor (${value.referenceTier}; ${value.referenceKind === 'source-anchor' ? 'historical typical-firm source reference' : 'existing Hub model-derived tier mapping'}): ${value.referenceProbabilityPct}%. [Cyentia IRIS 2025, ${value.referenceFigure}](${value.referenceSourceUrl}).\n\nThe citation describes the reference anchor, not an edited or restored input. It concerns historical significant incidents, not an organization-specific breach forecast. Neither the reference nor a scenario assumption establishes this fictional organization's probability.\n\n`
}

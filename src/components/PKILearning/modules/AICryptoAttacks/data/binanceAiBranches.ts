// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Local AI causal-role overlay for the three preparation branches of the
 * 29 October 2026 Binance security incident.
 *
 * Chronology, actor names, source IDs, impact figures, and official attribution
 * are imported directly from the shared canonical record so Module A1 and Module AI
 * can never diverge or restate independent incident prose.
 */
import {
  BINANCE_INCIDENT_ATTRIBUTION,
  BINANCE_INCIDENT_IMPACT,
  BINANCE_INCIDENT_SOURCE_IDS,
  getBinanceIncidentStage,
  type BinanceAiBranchStageId,
  type BinanceIncidentCausalRole,
  type BinanceIncidentStage,
} from '@/data/canonicalBinanceIncident'

export interface BinanceAiBranch {
  readonly stageId: BinanceAiBranchStageId
  readonly claimId: 'AI-2.4a' | 'AI-2.4b' | 'AI-2.4c'
  readonly causalRole: BinanceIncidentCausalRole
  readonly stage: BinanceIncidentStage
}

export const BINANCE_AI_BRANCHES: readonly BinanceAiBranch[] = [
  {
    stageId: 'engineer-a-supply-chain',
    claimId: 'AI-2.4a',
    causalRole: 'none shown',
    stage: getBinanceIncidentStage('engineer-a-supply-chain'),
  },
  {
    stageId: 'engineer-b-social-engineering',
    claimId: 'AI-2.4b',
    causalRole: 'not stated',
    stage: getBinanceIncidentStage('engineer-b-social-engineering'),
  },
  {
    stageId: 'internal-ai-tool-pivot',
    claimId: 'AI-2.4c',
    causalRole: 'tool-mediated',
    stage: getBinanceIncidentStage('internal-ai-tool-pivot'),
  },
] as const

export {
  BINANCE_INCIDENT_ATTRIBUTION,
  BINANCE_INCIDENT_IMPACT,
  BINANCE_INCIDENT_SOURCE_IDS,
  getBinanceIncidentStage,
  type BinanceAiBranchStageId,
  type BinanceIncidentCausalRole,
}

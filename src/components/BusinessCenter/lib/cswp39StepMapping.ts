// SPDX-License-Identifier: GPL-3.0-only
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'
import type { BusinessMetrics } from '../hooks/useBusinessMetrics'
import type { CSWP39StepId } from './cswp39Tier'
import type { PillarKey } from '../hooks/useBusinessMetrics'

/** Artifact types surfaced under each CSWP.39 step on the Command Center.
 *  Note: `trackedFrameworks` (registry) is implicitly Govern; framework deadline
 *  urgency is rendered under Prioritise. `roi-model` and `board-deck` are
 *  intentionally absent — they're surfaced in the Action Items top strip. */
export const STEP_ARTIFACT_TYPES: Record<CSWP39StepId, ExecutiveDocumentType[]> = {
  govern: [
    'policy-draft',
    'raci-matrix',
    'stakeholder-comms',
    'audit-checklist',
    'compliance-checklist',
    'contract-clause',
  ],
  inventory: ['supply-chain-matrix'],
  'identify-gaps': ['risk-register', 'vendor-scorecard'],
  prioritise: ['kpi-dashboard', 'kpi-tracker', 'compliance-timeline', 'crqc-scenario'],
  implement: ['risk-treatment-plan', 'migration-roadmap', 'deployment-playbook'],
}

/** Reverse lookup so ArtifactCard receives the legacy pillar prop without
 *  threading it through every call site. */
const PILLAR_FOR_TYPE: Record<ExecutiveDocumentType, PillarKey> = {
  'risk-register': 'risk',
  'risk-treatment-plan': 'risk',
  'roi-model': 'risk',
  'board-deck': 'risk',
  'crqc-scenario': 'risk',
  'audit-checklist': 'compliance',
  'compliance-checklist': 'compliance',
  'compliance-timeline': 'compliance',
  'raci-matrix': 'governance',
  'policy-draft': 'governance',
  'kpi-dashboard': 'governance',
  'stakeholder-comms': 'governance',
  'vendor-scorecard': 'vendor',
  'contract-clause': 'vendor',
  'migration-roadmap': 'vendor',
  'kpi-tracker': 'vendor',
  'supply-chain-matrix': 'vendor',
  'deployment-playbook': 'vendor',
}

export function getPillarForType(type: ExecutiveDocumentType): PillarKey {
  return PILLAR_FOR_TYPE[type]
}

export function getArtifactsForStep(
  metrics: BusinessMetrics,
  stepId: CSWP39StepId
): ExecutiveDocument[] {
  const types = new Set<ExecutiveDocumentType>(STEP_ARTIFACT_TYPES[stepId])
  const all = [
    ...metrics.artifactsByPillar.risk,
    ...metrics.artifactsByPillar.compliance,
    ...metrics.artifactsByPillar.governance,
    ...metrics.artifactsByPillar.vendor,
  ]
  return all.filter((d) => types.has(d.type))
}

/** Re-orders artifacts so persona-featured types come first, preserving creation
 *  order within each tier. Unlisted types render after, in their original order. */
export function orderByFeatured(
  artifacts: ExecutiveDocument[],
  featured: ExecutiveDocumentType[] | undefined
): ExecutiveDocument[] {
  if (!featured || featured.length === 0) return artifacts
  const featuredSet = new Set(featured)
  const featuredArts = artifacts.filter((a) => featuredSet.has(a.type))
  const rest = artifacts.filter((a) => !featuredSet.has(a.type))
  // Sort featured artifacts by their position in the featured array.
  featuredArts.sort((a, b) => featured.indexOf(a.type) - featured.indexOf(b.type))
  return [...featuredArts, ...rest]
}

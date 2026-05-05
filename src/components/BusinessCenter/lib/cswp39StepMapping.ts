// SPDX-License-Identifier: GPL-3.0-only
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'
import type { BusinessMetrics } from '../hooks/useBusinessMetrics'
import type { CSWP39StepId } from './cswp39Tier'
import type { ZoneId } from '@/data/cswp39ZoneData'
import { BUSINESS_TOOLS, ARTIFACT_TYPE_TO_TOOL_ID } from '../businessToolsRegistry'

/** Pillar — drives the colored "status" badge ("Not created" in red/orange/blue/
 *  green/cyan/purple) on each artifact card. Single source of truth: the
 *  PILLAR_FOR_TYPE table below. */
export type PillarKey =
  | 'risk'
  | 'compliance'
  | 'governance'
  | 'vendor'
  | 'inventory'
  | 'architecture'

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
  inventory: ['supply-chain-matrix', 'crypto-cbom', 'crypto-vulnerability-watch'],
  'identify-gaps': ['risk-register', 'vendor-scorecard'],
  prioritise: ['kpi-dashboard', 'kpi-tracker', 'compliance-timeline', 'crqc-scenario'],
  implement: ['risk-treatment-plan', 'migration-roadmap', 'deployment-playbook'],
}

/** Single source of truth for artifact-type → pillar (status colour). Drives
 *  the badge colour on `<ArtifactCard>` / `<ArtifactPlaceholder>` and the
 *  pillar-grouping in `useBusinessMetrics.ts`. */
export const PILLAR_FOR_TYPE: Record<ExecutiveDocumentType, PillarKey> = {
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
  'supply-chain-matrix': 'vendor',
  'kpi-tracker': 'governance',
  'migration-roadmap': 'architecture',
  'deployment-playbook': 'architecture',
  'crypto-architecture': 'architecture',
  // Management Tools zone artifacts. CBOM is literally an inventory artifact;
  // the tools-audit is more of a governance/ops audit, so it lands under governance.
  'management-tools-audit': 'governance',
  'crypto-cbom': 'inventory',
  'crypto-vulnerability-watch': 'risk',
}

export function getPillarForType(type: ExecutiveDocumentType): PillarKey {
  // eslint-disable-next-line security/detect-object-injection
  return PILLAR_FOR_TYPE[type]
}

function flattenAllArtifacts(metrics: BusinessMetrics): ExecutiveDocument[] {
  return [
    ...metrics.artifactsByPillar.risk,
    ...metrics.artifactsByPillar.compliance,
    ...metrics.artifactsByPillar.governance,
    ...metrics.artifactsByPillar.vendor,
    ...metrics.artifactsByPillar.inventory,
    ...metrics.artifactsByPillar.architecture,
  ]
}

export function getArtifactsForStep(
  metrics: BusinessMetrics,
  stepId: CSWP39StepId
): ExecutiveDocument[] {
  // eslint-disable-next-line security/detect-object-injection
  const types = new Set<ExecutiveDocumentType>(STEP_ARTIFACT_TYPES[stepId])
  return flattenAllArtifacts(metrics).filter((d) => types.has(d.type))
}

// ─────────────────────────────────────────────────────────────────────────────
// CSWP.39 Fig 3 zone-keyed artifact grouping
// ─────────────────────────────────────────────────────────────────────────────

/** Orphan artifact types whose zone cannot be derived from the tool registry
 *  (because the type has no corresponding tool yet). Keep this small and
 *  explicit — every entry should have a follow-up to wire a real builder. */
const ORPHAN_TYPE_ZONE: Partial<Record<ExecutiveDocumentType, ZoneId>> = {}

/** Single source of truth for artifact-type → CSWP.39 Fig 3 zone, derived from
 *  the tool registry plus the orphan override map. Computed at module load. */
export const ZONE_FOR_TYPE: Record<ExecutiveDocumentType, ZoneId> = (() => {
  const out = {} as Record<ExecutiveDocumentType, ZoneId>
  for (const [type, toolId] of Object.entries(ARTIFACT_TYPE_TO_TOOL_ID) as Array<
    [ExecutiveDocumentType, string]
  >) {
    const tool = BUSINESS_TOOLS.find((t) => t.id === toolId)
    if (tool) out[type] = tool.cswp39Zone
  }
  for (const [type, zone] of Object.entries(ORPHAN_TYPE_ZONE) as Array<
    [ExecutiveDocumentType, ZoneId]
  >) {
    out[type] = zone
  }
  return out
})()

export function getZoneForType(type: ExecutiveDocumentType): ZoneId | undefined {
  // eslint-disable-next-line security/detect-object-injection
  return ZONE_FOR_TYPE[type]
}

/** Inverse map: zone → artifact-type list, computed once at module load. */
export const ZONE_ARTIFACT_TYPES: Record<ZoneId, ExecutiveDocumentType[]> = (() => {
  const buckets: Record<ZoneId, ExecutiveDocumentType[]> = {
    governance: [],
    assets: [],
    'management-tools': [],
    'risk-management': [],
    mitigation: [],
    migration: [],
  }
  for (const [type, zone] of Object.entries(ZONE_FOR_TYPE) as Array<
    [ExecutiveDocumentType, ZoneId]
  >) {
    buckets[zone].push(type)
  }
  return buckets
})()

export function getArtifactsForZone(metrics: BusinessMetrics, zoneId: ZoneId): ExecutiveDocument[] {
  // eslint-disable-next-line security/detect-object-injection
  const types = new Set<ExecutiveDocumentType>(ZONE_ARTIFACT_TYPES[zoneId])
  return flattenAllArtifacts(metrics).filter((d) => types.has(d.type))
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

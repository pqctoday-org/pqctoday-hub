// SPDX-License-Identifier: GPL-3.0-only
import type { ScoringContext } from '@/data/trustScore/types'

export function emptyScoringContext(): ScoringContext {
  return {
    trustedSources: new Map(),
    xrefsByResource: new Map(),
    libraryEnrichments: {},
    timelineEnrichments: {},
    threatsEnrichments: {},
    manifestStatuses: new Map(),
    complianceLibraryRefs: new Map(),
    complianceTimelineRefs: new Map(),
    libraryDependencies: new Map(),
    threatModuleRefs: new Map(),
    demonstrableAlgorithms: new Set(['mlkem768', 'mldsa65']),
    communitySignals: new Map(),
  }
}

export interface ContextOverrides {
  trustedSources?: Array<[string, { trustTier: string; sourceType: string }]>
  xrefs?: Array<[string, Array<{ sourceId: string; matchMethod: string }>]>
  libraryEnrichments?: Record<string, { populatedCount: number; totalCount: number }>
  timelineEnrichments?: Record<string, { populatedCount: number; totalCount: number }>
  threatsEnrichments?: Record<string, { populatedCount: number; totalCount: number }>
  manifestStatuses?: Array<[string, 'downloaded' | 'skipped' | 'failed']>
  complianceLibraryRefs?: Array<[string, string[]]>
  complianceTimelineRefs?: Array<[string, string[]]>
  demonstrableAlgorithms?: string[]
}

export function makeScoringContext(overrides: ContextOverrides = {}): ScoringContext {
  const ctx = emptyScoringContext()
  if (overrides.trustedSources) ctx.trustedSources = new Map(overrides.trustedSources)
  if (overrides.xrefs) ctx.xrefsByResource = new Map(overrides.xrefs)
  if (overrides.libraryEnrichments) ctx.libraryEnrichments = overrides.libraryEnrichments
  if (overrides.timelineEnrichments) ctx.timelineEnrichments = overrides.timelineEnrichments
  if (overrides.threatsEnrichments) ctx.threatsEnrichments = overrides.threatsEnrichments
  if (overrides.manifestStatuses) ctx.manifestStatuses = new Map(overrides.manifestStatuses)
  if (overrides.complianceLibraryRefs)
    ctx.complianceLibraryRefs = new Map(overrides.complianceLibraryRefs)
  if (overrides.complianceTimelineRefs)
    ctx.complianceTimelineRefs = new Map(overrides.complianceTimelineRefs)
  if (overrides.demonstrableAlgorithms)
    ctx.demonstrableAlgorithms = new Set(overrides.demonstrableAlgorithms)
  return ctx
}

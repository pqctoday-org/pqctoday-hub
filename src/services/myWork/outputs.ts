// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Tracked outputs, phase 1 (decision J4, requirements O01 to O08): My work tracks what the Hub already
 * produces. Nothing is copied.
 *
 *  - A business document is referenced by the id of the document the learner's tool saved.
 *  - A Playground run is referenced by the history event it left (title and link only).
 *
 * Phase 2 (storing each tool's result) is later. Which tools produce an output is read from the tools data
 * file's output columns (`toolOutputCapability`). When the data file has no such column for a tool,
 * the answer is "not known", never a guess and never a typed list.
 */
import { TOOL_RECORD_BY_ID } from '@/data/generated/tools.generated'
import { LEARN_MODULE_BY_ID } from '@/data/generated/learnModules.generated'
import type { HistoryEvent, HistoryEventType } from '@/types/HistoryTypes'
import type { ExecutiveDocument } from '@/services/storage/types'
import { useHistoryStore } from '@/store/useHistoryStore'
import { useModuleStore } from '@/store/useModuleStore'
import type { RegisterOutputInput, TrackedOutput } from '@/store/useMyWorkStore'
import { useMyWorkStore } from '@/store/useMyWorkStore'
import type { WriteResult } from '@/store/deviceLocalJson'
export { storageWords } from './storageWords'

// ── Which tools produce an output: from the tools data file ───────────────────

export type OutputCapability =
  { known: false } | { known: true; produces: boolean; artifactType?: string }

/**
 * Whether a tool produces an output, read from its record in the tools data file (the output columns of
 * the data file, as the generator writes them: `producesArtifact` and `artifactType`). A tool the data
 * file has no column for is `known: false`: the Hub does not claim either way.
 */
export function toolOutputCapability(toolId: string): OutputCapability {
  // eslint-disable-next-line security/detect-object-injection -- toolId is looked up in our own generated map
  const record = TOOL_RECORD_BY_ID[toolId] as unknown as Record<string, unknown> | undefined
  if (!record || typeof record.producesArtifact !== 'boolean') return { known: false }
  return {
    known: true,
    produces: record.producesArtifact,
    artifactType: typeof record.artifactType === 'string' ? record.artifactType : undefined,
  }
}

// ── The outputs the Hub already holds ─────────────────────────────────────────

/** History events that are the run of a tool that left something to open again. These are the Hub's own event types. */
const RUN_EVENT_TYPES: ReadonlySet<HistoryEventType> = new Set([
  'artifact_key',
  'artifact_cert',
  'artifact_csr',
  'tls_simulation',
])

function lastSegment(route: string | undefined): string {
  if (!route) return ''
  const path = route.split(/[?#]/)[0]
  return path.split('/').filter(Boolean).pop() ?? ''
}

function routeForTool(toolId: string): string {
  // eslint-disable-next-line security/detect-object-injection -- toolId is looked up in our own generated map
  const record = TOOL_RECORD_BY_ID[toolId]
  if (!record) return ''
  if (record.kind === 'business') return `/business/tools/${toolId}`
  if (record.kind === 'playground') return `/playground/${toolId}`
  return '/playground'
}

export function outputFromHistoryEvent(event: HistoryEvent): RegisterOutputInput | null {
  if (!RUN_EVENT_TYPES.has(event.type)) return null
  const route = event.route ?? ''
  return {
    kind: 'technical',
    producer: { toolId: lastSegment(route), route },
    ref: { type: 'history-event', id: event.id },
    title: event.title,
    storage: 'link',
    runId: `run:${event.id}`,
    now: new Date(event.timestamp),
  }
}

export function outputFromExecutiveDocument(doc: ExecutiveDocument): RegisterOutputInput {
  const lesson = LEARN_MODULE_BY_ID[doc.moduleId]
  const route =
    routeForTool(doc.type) || (lesson ? `/learn/${lesson.id}?tab=workshop` : '/business')
  return {
    kind: 'business',
    producer: { toolId: doc.type, route },
    ref: { type: 'executive-document', id: doc.id },
    title: doc.title,
    storage: 'document',
    approvalStatus: doc.approvalStatus ?? 'draft',
    // The module store keeps one document per lesson and type, so a regenerated document is the same run (A15).
    runId: `doc:${doc.moduleId}::${doc.type}`,
    now: new Date(doc.updatedAt ?? doc.createdAt),
  }
}

/** The outputs the Hub holds right now, ready to register. Pure over the two stores' state. */
export function collectExistingOutputs(
  events: readonly HistoryEvent[],
  docs: readonly ExecutiveDocument[]
): RegisterOutputInput[] {
  const out: RegisterOutputInput[] = []
  for (const e of events) {
    const o = outputFromHistoryEvent(e)
    if (o) out.push(o)
  }
  for (const d of docs) out.push(outputFromExecutiveDocument(d))
  return out
}

/** Register what the Hub already holds. Safe to run again: the second run adds nothing (O07). */
export function syncTrackedOutputs(): WriteResult<{ added: number; updated: number }> {
  const events = useHistoryStore.getState().events
  const docs = useModuleStore.getState().artifacts.executiveDocuments ?? []
  return useMyWorkStore.getState().registerOutputs(collectExistingOutputs(events, docs))
}

// ── Source gone (O08) ─────────────────────────────────────────────────────────

export type OutputSourceStatus = 'present' | 'missing'

/** Whether the thing an output points at still exists on this device. */
export function outputSourceStatus(
  output: Pick<TrackedOutput, 'ref'>,
  events: readonly HistoryEvent[] = useHistoryStore.getState().events,
  docs: readonly ExecutiveDocument[] = useModuleStore.getState().artifacts.executiveDocuments ?? []
): OutputSourceStatus {
  if (output.ref.type === 'history-event') {
    return events.some((e) => e.id === output.ref.id) ? 'present' : 'missing'
  }
  if (output.ref.type === 'executive-document') {
    return docs.some((d) => d.id === output.ref.id) ? 'present' : 'missing'
  }
  return 'present'
}

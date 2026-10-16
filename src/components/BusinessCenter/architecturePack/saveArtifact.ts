// SPDX-License-Identifier: AGPL-3.0-only
//
// Save one of the architecture pack's own artifacts. The store keys documents
// on moduleId + type, so a re-save of the same moduleId updates the existing
// document (and appends a revision) instead of replacing it.

import { useCallback } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'

/** moduleId for artifacts produced by the architecture pack panel. Decision
 * records add `:adr:<id>` so each one is its own document. */
export const ARCHITECTURE_PACK_MODULE_ID = 'architecture-pack'

export interface SaveRequest {
  type: ExecutiveDocumentType
  moduleId: string
  title: string
  data: string
  inputs: unknown
  /** Structured result, stored as the document's `output` (e.g. a run manifest). */
  output?: unknown
  revisionSummary?: string
}

export function useSaveArtifact(): (req: SaveRequest) => ExecutiveDocument['id'] {
  const add = useModuleStore((s) => s.addExecutiveDocument)
  const update = useModuleStore((s) => s.updateExecutiveDocument)
  return useCallback(
    (req) => {
      const docs = useModuleStore.getState().artifacts.executiveDocuments ?? []
      const existing = docs.find((d) => d.moduleId === req.moduleId && d.type === req.type)
      if (existing) {
        update(existing.id, {
          title: req.title,
          data: req.data,
          inputs: req.inputs,
          ...(req.output !== undefined ? { output: req.output } : {}),
          ...(req.revisionSummary ? { revisionSummary: req.revisionSummary } : {}),
        } as Partial<Omit<ExecutiveDocument, 'id'>>)
        return existing.id
      }
      const now = Date.now()
      const id = `${req.type}-${now}`
      add({
        id,
        moduleId: req.moduleId,
        type: req.type,
        title: req.title,
        data: req.data,
        inputs: req.inputs,
        ...(req.output !== undefined ? { output: req.output } : {}),
        createdAt: now,
        updatedAt: now,
        approvalStatus: 'draft',
      })
      return id
    },
    [add, update]
  )
}

// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import type { ExecutiveDocumentType } from '@/services/storage/types'

/**
 * Restore the most recently saved `inputs` blob for a given executive
 * artifact type — the read-back half of the "save with `inputs`, restore on
 * mount" pattern already used correctly by RoadmapBuilder / MigrationVerification
 * / the risk-register store. Pass this tool's `ExecutiveDocumentType` and the
 * shape you saved into `inputs`; the caller still owns writing `inputs` on
 * save (that half is inherently tool-specific).
 */
export function useSavedArtifactInputs<T>(type: ExecutiveDocumentType | undefined): T | undefined {
  const executiveDocuments = useModuleStore((s) => s.artifacts.executiveDocuments)
  return useMemo(() => {
    if (!type) return undefined
    const latest = (executiveDocuments ?? [])
      .filter((d) => d.type === type && d.inputs !== undefined)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0]
    return latest?.inputs as T | undefined
  }, [executiveDocuments, type])
}

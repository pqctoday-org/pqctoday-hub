// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'

/**
 * Every saved document of the given executive artifact type that carries an
 * `inputs` blob, newest first. Most tools only need the single latest one —
 * use `useSavedArtifactInputs` for that. Reach for this instead when a tool
 * needs to distinguish between several saved drafts of the same document
 * type (e.g. Policy Template Generator restoring a separate draft per policy
 * sub-type), so that grouping logic doesn't have to re-implement this same
 * filter+sort.
 */
export function useSavedArtifactDocuments(
  type: ExecutiveDocumentType | undefined
): ExecutiveDocument[] {
  const executiveDocuments = useModuleStore((s) => s.artifacts.executiveDocuments)
  return useMemo(() => {
    if (!type) return []
    return (executiveDocuments ?? [])
      .filter((d) => d.type === type && d.inputs !== undefined)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  }, [executiveDocuments, type])
}

/**
 * Restore the most recently saved `inputs` blob for a given executive
 * artifact type — the read-back half of the "save with `inputs`, restore on
 * mount" pattern already used correctly by RoadmapBuilder / MigrationVerification
 * / the risk-register store. Pass this tool's `ExecutiveDocumentType` and the
 * shape you saved into `inputs`; the caller still owns writing `inputs` on
 * save (that half is inherently tool-specific).
 */
export function useSavedArtifactInputs<T>(type: ExecutiveDocumentType | undefined): T | undefined {
  const docs = useSavedArtifactDocuments(type)
  return docs[0]?.inputs as T | undefined
}

/**
 * Restore the most recently saved `output` blob (the computed result, not the
 * form inputs) for a given executive artifact type. Lets a downstream tool
 * read another tool's latest computed number when it wasn't reached through a
 * linear wizard that threads the value through props directly — e.g. Board
 * Pitch Builder reading the ROI Calculator's last exported totals when opened
 * from the Simulation or Business Center instead of the Business Case wizard.
 */
export function useSavedArtifactOutput<T>(type: ExecutiveDocumentType | undefined): T | undefined {
  const docs = useSavedArtifactDocuments(type)
  return docs[0]?.output as T | undefined
}

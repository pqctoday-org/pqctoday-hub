// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'

/**
 * Several components legitimately share one `ExecutiveDocumentType` — the
 * PQC GRC workshop's KRI Cascade saves as `kpi-dashboard` and its Exception
 * Register saves as `risk-register`, each alongside a real standalone tool of
 * that same type. That was harmless while `inputs` was only ever written on an
 * explicit export by the standalone tools; once every artifact autosaves
 * (WS6), an unscoped `useSavedArtifactInputs('kpi-dashboard')` would happily
 * restore the KRI Cascade's `{ levelOf, statusOf }` into the KPI Dashboard.
 *
 * A component that shares a type therefore stamps its saved `inputs` with a
 * scope via {@link scopedArtifactInputs}, and restores with the same scope.
 * Unscoped readers (every pre-existing caller) see only unscoped writes, so
 * the added restore hooks cannot cross-contaminate a tool that was already
 * correct. The proper fix is distinct `ExecutiveDocumentType` ids for those
 * workshop steps — the route the two Skills & Team steps took in store v16
 * (`crypto-champion-roster` / `team-sizing-plan`); this keeps the remaining
 * collisions inert until they follow.
 */
interface ArtifactScopeMarker {
  __artifactScope?: unknown
}

/** Stamp a scope onto an `inputs` blob before saving it. */
export function scopedArtifactInputs<T extends object>(
  scope: string,
  inputs: T
): T & { __artifactScope: string } {
  return { ...inputs, __artifactScope: scope }
}

function artifactScopeOf(inputs: unknown): string | undefined {
  if (typeof inputs !== 'object' || inputs === null) return undefined
  const marker = (inputs as ArtifactScopeMarker).__artifactScope
  return typeof marker === 'string' ? marker : undefined
}

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
  type: ExecutiveDocumentType | undefined,
  scope?: string
): ExecutiveDocument[] {
  // Optional chain: this hook is now called from components whose tests mock
  // `useModuleStore` with a partial state, and a shared read-only hook must
  // never be the thing that throws on one.
  const executiveDocuments = useModuleStore((s) => s.artifacts?.executiveDocuments)
  return useMemo(() => {
    if (!type) return []
    return (executiveDocuments ?? [])
      .filter(
        (d) => d.type === type && d.inputs !== undefined && artifactScopeOf(d.inputs) === scope
      )
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  }, [executiveDocuments, type, scope])
}

/**
 * Restore the most recently saved `inputs` blob for a given executive
 * artifact type — the read-back half of the "save with `inputs`, restore on
 * mount" pattern already used correctly by RoadmapBuilder / MigrationVerification
 * / the risk-register store. Pass this tool's `ExecutiveDocumentType` and the
 * shape you saved into `inputs`; the caller still owns writing `inputs` on
 * save (that half is inherently tool-specific).
 */
export function useSavedArtifactInputs<T>(
  type: ExecutiveDocumentType | undefined,
  scope?: string
): T | undefined {
  const docs = useSavedArtifactDocuments(type, scope)
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

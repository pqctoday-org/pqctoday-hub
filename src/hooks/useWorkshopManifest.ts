// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useEffect, useState } from 'react'
import {
  loadManifest,
  loadFlow,
  resolveFromManifest,
  findEntry,
  findAllCompatible,
  type WorkshopFlowManifest,
  type WorkshopFlowManifestEntry,
} from '@/services/workshopFlowLoader'
import { usePersonaStore, type ExperienceLevel } from '@/store/usePersonaStore'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import type { ResolvedFlowContext, WorkshopFlow, WorkshopRegion } from '@/types/Workshop'
import type { PersonaId } from '@/data/learningPersonas'

interface UseWorkshopManifestResult {
  manifest: WorkshopFlowManifest | null
  isLoading: boolean
  error: Error | null
  /** The flow the user has chosen via Browse-all, or the auto-matched flow when no override. */
  activeEntry: WorkshopFlowManifestEntry | null
  /** Always the auto-matched entry — independent of any override. */
  matchedEntry: WorkshopFlowManifestEntry | null
  /**
   * Every manifest entry compatible with the persona context, sorted
   * most-specific first with the generic fallback last. Powers the
   * Recommended tab's inner per-flow tab bar.
   */
  compatibleEntries: WorkshopFlowManifestEntry[]
  /** Hydrated full flow JSON for the active entry. Null while loading. */
  activeFlow: WorkshopFlow | null
  /** Force-refetch the manifest (bypasses the session cache). */
  retry: () => void
}

/**
 * Loads the workshop manifest, resolves the matching flow for the active
 * persona context, and hydrates the chosen flow JSON. Honors a manual
 * override stored in `useWorkshopStore.flowOverrideId`.
 *
 * @param region Currently-picked region (from the prereq region picker).
 *               When null, no specific match runs and the generic fallback
 *               surfaces.
 */
export function useWorkshopManifest(region: WorkshopRegion | null): UseWorkshopManifestResult {
  const [manifest, setManifest] = useState<WorkshopFlowManifest | null>(null)
  const [activeFlow, setActiveFlow] = useState<WorkshopFlow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const role = usePersonaStore((s) => s.selectedPersona) as PersonaId | null
  const proficiency = usePersonaStore((s) => s.experienceLevel) as ExperienceLevel | null
  const industry = usePersonaStore((s) => s.selectedIndustry)
  const flowOverrideId = useWorkshopStore((s) => s.flowOverrideId)
  const mode = useWorkshopStore((s) => s.mode)
  const currentFlowId = useWorkshopStore((s) => s.currentFlowId)

  // Load the manifest on mount; `retryToken` re-runs with a forced refetch.
  const [retryToken, setRetryToken] = useState(0)
  useEffect(() => {
    let cancelled = false
    loadManifest(retryToken > 0)
      .then((m) => {
        if (cancelled) return
        setManifest(m)
        setError(null)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [retryToken])
  const retry = useCallback(() => {
    setIsLoading(true)
    setRetryToken((t) => t + 1)
  }, [])

  // Compute matched + active entries.
  const matchedEntry: WorkshopFlowManifestEntry | null =
    manifest && role && proficiency && industry && region
      ? resolveFromManifest(manifest, {
          role,
          proficiency,
          industry,
          region,
        } as ResolvedFlowContext)
      : (manifest?.flows.find((f) => f.isGenericFallback) ?? null)

  const overrideEntry: WorkshopFlowManifestEntry | null =
    manifest && flowOverrideId ? findEntry(manifest, flowOverrideId) : null

  // While a workshop is running / paused / recording, pin the active entry to
  // the flow that was actually started. `flowOverrideId` is session-scoped
  // (not persisted), so after a reload the persona-matched flow could differ
  // from the running one — without this pin the player would silently swap
  // workshops and restart at step 1 with foreign completedStepIds.
  const runningEntry: WorkshopFlowManifestEntry | null =
    manifest && mode !== 'idle' && currentFlowId ? findEntry(manifest, currentFlowId) : null

  const activeEntry = runningEntry ?? overrideEntry ?? matchedEntry

  // Every flow whose `match` accepts the active persona context (loose match —
  // null persona facets are treated as wildcards). Most-specific first.
  const compatibleEntries: WorkshopFlowManifestEntry[] = manifest
    ? findAllCompatible(manifest, {
        role: role ?? undefined,
        proficiency: proficiency ?? undefined,
        industry: industry ?? undefined,
        region: region ?? undefined,
      })
    : []

  // Hydrate the active flow whenever the file ref changes.
  const activeFile = activeEntry?.file ?? null
  useEffect(() => {
    if (!activeFile) return
    let cancelled = false
    loadFlow(activeFile)
      .then((flow) => {
        if (!cancelled) setActiveFlow(flow)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err)
      })
    return () => {
      cancelled = true
    }
  }, [activeFile])

  return {
    manifest,
    isLoading,
    error,
    activeEntry,
    matchedEntry,
    compatibleEntries,
    activeFlow,
    retry,
  }
}

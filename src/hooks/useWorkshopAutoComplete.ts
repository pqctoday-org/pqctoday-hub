// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useModuleStore } from '@/store/useModuleStore'
import { loadManifest, loadFlow, findEntry } from '@/services/workshopFlowLoader'
import { flattenFlow } from '@/data/workshopRegistry'
import type { WorkshopFlow, WorkshopStep } from '@/types/Workshop'
import { usePersonaStore } from '@/store/usePersonaStore'

/**
 * Subscribes to existing app stores and auto-marks workshop steps complete
 * for newly observed current-step participation, not technical verification.
 * Existing completion IDs do not record how participation was established. Manual "Mark step complete" remains
 * available; this hook just removes the friction for steps that map cleanly
 * to existing state changes.
 */
export function useWorkshopAutoComplete(): void {
  const {
    mode,
    currentFlowId,
    currentStepId,
    startedAt,
    completedStepIds,
    selectedRegion,
    markStepComplete,
  } = useWorkshopStore()
  const location = useLocation()

  const assessmentStatus = useAssessmentFormStore((s) => s.assessmentStatus)
  const libraryBookmarks = useBookmarkStore((s) => s.libraryBookmarks)
  const myTimelineCountries = useBookmarkStore((s) => s.myTimelineCountries)
  const moduleProgress = useModuleStore((s) => s.modules)
  const role = usePersonaStore((s) => s.selectedPersona)
  const proficiency = usePersonaStore((s) => s.experienceLevel)
  const industry = usePersonaStore((s) => s.selectedIndustry)

  const sources: SignalSources = {
    assessmentStatus,
    libraryBookmarks,
    myTimelineCountries,
    moduleProgress,
  }
  const runKey = JSON.stringify([currentFlowId, startedAt])
  const observationKey = JSON.stringify([
    runKey,
    currentStepId,
    selectedRegion,
    industry,
    role,
    proficiency,
  ])
  const baseline = useRef<{
    key: string
    sources: SignalSources
    flowObserved: boolean
    onResource: boolean
  } | null>(null)

  // Capture before asynchronous flow hydration. Remount/resume conservatively
  // starts a new observation window; earlier participation remains manual.
  useLayoutEffect(() => {
    if (mode !== 'running' || !currentFlowId || !currentStepId) {
      baseline.current = null
    } else if (baseline.current?.key !== observationKey) {
      baseline.current = {
        key: observationKey,
        sources: snapshot(sources),
        flowObserved: false,
        onResource: false,
      }
    }
  })

  const [loaded, setLoaded] = useState<{ runKey: string; flow: WorkshopFlow } | null>(null)
  useEffect(() => {
    if (mode !== 'running' || !currentFlowId) return
    let cancelled = false
    void (async () => {
      const manifest = await loadManifest().catch(() => null)
      if (cancelled || !manifest) return
      const entry = findEntry(manifest, currentFlowId)
      if (!entry) return
      const flow = await loadFlow(entry.file).catch(() => null)
      if (!cancelled && flow) setLoaded({ runKey, flow })
    })()
    return () => {
      cancelled = true
    }
  }, [mode, currentFlowId, runKey])

  useEffect(() => {
    if (mode !== 'running' || !currentFlowId || !currentStepId || !selectedRegion) return
    if (!loaded || loaded.runKey !== runKey || loaded.flow.id !== currentFlowId) return
    const step = flattenFlow(
      loaded.flow,
      selectedRegion,
      industry ?? undefined,
      role ?? undefined,
      proficiency ?? undefined
    ).find((candidate) => candidate.id === currentStepId)
    const observed = baseline.current
    if (!step || !observed || observed.key !== observationKey) return
    const sources = { assessmentStatus, libraryBookmarks, myTimelineCountries, moduleProgress }
    // Events while the flow was unobserved/loading are not reliable attribution.
    if (!observed.flowObserved) {
      observed.sources = snapshot(sources)
      observed.flowObserved = true
    }
    // Work performed on another resource must not be imported on return.
    if (!onResource(step.page.route, step.page.query, location.pathname, location.search)) {
      observed.sources = snapshot(sources)
      observed.onResource = false
      return
    }
    if (!observed.onResource) {
      observed.sources = snapshot(sources)
      observed.onResource = true
    }
    if (assessmentStatus !== 'complete') observed.sources.assessmentStatus = assessmentStatus
    if (completedStepIds.includes(step.id)) return
    if (matchesSignal(step, location.pathname, location.search, sources, observed.sources)) {
      markStepComplete(step.id)
    }
  }, [
    mode,
    currentFlowId,
    currentStepId,
    selectedRegion,
    loaded,
    runKey,
    observationKey,
    completedStepIds,
    location.pathname,
    location.search,
    assessmentStatus,
    libraryBookmarks,
    myTimelineCountries,
    moduleProgress,
    role,
    proficiency,
    industry,
    markStepComplete,
  ])
}

interface SignalSources {
  assessmentStatus: string
  libraryBookmarks: string[]
  myTimelineCountries: string[]
  moduleProgress: Record<string, { completedSteps?: string[] }>
}

function snapshot(src: SignalSources): SignalSources {
  return {
    assessmentStatus: src.assessmentStatus,
    libraryBookmarks: [...src.libraryBookmarks],
    myTimelineCountries: [...src.myTimelineCountries],
    moduleProgress: Object.fromEntries(
      Object.entries(src.moduleProgress).map(([id, mod]) => [
        id,
        { completedSteps: [...(mod.completedSteps ?? [])] },
      ])
    ),
  }
}

function onResource(
  route: string,
  query: Record<string, string> | undefined,
  pathname: string,
  search: string
): boolean {
  const target = new URL(route, 'https://workshop.invalid')
  if (pathname !== target.pathname && !pathname.startsWith(target.pathname + '/')) return false
  const actual = new URLSearchParams(search)
  const expected = new URLSearchParams(target.search)
  for (const [key, value] of Object.entries(query ?? {})) expected.set(key, value)
  return [...expected].every(([key, value]) => actual.get(key) === value)
}

function newIds(current: string[], previous: string[]): number {
  const old = new Set(previous)
  return new Set(current.filter((id) => !old.has(id))).size
}

function matchesSignal(
  step: WorkshopStep,
  pathname: string,
  search: string,
  src: SignalSources,
  previous: SignalSources
): boolean {
  const sig = step.completionSignal
  if (!sig) return false
  switch (sig.kind) {
    case 'route-visited':
      return onResource(sig.route, undefined, pathname, search)
    case 'assessment-complete':
      return previous.assessmentStatus !== 'complete' && src.assessmentStatus === 'complete'
    case 'bookmark-added':
      if (sig.surface === 'library')
        return (
          pathname === '/library' && newIds(src.libraryBookmarks, previous.libraryBookmarks) > 0
        )
      if (sig.surface === 'timeline')
        return (
          pathname === '/timeline' &&
          newIds(src.myTimelineCountries, previous.myTimelineCountries) > 0
        )
      // There is no observable leaders/compliance bookmark event in these stores.
      return false
    case 'module-progress':
      return (
        (pathname === `/learn/${sig.moduleId}` || pathname.startsWith(`/learn/${sig.moduleId}/`)) &&
        newIds(
          src.moduleProgress[sig.moduleId]?.completedSteps ?? [],
          previous.moduleProgress[sig.moduleId]?.completedSteps ?? []
        ) >= sig.minSteps
      )
    case 'filter-applied':
      // A page visit does not establish that a filter was applied.
      return false
  }
}

// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
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
 * when their `completionSignal` fires. Manual "Mark step complete" remains
 * available; this hook just removes the friction for steps that map cleanly
 * to existing state changes.
 */
export function useWorkshopAutoComplete(): void {
  const { mode, currentFlowId, completedStepIds, selectedRegion, markStepComplete } =
    useWorkshopStore()
  const location = useLocation()

  const assessmentStatus = useAssessmentFormStore((s) => s.assessmentStatus)
  const libraryBookmarks = useBookmarkStore((s) => s.libraryBookmarks)
  const myThreats = useBookmarkStore((s) => s.myThreats)
  const myTimelineCountries = useBookmarkStore((s) => s.myTimelineCountries)
  // Leaders: there is no dedicated bookmark surface yet; we treat /leaders route visit as a soft signal.
  const moduleProgress = useModuleStore((s) => s.modules)
  const role = usePersonaStore((s) => s.selectedPersona)
  const proficiency = usePersonaStore((s) => s.experienceLevel)
  const industry = usePersonaStore((s) => s.selectedIndustry)

  // Hydrate the active flow from the JSON manifest whenever the running flow id
  // changes. Cached by workshopFlowLoader so this is a no-op after the first hit.
  const [activeFlow, setActiveFlow] = useState<WorkshopFlow | null>(null)
  useEffect(() => {
    if (mode !== 'running' || !currentFlowId) return
    let cancelled = false
    void (async () => {
      const manifest = await loadManifest().catch(() => null)
      if (cancelled || !manifest) return
      const entry = findEntry(manifest, currentFlowId)
      if (!entry) return
      const flow = await loadFlow(entry.file).catch(() => null)
      if (!cancelled && flow) setActiveFlow(flow)
    })()
    return () => {
      cancelled = true
    }
  }, [mode, currentFlowId])

  useEffect(() => {
    if (mode !== 'running' || !currentFlowId || !selectedRegion) return
    if (!activeFlow || activeFlow.id !== currentFlowId) return

    const steps = flattenFlow(
      activeFlow,
      selectedRegion,
      industry ?? undefined,
      role ?? undefined,
      proficiency ?? undefined
    )
    for (const step of steps) {
      if (completedStepIds.includes(step.id)) continue
      if (
        matchesSignal(step, location.pathname, {
          assessmentStatus,
          libraryBookmarks,
          myThreats,
          myTimelineCountries,
          moduleProgress,
        })
      ) {
        markStepComplete(step.id)
      }
    }
  }, [
    mode,
    currentFlowId,
    selectedRegion,
    activeFlow,
    completedStepIds,
    location.pathname,
    assessmentStatus,
    libraryBookmarks,
    myThreats,
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
  myThreats: string[]
  myTimelineCountries: string[]
  moduleProgress: Record<string, { completedSteps?: string[] }>
}

function matchesSignal(step: WorkshopStep, currentPath: string, src: SignalSources): boolean {
  const sig = step.completionSignal
  if (!sig) return false
  switch (sig.kind) {
    case 'route-visited':
      return currentPath === sig.route || currentPath.startsWith(sig.route + '/')
    case 'assessment-complete':
      return src.assessmentStatus === 'complete'
    case 'bookmark-added':
      switch (sig.surface) {
        case 'library':
          return src.libraryBookmarks.length > 0
        case 'timeline':
          return src.myTimelineCountries.length > 0
        // Threats and compliance share the threats bookmark surface here for the executive flow.
        case 'compliance':
        case 'leaders':
          return src.myThreats.length > 0
      }
      return false
    case 'module-progress': {
      const mod = src.moduleProgress[sig.moduleId]
      const count = mod?.completedSteps?.length ?? 0
      return count >= sig.minSteps
    }
    case 'filter-applied':
      // Filter detection is route-based; treated as a route-visited soft signal.
      return (
        currentPath === '/threats' || currentPath === '/leaders' || currentPath === '/compliance'
      )
  }
}

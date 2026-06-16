// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * useModuleProgress — the progress/time/navigation logic every learn module
 * currently copy-pastes (the timeSpent useEffect, tab change, workshop step
 * change, restart-confirm, and the workshop "in-progress" dot). Extracted
 * verbatim from the per-module pattern (golden master: modules/HsmPqc) so a
 * module that adopts it behaves identically.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink, useSyncDeepLink } from '@/hooks/useModuleDeepLink'

export interface UseModuleProgressOptions {
  /** ordered workshop steps (their ids drive completion + the deep-link bound) */
  steps?: { id: string }[]
  /**
   * Canonical step set the workshop "dot" is measured against — the module's
   * WORKSHOP_STEPS (the golden masters use this, NOT the UI parts). Defaults to
   * `steps`; pass the manifest's workshopSteps so the dot is decoupled from how
   * the stepper parts happen to be wired.
   */
  dotSteps?: { id: string }[]
  /** confirm() text for the workshop Reset button */
  resetLabel?: string
}

export function useModuleProgress(moduleId: string, opts: UseModuleProgressOptions = {}) {
  const steps = opts.steps ?? []
  const stepIds = steps.map((s) => s.id)

  const deepLink = getModuleDeepLink({ maxStep: Math.max(0, steps.length - 1) })
  const [activeTab, setActiveTab] = useState(deepLink.initialTab)
  const [currentPart, setCurrentPart] = useState(deepLink.initialStep)
  useSyncDeepLink(activeTab, currentPart)
  const [configKey, setConfigKey] = useState(0)
  const startTimeRef = useRef(0)
  const { updateModuleProgress, markStepComplete, modules } = useModuleStore()

  // Mark in-progress on mount; flush elapsed minutes on unmount (matches the
  // per-module effect exactly — minutes, not seconds; reads latest state).
  useEffect(() => {
    startTimeRef.current = Date.now()
    updateModuleProgress(moduleId, { status: 'in-progress', lastVisited: Date.now() })
    return () => {
      const elapsed = (Date.now() - startTimeRef.current) / 60000
      const current = useModuleStore.getState().modules[moduleId]
      updateModuleProgress(moduleId, { timeSpent: (current?.timeSpent || 0) + elapsed })
    }
  }, [updateModuleProgress, moduleId])

  // Changing tab completes the tab you're leaving (the per-module behavior).
  const handleTabChange = useCallback(
    (tab: string) => {
      markStepComplete(moduleId, activeTab)
      setActiveTab(tab)
    },
    [activeTab, markStepComplete, moduleId]
  )

  /** Jump to a tab, completing the current one (e.g. "go to Workshop" CTAs). */
  const navigateToTab = handleTabChange

  // Advancing a workshop step completes the step you leave (forward only).
  const handlePartChange = useCallback(
    (newPart: number) => {
      if (newPart > currentPart) markStepComplete(moduleId, stepIds[currentPart], currentPart)
      setCurrentPart(newPart)
    },
    [currentPart, markStepComplete, moduleId, stepIds]
  )

  /** Bump the remount key for workshop tools (used by "open at step" CTAs). */
  const bumpConfig = useCallback(() => setConfigKey((p) => p + 1), [])

  const handleReset = useCallback(
    (onConfirmed?: () => void) => {
      if (confirm(opts.resetLabel ?? 'Restart this module?')) {
        setCurrentPart(0)
        setConfigKey((p) => p + 1)
        startTimeRef.current = Date.now()
        updateModuleProgress(moduleId, { status: 'in-progress', completedSteps: [], timeSpent: 0 })
        // runs ONLY on a confirmed reset — lets the shell clear its pre-fill
        // config and a module clear FC-held cross-tab state (its onReset slot).
        onConfirmed?.()
      }
    },
    [moduleId, opts.resetLabel, updateModuleProgress]
  )

  /** Mark a specific step complete (e.g. the final "Complete Module" button). */
  const completeStep = useCallback(
    (stepId: string, index?: number) => markStepComplete(moduleId, stepId, index),
    [markStepComplete, moduleId]
  )

  const completedSteps = modules[moduleId]?.completedSteps ?? []
  // The dot tracks the canonical WORKSHOP_STEPS (golden-master source), not the
  // UI parts — falls back to `steps` when no separate set is given.
  const dotSteps = opts.dotSteps ?? steps
  const workshopDone = dotSteps.filter((s) => completedSteps.includes(s.id)).length
  /** true when the workshop is started but not finished (the tab "dot"). */
  const workshopDot = workshopDone > 0 && workshopDone < dotSteps.length

  return {
    activeTab,
    setActiveTab,
    currentPart,
    setCurrentPart,
    configKey,
    bumpConfig,
    handleTabChange,
    navigateToTab,
    handlePartChange,
    handleReset,
    completeStep,
    completedSteps,
    workshopDone,
    workshopDot,
  }
}

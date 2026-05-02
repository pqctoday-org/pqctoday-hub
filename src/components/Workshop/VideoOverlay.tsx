// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { useWorkshopOverlayStore } from '@/store/useWorkshopOverlayStore'
import {
  WORKSHOP_FLOWS,
  flattenFlow,
  findStepIndex,
  getNextStep,
  getPrevStep,
} from '@/data/workshopRegistry'
import type { WorkshopFixtures, WorkshopStep } from '@/types/Workshop'
import { VideoControlBar } from './VideoControlBar'

/**
 * Drives Video Mode — the RAF cue scheduler + the bottom control bar.
 * Visual overlays are rendered separately by `WorkshopOverlayHost`
 * (mounted in MainLayout) which is shared with Workshop Mode's
 * manual cue stepper.
 */
export const VideoOverlay: React.FC = () => {
  const mode = useWorkshopStore((s) => s.mode)
  const currentFlowId = useWorkshopStore((s) => s.currentFlowId)
  const currentStepId = useWorkshopStore((s) => s.currentStepId)
  const selectedRegion = useWorkshopStore((s) => s.selectedRegion)
  const setStep = useWorkshopStore((s) => s.setStep)
  const exit = useWorkshopStore((s) => s.exit)
  const markStepComplete = useWorkshopStore((s) => s.markStepComplete)

  const applyCue = useWorkshopOverlayStore((s) => s.applyCue)
  const setCaption = useWorkshopOverlayStore((s) => s.setCaption)
  const clearOverlays = useWorkshopOverlayStore((s) => s.clearOverlays)

  const flow = useMemo(
    () => WORKSHOP_FLOWS.find((f) => f.id === currentFlowId) ?? null,
    [currentFlowId]
  )
  const steps = useMemo<WorkshopStep[]>(() => {
    if (!flow || !selectedRegion) return []
    return flattenFlow(flow, selectedRegion)
  }, [flow, selectedRegion])

  const stepIdx = currentStepId ? findStepIndex(steps, currentStepId) : -1
  const step: WorkshopStep | null = stepIdx >= 0 ? steps[stepIdx] : null

  const [fixtures, setFixtures] = useState<WorkshopFixtures>({})
  const [paused, setPaused] = useState(false)
  const startTimeRef = useRef<number>(0)
  const pausedAtRef = useRef<number | null>(null)
  const pausedAccumRef = useRef<number>(0)
  const handledIdxRef = useRef<number>(-1)
  const stepIdRef = useRef<string | null>(null)
  const restartTokenRef = useRef<number>(0)
  const [restartToken, setRestartToken] = useState(0)

  // Load fixtures from public/<flow.fixturesUrl> at video start.
  useEffect(() => {
    if (mode !== 'video') return
    if (!flow) return
    const inline = flow.fixtures
    if (inline) {
      setFixtures(inline)
      return
    }
    const url = flow.fixturesUrl
    if (!url) return
    let cancelled = false
    fetch(url)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (cancelled) return
        const clean: WorkshopFixtures = {}
        for (const [k, v] of Object.entries(data ?? {})) {
          if (k.startsWith('$') || k.startsWith('_')) continue
          if (v && typeof v === 'object') clean[k] = v as Record<string, never>
        }
        setFixtures(clean)
      })
      .catch(() => {
        // Keep fixtures empty — fill cues silently no-op.
      })
    return () => {
      cancelled = true
    }
  }, [mode, flow])

  // Initialise step on entry (or on restart): navigate, set initial caption,
  // dispatch event, reset clock and cue cursor.
  useEffect(() => {
    if (mode !== 'video' || !step) return
    if (stepIdRef.current === step.id && restartToken === restartTokenRef.current) return
    stepIdRef.current = step.id
    restartTokenRef.current = restartToken

    startTimeRef.current = performance.now()
    pausedAtRef.current = null
    pausedAccumRef.current = 0
    handledIdxRef.current = -1
    clearOverlays()
    setCaption(step.narration, true)
    setPaused(false)

    // Navigate to step page (via store-bound nav).
    applyCue(
      { tMs: 0, kind: 'navigate', route: step.page.route, query: step.page.query },
      fixtures,
      step.id
    )

    window.dispatchEvent(
      new CustomEvent('workshop-step-started', {
        detail: { stepId: step.id, index: stepIdx, total: steps.length },
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, step?.id, restartToken])

  // RAF scheduler — fires cues whose tMs has elapsed since step entry.
  useEffect(() => {
    if (mode !== 'video' || !step) return
    let raf = 0
    const cues = step.cues ?? []
    const cuesSorted = [...cues].sort((a, b) => a.tMs - b.tMs)

    const tick = (): void => {
      if (pausedAtRef.current !== null) {
        raf = requestAnimationFrame(tick)
        return
      }
      const elapsed = performance.now() - startTimeRef.current - pausedAccumRef.current
      while (handledIdxRef.current + 1 < cuesSorted.length) {
        const next = cuesSorted[handledIdxRef.current + 1]
        if (next.tMs > elapsed) break
        handledIdxRef.current += 1
        if (next.kind === 'advance') {
          advanceToNext()
          return
        }
        applyCue(next, fixtures, step.id)
      }
      if (cuesSorted.length === 0 && elapsed >= step.estMinutes * 60_000) {
        advanceToNext()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, step?.id, restartToken, fixtures])

  if (mode !== 'video' || !step) return null

  const prevStep = getPrevStep(steps, step.id)
  const nextStep = getNextStep(steps, step.id)

  const handlePauseToggle = (): void => {
    if (paused) {
      if (pausedAtRef.current !== null) {
        pausedAccumRef.current += performance.now() - pausedAtRef.current
        pausedAtRef.current = null
      }
      setPaused(false)
    } else {
      pausedAtRef.current = performance.now()
      setPaused(true)
    }
  }
  const handlePrev = (): void => {
    if (!prevStep) return
    setStep(prevStep.id)
  }
  const handleNext = (): void => advanceToNext()
  const handleSkip = (): void => advanceToNext()
  const handleRestart = (): void => setRestartToken((t) => t + 1)
  const handleExit = (): void => exit()

  return (
    <VideoControlBar
      stepIndex={stepIdx >= 0 ? stepIdx : 0}
      stepTotal={steps.length}
      paused={paused}
      canPrev={prevStep !== null}
      canNext={nextStep !== null}
      onPrev={handlePrev}
      onNext={handleNext}
      onPauseToggle={handlePauseToggle}
      onSkip={handleSkip}
      onRestart={handleRestart}
      onExit={handleExit}
    />
  )

  function advanceToNext(): void {
    if (!step) return
    markStepComplete(step.id)
    window.dispatchEvent(
      new CustomEvent('workshop-step-completed', { detail: { stepId: step.id } })
    )
    const next = getNextStep(steps, step.id)
    if (!next) {
      window.dispatchEvent(new CustomEvent('workshop-finished'))
      exit()
      return
    }
    setStep(next.id)
  }
}

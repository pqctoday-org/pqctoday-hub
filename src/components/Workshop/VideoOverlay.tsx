// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  useWorkshopStore,
  STEP_DURATION_MS,
  PRESENTATION_SPEED_MULTIPLIER,
} from '@/store/useWorkshopStore'
import { useWorkshopOverlayStore } from '@/store/useWorkshopOverlayStore'
import { flattenFlow, findStepIndex, getNextStep, getPrevStep } from '@/data/workshopRegistry'
import { useWorkshopManifest } from '@/hooks/useWorkshopManifest'
import type { WorkshopStep } from '@/types/Workshop'
import { VideoControlBar } from './VideoControlBar'

/**
 * Drives Video Mode — the RAF cue scheduler + the bottom control bar.
 * Visual overlays are rendered separately by `WorkshopOverlayHost`
 * (mounted in MainLayout) which is shared with Workshop Mode's
 * manual cue stepper.
 */
export const VideoOverlay: React.FC = () => {
  const mode = useWorkshopStore((s) => s.mode)
  const currentStepId = useWorkshopStore((s) => s.currentStepId)
  const selectedRegion = useWorkshopStore((s) => s.selectedRegion)
  const setStep = useWorkshopStore((s) => s.setStep)
  const exit = useWorkshopStore((s) => s.exit)
  const markStepComplete = useWorkshopStore((s) => s.markStepComplete)
  const playbackSpeed = useWorkshopStore((s) => s.playbackSpeed)
  const playbackMode = useWorkshopStore((s) => s.playbackMode)

  const applyCue = useWorkshopOverlayStore((s) => s.applyCue)
  const setCaption = useWorkshopOverlayStore((s) => s.setCaption)
  const clearOverlays = useWorkshopOverlayStore((s) => s.clearOverlays)

  // Hydrate the active flow from the JSON manifest (not the build-time
  // WORKSHOP_FLOWS array). The hook also reads any flowOverrideId so a
  // user-picked flow from Browse-all is honored here too.
  const { activeFlow: flow } = useWorkshopManifest(selectedRegion)
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

    // Navigate to step page (via store-bound nav). Pass the step's own cues as
    // `nextCues` so auto-scroll can target the first selector after the route
    // settles.
    applyCue(
      { tMs: 0, kind: 'navigate', route: step.page.route, query: step.page.query },
      fixtures,
      step.id,
      step.cues ?? []
    )

    window.dispatchEvent(
      new CustomEvent('workshop-step-started', {
        detail: { stepId: step.id, index: stepIdx, total: steps.length },
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, step?.id, restartToken])

  // RAF scheduler — fires cues whose scaled tMs has elapsed since step entry.
  // Each step plays for a fixed `targetMs` window (per playback-speed preset);
  // cue offsets are scaled proportionally from their authored tMs (within the
  // step's estMinutes * 60_000 timeline) into that window. So a cue authored
  // at tMs=120_000 of a 4-minute (240_000ms) step fires at:
  //   slow   → 120_000 / 240_000 * 20_000 = 10_000 ms (10s into the step)
  //   normal → 120_000 / 240_000 * 10_000 =  5_000 ms (5s into the step)
  //   fast   → 120_000 / 240_000 * 5_000  =  2_500 ms (2.5s into the step)
  useEffect(() => {
    if (mode !== 'video' || !step) return
    let raf = 0
    const cues = step.cues ?? []
    const cuesSorted = [...cues].sort((a, b) => a.tMs - b.tMs)
    const originalMs = Math.max(1, step.estMinutes * 60_000)

    // Two playback modes:
    //   preview      → step plays for fixed STEP_DURATION_MS[speed]; cue tMs scaled into that window
    //   presentation → cue tMs * (1/speedMultiplier); step duration = lastCueTMs / speedMultiplier
    const isPreview = playbackMode === 'preview'
    const targetMs = isPreview
      ? STEP_DURATION_MS[playbackSpeed]
      : Math.max(1, originalMs / PRESENTATION_SPEED_MULTIPLIER[playbackSpeed])
    const scale = isPreview
      ? STEP_DURATION_MS[playbackSpeed] / originalMs
      : 1 / PRESENTATION_SPEED_MULTIPLIER[playbackSpeed]

    const tick = (): void => {
      if (pausedAtRef.current !== null) {
        raf = requestAnimationFrame(tick)
        return
      }
      const elapsed = performance.now() - startTimeRef.current - pausedAccumRef.current
      while (handledIdxRef.current + 1 < cuesSorted.length) {
        const next = cuesSorted[handledIdxRef.current + 1]
        if (next.tMs * scale > elapsed) break
        handledIdxRef.current += 1
        if (next.kind === 'advance') {
          advanceToNext()
          return
        }
        applyCue(next, fixtures, step.id, cuesSorted.slice(handledIdxRef.current + 1))
      }
      if (cuesSorted.length === 0 && elapsed >= targetMs) {
        advanceToNext()
        return
      }
      // Safety: even with cues, never exceed the target window for the step.
      if (elapsed >= targetMs) {
        advanceToNext()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, step?.id, restartToken, fixtures, playbackSpeed])

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

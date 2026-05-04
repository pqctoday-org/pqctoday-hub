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
import type { WorkshopStep, WorkshopFixtures } from '@/types/Workshop'
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
  const ttsEnabled = useWorkshopStore((s) => s.ttsEnabled)

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
    const originalMs = Math.max(1, step.estMinutes * 60_000)

    // Two playback modes:
    //   preview      → fast tour. Skip cue timeline entirely; just dwell on
    //                  the narration caption for STEP_DURATION_MS[speed], then
    //                  advance. Compressing rich-cue steps (3 min authored)
    //                  into 10s makes clicks fire before the page renders, so
    //                  Preview is captions-only.
    //   presentation → cues fire at authored tMs * speedMultiplier; step runs
    //                  for `originalMs * speedMultiplier`. Slow (mul=2) doubles
    //                  the duration and pushes every cue out by 2×; fast
    //                  (mul=0.5) halves both.
    const isPreview = playbackMode === 'preview'
    const cuesSorted = isPreview ? [] : [...(step.cues ?? [])].sort((a, b) => a.tMs - b.tMs)
    // Voice off: cues fire on authored timing × playbackSpeed (Slow=2x, Fast=0.25x).
    // Voice on : DYNAMIC timing — captions wait until the previous caption's
    //            speech finishes + a 1.5s buffer, then fire (regardless of
    //            authored tMs). Eliminates dead air after short captions and
    //            naturally extends for long ones. Click/scroll/spotlight cues
    //            still fire on authored timing within each caption window.
    //            Estimate: 14 chars/sec at the 0.85 speech rate.
    const mul = PRESENTATION_SPEED_MULTIPLIER[playbackSpeed]
    const scale = isPreview ? 0 : mul
    const SPEECH_BUFFER_MS = 1500
    const speechMsFor = (text: string): number => Math.max(1500, (text.length / 14) * 1000)
    let captionEndAt = 0 // real-elapsed-ms when current caption's speech is expected to end
    const stripPrefix = (s: string) =>
      s.replace(
        /^\s*(?:Section|Workshop|Layer|Step|Hint|Artifact|Module|Tab)\s+\d+(?:\s*(?:\/|of|out of)\s*\d+)?\s*[:.\-—]\s*/i,
        ''
      )

    let targetMs: number
    if (isPreview) {
      targetMs = STEP_DURATION_MS[playbackSpeed]
    } else if (cuesSorted.length === 0) {
      targetMs = STEP_DURATION_MS[playbackSpeed] * 3
    } else {
      targetMs = Math.max(1, originalMs * mul)
    }

    const tick = (): void => {
      if (pausedAtRef.current !== null) {
        raf = requestAnimationFrame(tick)
        return
      }
      const elapsed = performance.now() - startTimeRef.current - pausedAccumRef.current
      while (handledIdxRef.current + 1 < cuesSorted.length) {
        const next = cuesSorted[handledIdxRef.current + 1]
        // Caption gating: voice on → wait for previous speech to finish + buffer.
        //                 voice off → authored timing.
        if (next.kind === 'caption' && ttsEnabled) {
          if (elapsed < captionEndAt + SPEECH_BUFFER_MS) break
        } else if (next.tMs * scale > elapsed) {
          break
        }
        handledIdxRef.current += 1
        if (next.kind === 'advance') {
          advanceToNext()
          return
        }
        if (next.kind === 'caption' && ttsEnabled) {
          // Schedule when this speech is expected to end.
          captionEndAt = elapsed + speechMsFor(stripPrefix(next.text))
        }
        applyCue(next, fixtures, step.id, cuesSorted.slice(handledIdxRef.current + 1))
      }
      // Step boundary: when voice on, hold the step open until current speech
      // (if any) finishes — prevents truncating the last caption.
      const speechHoldOk = !ttsEnabled || elapsed >= captionEndAt
      if (elapsed >= targetMs && speechHoldOk) {
        advanceToNext()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, step?.id, restartToken, fixtures, playbackSpeed, playbackMode, ttsEnabled])

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

// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Check,
  SkipForward,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { WorkshopCue, WorkshopFlow, WorkshopStep } from '@/types/Workshop'
import { buildStepUrl } from '@/utils/workshopDeepLink'
import { useWorkshopOverlayStore } from '@/store/useWorkshopOverlayStore'
import { useWorkshopFixtures } from '@/hooks/useWorkshopFixtures'
import {
  useWorkshopStore,
  PRESENTATION_SPEED_MULTIPLIER,
  STEP_DURATION_MS,
} from '@/store/useWorkshopStore'

interface WorkshopStepCardProps {
  step: WorkshopStep
  flow: WorkshopFlow | null
  index: number
  total: number
  isCompleted: boolean
  onBack: (() => void) | null
  onNext: (() => void) | null
  onSkip: () => void
  onMarkComplete: () => void
}

export const WorkshopStepCard: React.FC<WorkshopStepCardProps> = ({
  step,
  flow,
  index,
  total,
  isCompleted,
  onBack,
  onNext,
  onSkip,
  onMarkComplete,
}) => {
  const navigate = useNavigate()
  const [showNarration, setShowNarration] = useState(false)
  const fixtures = useWorkshopFixtures(flow)
  const applyCue = useWorkshopOverlayStore((s) => s.applyCue)
  const setCaption = useWorkshopOverlayStore((s) => s.setCaption)
  const clearOverlays = useWorkshopOverlayStore((s) => s.clearOverlays)
  const mode = useWorkshopStore((s) => s.mode)
  const playbackSpeed = useWorkshopStore((s) => s.playbackSpeed)
  const ttsEnabled = useWorkshopStore((s) => s.ttsEnabled)

  // Cues sorted, with 'advance' filtered out (step boundary, not a hint).
  const visibleCues = useMemo<WorkshopCue[]>(() => {
    const cues = step.cues ?? []
    return [...cues].sort((a, b) => a.tMs - b.tMs).filter((c) => c.kind !== 'advance')
  }, [step.cues])

  // Local cursor — `-1` means no hint shown yet; `0..length-1` is the current hint.
  // Reset whenever the active step changes by using step.id as a remount key.
  const [cueIdx, setCueIdx] = useState(-1)
  const [paused, setPaused] = useState(false)
  const [restartToken, setRestartToken] = useState(0)
  const startTimeRef = useRef<number>(0)
  const pausedAtRef = useRef<number | null>(null)
  const pausedAccumRef = useRef<number>(0)

  useEffect(() => {
    clearOverlays()
    setCaption(step.narration, true)
    setCueIdx(-1)
    setPaused(false)
  }, [step.id, step.narration, clearOverlays, setCaption])

  // Auto-navigate to the step's page on entry when in Workshop Mode.
  // (Video Mode does this via VideoOverlay; idle mode shouldn't.)
  useEffect(() => {
    if (mode !== 'running') return
    navigate(buildStepUrl(step))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, step.id, restartToken])

  // Workshop Mode RAF cue scheduler — auto-fires the step's cues at
  // playback-speed-scaled offsets so the user doesn't click "Show next hint"
  // 25× per step. Pause stops the clock; Skip cue jumps to the next cue;
  // Restart replays from cue 0. Step→step still requires manual Next.
  useEffect(() => {
    if (mode !== 'running' || visibleCues.length === 0) return
    let raf = 0
    // Voice off → authored timing × playbackSpeed. Voice on → DYNAMIC: each
    // caption waits for the previous speech to finish + buffer (see VideoOverlay
    // for the same scheduler). Eliminates dead air; absorbs long captions.
    const mul = PRESENTATION_SPEED_MULTIPLIER[playbackSpeed]
    const originalMs = Math.max(1, step.estMinutes * 60_000)
    const targetMs = Math.min(originalMs * mul, STEP_DURATION_MS[playbackSpeed] * 6)
    const SPEECH_BUFFER_MS = 1500
    const speechMsFor = (text: string): number => Math.max(1500, (text.length / 14) * 1000)
    let captionEndAt = 0
    const stripPrefix = (s: string) =>
      s.replace(
        /^\s*(?:Section|Workshop|Layer|Step|Hint|Artifact|Module|Tab)\s+\d+(?:\s*(?:\/|of|out of)\s*\d+)?\s*[:.\-—]\s*/i,
        ''
      )

    startTimeRef.current = performance.now()
    pausedAtRef.current = null
    pausedAccumRef.current = 0
    let handledIdx = -1

    const tick = (): void => {
      if (pausedAtRef.current !== null) {
        raf = requestAnimationFrame(tick)
        return
      }
      const elapsed = performance.now() - startTimeRef.current - pausedAccumRef.current
      while (handledIdx + 1 < visibleCues.length) {
        const next = visibleCues[handledIdx + 1]
        if (next.kind === 'caption' && ttsEnabled) {
          if (elapsed < captionEndAt + SPEECH_BUFFER_MS) break
        } else if (next.tMs * mul > elapsed) {
          break
        }
        handledIdx += 1
        setCueIdx(handledIdx)
        if (next.kind === 'caption' && ttsEnabled) {
          captionEndAt = elapsed + speechMsFor(stripPrefix(next.text))
        }
        applyCue(next, fixtures, step.id, visibleCues.slice(handledIdx + 1))
      }
      if (handledIdx + 1 >= visibleCues.length) return
      if (elapsed >= targetMs) return
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, step.id, restartToken, playbackSpeed, ttsEnabled])

  const openPage = (): void => {
    navigate(buildStepUrl(step))
  }

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

  const handleSkipCue = (): void => {
    // Fire the next un-fired cue immediately, advancing the timeline cursor.
    if (cueIdx + 1 >= visibleCues.length) return
    const next = cueIdx + 1
    applyCue(visibleCues[next], fixtures, step.id, visibleCues.slice(next + 1))
    setCueIdx(next)
    // Snap the elapsed clock past this cue so the RAF doesn't re-fire it.
    const targetTms = visibleCues[next].tMs * PRESENTATION_SPEED_MULTIPLIER[playbackSpeed]
    startTimeRef.current = performance.now() - targetTms - pausedAccumRef.current
  }

  const handleRestartStep = (): void => {
    clearOverlays()
    setCaption(step.narration, true)
    setCueIdx(-1)
    setPaused(false)
    setRestartToken((t) => t + 1)
  }

  const showNextHint = (): void => {
    if (cueIdx + 1 >= visibleCues.length) return
    const next = cueIdx + 1
    setCueIdx(next)
    applyCue(visibleCues[next], fixtures, step.id, visibleCues.slice(next + 1))
  }
  const showPrevHint = (): void => {
    if (cueIdx <= 0) {
      // Reset to "no hint": clear overlays, restore narration caption.
      setCueIdx(-1)
      clearOverlays()
      setCaption(step.narration, true)
      return
    }
    // Replay from start up to the previous hint to keep accumulated state coherent
    // (each cue is idempotent for caption / spotlight; click cues are applied again).
    const target = cueIdx - 1
    clearOverlays()
    setCaption(step.narration, true)
    for (let i = 0; i <= target; i++) {
      applyCue(visibleCues[i], fixtures, step.id, visibleCues.slice(i + 1))
    }
    setCueIdx(target)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-6 py-3 border-b border-border bg-card/50 shrink-0">
        <div
          className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
          aria-live="polite"
        >
          Step {index + 1} of {total} · {chapterLabel(step.chapter)} · ~{step.estMinutes} min
        </div>
        <h3 className="text-base font-semibold text-foreground mt-0.5">{step.title}</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
        <section>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Why it matters
          </div>
          <p className="text-sm text-foreground">{step.whyItMatters}</p>
        </section>

        <section>
          <Button onClick={openPage} variant="gradient" className="w-full">
            <ExternalLink size={16} className="mr-2" />
            Open this page
          </Button>
          <p className="mt-1 text-xs text-muted-foreground break-all">{buildStepUrl(step)}</p>
        </section>

        <section>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Try it
          </div>
          <ol className="space-y-1.5">
            {step.tasks.map((task, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
                <span>{task}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Expected output
          </div>
          <p className="text-sm text-foreground">{step.expectedOutput}</p>
        </section>

        <section>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs font-medium text-primary"
            onClick={() => setShowNarration((v) => !v)}
          >
            {showNarration ? 'Hide narration script' : 'Show narration script'}
          </Button>
          {showNarration && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.narration}</p>
          )}
        </section>
      </div>

      <div className="border-t border-border px-4 md:px-6 py-3 bg-card/50 shrink-0 space-y-2">
        {visibleCues.length > 0 && mode === 'running' && (
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePauseToggle}
              aria-label={paused ? 'Resume cues' : 'Pause cues'}
              className="h-8 px-2 text-xs"
            >
              {paused ? <Play size={14} className="mr-1" /> : <Pause size={14} className="mr-1" />}
              {paused ? 'Resume' : 'Pause'}
            </Button>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
              <Lightbulb size={14} className="text-primary" />
              {cueIdx < 0 ? `0 / ${visibleCues.length}` : `${cueIdx + 1} / ${visibleCues.length}`}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestartStep}
                aria-label="Restart step from first cue"
                className="h-8 px-2 text-xs"
              >
                <RotateCcw size={14} />
              </Button>
              <Button
                variant={paused ? 'gradient' : 'ghost'}
                size="sm"
                onClick={paused ? showNextHint : handleSkipCue}
                disabled={cueIdx + 1 >= visibleCues.length}
                aria-label={paused ? 'Show next hint' : 'Skip to next cue'}
                className="h-8 px-2 text-xs"
              >
                {paused ? 'Next hint' : 'Skip cue'}
                <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        )}
        {visibleCues.length > 0 && mode !== 'running' && (
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
            <Button
              variant="ghost"
              size="sm"
              onClick={showPrevHint}
              disabled={cueIdx < 0}
              aria-label="Previous hint"
              className="h-8 px-2 text-xs"
            >
              <ChevronLeft size={14} className="mr-1" />
              Prev hint
            </Button>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
              <Lightbulb size={14} className="text-primary" />
              {cueIdx < 0
                ? `${visibleCues.length} hint${visibleCues.length === 1 ? '' : 's'}`
                : `Hint ${cueIdx + 1} / ${visibleCues.length}`}
            </span>
            <Button
              variant={cueIdx + 1 < visibleCues.length ? 'gradient' : 'ghost'}
              size="sm"
              onClick={showNextHint}
              disabled={cueIdx + 1 >= visibleCues.length}
              aria-label="Show next hint"
              className="h-8 px-2 text-xs"
            >
              Show next hint
              <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack ?? undefined}
            disabled={!onBack}
            aria-label="Previous step"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Button>

          <Button variant="ghost" size="sm" onClick={onSkip} aria-label="Skip this step">
            <SkipForward size={16} className="mr-1" />
            Skip
          </Button>

          {!isCompleted && (
            <Button variant="outline" size="sm" onClick={onMarkComplete}>
              <Check size={16} className="mr-1" />
              Mark done
            </Button>
          )}

          <Button
            variant="gradient"
            size="sm"
            onClick={onNext ?? undefined}
            disabled={!onNext}
            aria-label="Next step"
          >
            Next
            <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function chapterLabel(kind: WorkshopStep['chapter']): string {
  switch (kind) {
    case 'intro':
      return 'Welcome'
    case 'prereq':
      return 'Pre-flight'
    case 'foundations':
      return 'Foundations'
    case 'region':
      return 'Region chapter'
    case 'action':
      return 'Action plan'
    case 'close':
      return 'Close'
  }
}

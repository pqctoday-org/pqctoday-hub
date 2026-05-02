// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Check,
  SkipForward,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { WorkshopCue, WorkshopFlow, WorkshopStep } from '@/types/Workshop'
import { buildStepUrl } from '@/utils/workshopDeepLink'
import { useWorkshopOverlayStore } from '@/store/useWorkshopOverlayStore'
import { useWorkshopFixtures } from '@/hooks/useWorkshopFixtures'

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

  // Cues sorted, with 'advance' filtered out (step boundary, not a hint).
  const visibleCues = useMemo<WorkshopCue[]>(() => {
    const cues = step.cues ?? []
    return [...cues].sort((a, b) => a.tMs - b.tMs).filter((c) => c.kind !== 'advance')
  }, [step.cues])

  // Local cursor — `-1` means no hint shown yet; `0..length-1` is the current hint.
  // Reset whenever the active step changes by using step.id as a remount key.
  const [cueIdx, setCueIdx] = useState(-1)
  useEffect(() => {
    clearOverlays()
    setCaption(step.narration, true)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCueIdx(-1)
  }, [step.id, step.narration, clearOverlays, setCaption])

  const openPage = (): void => {
    navigate(buildStepUrl(step))
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
        {visibleCues.length > 0 && (
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

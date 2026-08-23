// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ChevronRight, CheckCircle2, Circle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useWorkshopManifest } from '@/hooks/useWorkshopManifest'
import { useWorkshopAutoComplete } from '@/hooks/useWorkshopAutoComplete'
import { flattenFlow, findStepIndex, getNextStep, getPrevStep } from '@/data/workshopRegistry'
import { buildStepUrl, isOnStepRoute } from '@/utils/workshopDeepLink'
import type { WorkshopCompletionSignal, WorkshopStep } from '@/types/Workshop'
import { MobileSheet } from '../primitives/Sheet'
import { MobileProgress } from '../primitives/Progress'
import { mobileDockPanel } from '../mobileTokens'
import { cn } from '@/lib/utils'

/** "You will know it worked when" — expectedOutput plus the real
 *  completionSignal phrased in words, matching the handoff ("Completes when
 *  a bookmark is added on Library — the step ticks itself"). Real signal
 *  data, not invented copy — a step with no signal just shows expectedOutput
 *  plus a note that it's confirmed manually. */
function describeCompletionSignal(sig: WorkshopCompletionSignal | undefined): string | null {
  if (!sig) return null
  switch (sig.kind) {
    case 'route-visited':
      return `Completes when you open ${sig.route} — the step ticks itself.`
    case 'assessment-complete':
      return 'Completes when the assessment is finished — the step ticks itself.'
    case 'bookmark-added':
      return `Completes when a bookmark is added on ${sig.surface} — the step ticks itself.`
    case 'module-progress':
      return 'Completes as you read through the module — the step ticks itself.'
    case 'filter-applied':
      return 'Completes when you apply that filter — the step ticks itself.'
  }
}

/**
 * Handoff screens 23/24 — guided workshop dock, over real pages rather than
 * a screen of its own ("the most important adaptation in the handoff").
 * Reuses the real, already-shipped desktop workshop system end to end:
 * useWorkshopStore (mode/currentFlowId/currentStepId/completedStepIds),
 * useWorkshopManifest (the same manifest+flow hydration WorkshopPanel.tsx
 * uses), flattenFlow/findStepIndex/getNextStep/getPrevStep, and
 * useWorkshopAutoComplete for the same real completionSignal auto-ticking —
 * mounted here rather than only inside the (desktop-only) right panel, so a
 * step can still auto-complete while the user is just browsing with the dock
 * collapsed.
 *
 * Confirmed decision, 2026-08-23: per-task completion doesn't exist
 * anywhere in this codebase (desktop's own task list is static reference
 * text, no checkboxes) — the handoff's mockup implies interactive per-task
 * ticks, but building that would mean adding new state to a shared,
 * persisted, desktop-facing store. This mirrors desktop's real capability
 * instead: tasks render as a real reference list, completion is whole-step
 * (the same real completedStepIds/completionSignal desktop uses).
 *
 * "Leave the workshop" calls pause() (mode: 'running' -> 'paused'), not
 * exit() — exit() resets currentFlowId/currentStepId/completedStepIds to
 * null/empty, which would NOT keep the user's place. The dock only renders
 * for mode === 'running' (not 'paused'), so pausing correctly makes it
 * disappear while everything resumable stays in the real persisted store.
 */
export function MobileWorkshopDock() {
  const location = useLocation()
  const navigate = useNavigate()
  const mode = useWorkshopStore((s) => s.mode)
  const currentFlowId = useWorkshopStore((s) => s.currentFlowId)
  const currentStepId = useWorkshopStore((s) => s.currentStepId)
  const completedStepIds = useWorkshopStore((s) => s.completedStepIds)
  const selectedRegion = useWorkshopStore((s) => s.selectedRegion)
  const setStep = useWorkshopStore((s) => s.setStep)
  const markStepComplete = useWorkshopStore((s) => s.markStepComplete)
  const pause = useWorkshopStore((s) => s.pause)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const selectedIndustry = usePersonaStore((s) => s.selectedIndustry)
  const [expanded, setExpanded] = useState(false)

  // Real completionSignal auto-ticking — mounted unconditionally (it no-ops
  // internally unless mode === 'running') so a step can complete itself even
  // while this dock is rendering collapsed on some other page.
  useWorkshopAutoComplete()

  const { activeFlow } = useWorkshopManifest(selectedRegion)

  if (mode !== 'running' || !currentFlowId || !currentStepId) return null
  if (!activeFlow || activeFlow.id !== currentFlowId) return null

  const steps = flattenFlow(
    activeFlow,
    selectedRegion ?? 'OTHER',
    selectedIndustry ?? undefined,
    selectedPersona ?? undefined,
    experienceLevel ?? undefined
  )
  const currentIndex = findStepIndex(steps, currentStepId)
  const currentStep: WorkshopStep | null = currentIndex >= 0 ? steps[currentIndex] : null
  if (!currentStep) return null

  const isPassed = completedStepIds.includes(currentStep.id)
  const onDestination = isOnStepRoute(currentStep, location.pathname)
  const nextStep = getNextStep(steps, currentStepId)
  const prevStep = getPrevStep(steps, currentStepId)

  const goToStep = (step: WorkshopStep) => setStep(step.id)
  const handleTakeMeThere = () => {
    setExpanded(false)
    navigate(buildStepUrl(currentStep))
  }
  const handleLeave = () => {
    setExpanded(false)
    pause()
  }

  const signalCopy = describeCompletionSignal(currentStep.completionSignal)

  return (
    <>
      {!expanded && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setExpanded(true)}
          aria-expanded={expanded}
          className={cn(
            mobileDockPanel,
            'h-auto w-full items-center justify-between gap-3 rounded-t-2xl px-4 py-2.5 text-left font-normal'
          )}
          style={{ bottom: 'var(--mobile-nav-height)' }}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-extrabold uppercase tracking-wide text-primary-foreground/70">
              Workshop · Step {currentIndex + 1} of {steps.length}
            </span>
            <span className="block truncate text-[13px] font-bold text-primary-foreground">
              {currentStep.title}
            </span>
            <span className="block text-[10.5px] text-primary-foreground/80">tap to open</span>
          </span>
          {nextStep && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                goToStep(nextStep)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation()
                  goToStep(nextStep)
                }
              }}
              className="shrink-0 rounded-[8px] bg-card px-3 py-2 text-[11.5px] font-bold text-primary"
            >
              Next
            </span>
          )}
        </Button>
      )}

      <MobileSheet
        open={expanded}
        onClose={() => setExpanded(false)}
        title={`Step ${currentIndex + 1} of ${steps.length}`}
        titleId="mobile-workshop-dock-title"
        testId="mobile-workshop-dock-sheet"
      >
        <MobileProgress
          tone="accent"
          value={((currentIndex + 1) / steps.length) * 100}
          label={`${currentStep.chapter} · step ${currentIndex + 1} of ${steps.length}`}
        />

        <div className="mt-3">
          <h2 className="text-[15px] font-extrabold text-foreground">{currentStep.title}</h2>
          <p className="mt-0.5 text-[10.5px] text-muted-foreground">
            ~{currentStep.estMinutes} min
          </p>
        </div>

        <div className="mt-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-primary">
            Why it matters
          </p>
          <p className="mt-1 text-[12.5px] leading-[1.55] text-foreground/90">
            {currentStep.whyItMatters}
          </p>
        </div>

        {onDestination && (
          <p className="mt-3 flex items-center gap-1.5 text-[11.5px] font-semibold text-success">
            <CheckCircle2 size={14} aria-hidden="true" />
            You&apos;re on this step&apos;s page — work through it below.
          </p>
        )}

        {currentStep.tasks.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
              Do this on {currentStep.page.route}
            </p>
            <ul className="flex flex-col gap-1.5">
              {currentStep.tasks.map((task) => (
                <li
                  key={task}
                  className="flex min-h-[44px] items-center gap-2.5 rounded-lg border border-border/60 px-2.5 py-2"
                >
                  {isPassed ? (
                    <CheckCircle2 size={16} className="shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <Circle
                      size={16}
                      className="shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-[12.5px] text-foreground">{task}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 rounded-xl border border-border bg-muted/20 p-3">
          <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
            You&apos;ll know it worked when
          </p>
          <p className="mt-1 text-[12px] leading-[1.55] text-foreground/90">
            {currentStep.expectedOutput}
          </p>
          {signalCopy && (
            <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{signalCopy}</p>
          )}
        </div>

        {!isPassed && (
          <Button
            type="button"
            variant="outline"
            onClick={() => markStepComplete(currentStep.id)}
            className="mt-3 h-10 w-full rounded-[10px] border-border text-[12px] font-bold text-foreground"
          >
            Mark this step done
          </Button>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!prevStep}
            onClick={() => prevStep && goToStep(prevStep)}
            className="h-11 shrink-0 rounded-[10px] border-border px-3 text-[12.5px] font-bold text-foreground"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleTakeMeThere}
            className="h-11 flex-1 items-center justify-center gap-1 rounded-[10px] bg-primary text-[12.5px] font-bold text-primary-foreground"
          >
            Take me there
            <ChevronRight size={14} aria-hidden="true" />
          </Button>
          <Button
            type="button"
            disabled={!nextStep}
            onClick={() => nextStep && goToStep(nextStep)}
            className="h-11 shrink-0 rounded-[10px] bg-primary text-[12.5px] font-bold text-primary-foreground"
          >
            Next
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={handleLeave}
          className="mt-2 h-auto w-full items-center justify-center gap-1.5 p-1 text-[11px] font-semibold text-muted-foreground"
        >
          <X size={12} aria-hidden="true" />
          Leave the workshop — your place is kept
        </Button>
      </MobileSheet>
    </>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
import { useNavigate } from 'react-router'
import { Play, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useWorkshopManifest } from '@/hooks/useWorkshopManifest'
import { flattenFlow, findStepIndex } from '@/data/workshopRegistry'
import { buildStepUrl, personaRegionToWorkshop } from '@/utils/workshopDeepLink'

/**
 * Home's workshop entry point — the piece Phase 6's dock left open ("no way
 * to reach a running workshop, since nothing on mobile ever starts one").
 * Two real states, both reading the same store/hooks MobileWorkshopDock and
 * desktop's WorkshopPanel already do — no new state, no invented copy:
 *
 * - **Idle** (no workshop active): resolves the best-matching flow for the
 *   current persona context via useWorkshopManifest, the same manifest+match
 *   logic desktop's own Start button uses, and calls the real start() with
 *   the region derived from personaRegionToWorkshop — desktop's own
 *   auto-derivation for "the user hasn't picked a region explicitly" (see
 *   WorkshopPanel.tsx). No region picker here — the auto-derived default is
 *   the only path on mobile, matching Rule 3 (distill, not restate).
 * - **Paused** (mode: 'paused'): a real workshop is mid-flight but the dock
 *   is invisible for it by design (MobileWorkshopDock only renders while
 *   mode === 'running'). Without this, a paused workshop was unreachable
 *   from anywhere on mobile. Resumes via the real resume() action, which
 *   flips mode back to 'running' and makes the dock reappear.
 *
 * Renders nothing while mode is 'running' or 'video' — the dock (or, for
 * video, nothing on mobile) already owns that state; a second card here
 * would just duplicate it. Renders nothing while data is still loading or
 * no flow/region resolves, rather than a placeholder — Phase 3's own "omit
 * rows, never disable" rule for this shell.
 */
export function MobileWorkshopEntry() {
  const navigate = useNavigate()
  const mode = useWorkshopStore((s) => s.mode)
  const currentFlowId = useWorkshopStore((s) => s.currentFlowId)
  const currentStepId = useWorkshopStore((s) => s.currentStepId)
  const workshopRegion = useWorkshopStore((s) => s.selectedRegion)
  const resume = useWorkshopStore((s) => s.resume)
  const start = useWorkshopStore((s) => s.start)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const selectedIndustry = usePersonaStore((s) => s.selectedIndustry)
  const personaRegion = usePersonaStore((s) => s.selectedRegion)

  const isPaused = mode === 'paused'
  // Paused: pin to the region the workshop actually started with, so
  // flattenFlow's step ids line up with currentStepId. Idle: derive from the
  // live persona context, same as desktop's own auto-derivation.
  const manifestRegion = isPaused ? workshopRegion : personaRegionToWorkshop(personaRegion)
  const { activeFlow, activeEntry, isLoading } = useWorkshopManifest(manifestRegion)

  if (mode === 'running' || mode === 'video') return null
  if (isLoading || !activeFlow || !manifestRegion) return null

  if (isPaused) {
    if (!currentFlowId || !currentStepId || activeFlow.id !== currentFlowId) return null
    const steps = flattenFlow(
      activeFlow,
      manifestRegion,
      selectedIndustry ?? undefined,
      selectedPersona ?? undefined,
      experienceLevel ?? undefined
    )
    const idx = findStepIndex(steps, currentStepId)
    if (idx < 0) return null
    const step = steps[idx]
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => resume()}
        className="mt-5 h-auto w-full items-center justify-start gap-3 rounded-[11px] border border-primary/30 bg-primary/5 p-3.5 text-left font-normal"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Play size={15} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-primary">
            Resume workshop · step {idx + 1} of {steps.length}
          </span>
          <span className="block truncate text-[13px] font-bold text-foreground">{step.title}</span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
      </Button>
    )
  }

  // Idle — nothing running or paused yet.
  const steps = flattenFlow(
    activeFlow,
    manifestRegion,
    selectedIndustry ?? undefined,
    selectedPersona ?? undefined,
    experienceLevel ?? undefined
  )
  if (steps.length === 0) return null

  const handleStart = () => {
    start(activeFlow.id, steps[0].id, manifestRegion)
    navigate(buildStepUrl(steps[0]))
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleStart}
      className="mt-5 h-auto w-full items-center justify-start gap-3 rounded-[11px] border border-primary/30 bg-primary/5 p-3.5 text-left font-normal"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Play size={15} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-wide text-primary">
          Start a guided workshop · ~{activeEntry?.totalEstMinutes ?? activeFlow.totalEstMinutes}{' '}
          min
        </span>
        <span className="block truncate text-[13px] font-bold text-foreground">
          {activeFlow.title}
        </span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
    </Button>
  )
}

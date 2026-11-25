// SPDX-License-Identifier: AGPL-3.0-only
/**
 * What the journey adds to the top of a module page (UX handoff 6.11, 7.3):
 *  - the resume line, when the module opens with some sections already read;
 *  - the step bar, when the module is a step of the objective in focus (with Back to where the
 *    learner started);
 *  - the other-role lens, when the module is outside the learner's role path and is not a step of
 *    their objective. Nothing is hidden by it;
 *  - the mount point of the "Revised" strip.
 * The decisions are in services/journey/moduleContext.ts, tested for every persona.
 */
import { useEffect, useState } from 'react'
import { useInRouterContext, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Eyebrow, StoryButton, StickerCard } from '@/components/storybook'
import { JourneyStepBar } from './JourneyStepBar'
import { CompletePanel } from './CompletePanel'
import { RoleSwitchDialog, roleLabel } from './RoleSwitch'
import { ModuleUpdateStripMount } from './mountPoints'
import { useOpenStep } from './useJourneyNav'
import { useFocusedObjective } from '@/hooks/useJourney'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useIsEmbedded } from '@/embed/EmbedProvider'
import { moduleContext } from '@/services/journey/moduleContext'
import { resumePoint, whyThisLine } from '@/services/journey/resume'
import { LEARN_MODULE_BY_ID } from '@/data/generated/learnModules.generated'
import { useJourneyStore } from '@/store/useJourneyStore'

interface ModuleJourneyHeaderProps {
  moduleId: string
  /** The phone's compact step bar. */
  compact?: boolean
}

function ResumeLine({ moduleId }: { moduleId: string }) {
  const progress = useModuleStore((s) => s.modules[moduleId]) // eslint-disable-line security/detect-object-injection
  const location = useLocation()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)
  const [why, setWhy] = useState(false)
  const params = new URLSearchParams(location.search)
  // Only when the module opens from history: not when the learner followed a link to a section, a tab or a step.
  const fromLink =
    params.has('section') || params.has('tab') || params.has('step') || location.hash !== ''
  const point = resumePoint(moduleId, progress)
  if (dismissed || fromLink || !point) return null
  return (
    <div
      className="rounded-2xl border border-border bg-card px-4 py-3 text-sm"
      data-testid="resume-line"
    >
      <p>
        Opened where you left off:{' '}
        <Button
          type="button"
          variant="link"
          className="h-auto min-h-[44px] px-1 py-0 align-baseline font-bold"
          onClick={() => navigate({ search: `?section=${point.sectionId}` }, { replace: true })}
        >
          “{point.label}”
        </Button>
        .
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        <StoryButton variant="quiet" onClick={() => setDismissed(true)}>
          Start from the top
        </StoryButton>
        <StoryButton variant="quiet" aria-expanded={why} onClick={() => setWhy((v) => !v)}>
          Why this?
        </StoryButton>
      </div>
      {why ? <p className="mt-1 text-muted-foreground">{whyThisLine(point)}</p> : null}
    </div>
  )
}

function OtherRoleLens({
  moduleId,
  viewAs,
}: {
  moduleId: string
  viewAs: ReturnType<typeof moduleContext>['viewAs']
}) {
  const persona = usePersonaStore((s) => s.selectedPersona)
  const lesson = LEARN_MODULE_BY_ID[moduleId] // eslint-disable-line security/detect-object-injection
  const [summary, setSummary] = useState(false)
  const [switchOpen, setSwitchOpen] = useState(false)
  return (
    <StickerCard
      as="section"
      aria-label="Outside your role path"
      data-testid="other-role-lens"
      className="space-y-2"
    >
      <Eyebrow>Outside the {roleLabel(persona)} path</Eyebrow>
      <p className="text-sm">
        You opened it from All modules. It is not part of your objective. Nothing is hidden.
      </p>
      <div className="flex flex-wrap gap-2">
        <StoryButton
          variant="secondary"
          aria-expanded={summary}
          onClick={() => setSummary((v) => !v)}
        >
          Read a 3-line summary
        </StoryButton>
        {viewAs ? (
          <StoryButton variant="secondary" onClick={() => setSwitchOpen(true)}>
            View as {roleLabel(viewAs)}
          </StoryButton>
        ) : null}
      </div>
      {summary && lesson ? (
        <p className="line-clamp-3 text-sm text-muted-foreground" data-testid="lens-summary">
          {lesson.description}
        </p>
      ) : null}
      <RoleSwitchDialog open={switchOpen} onClose={() => setSwitchOpen(false)} />
    </StickerCard>
  )
}

export function ModuleJourneyHeader(props: ModuleJourneyHeaderProps) {
  // A page rendered outside a router (a stand-alone preview) has no address to read; the journey adds nothing there.
  return useInRouterContext() ? <ModuleJourneyHeaderInner {...props} /> : null
}

function ModuleJourneyHeaderInner({ moduleId, compact = false }: ModuleJourneyHeaderProps) {
  const embedded = useIsEmbedded()
  const persona = usePersonaStore((s) => s.selectedPersona)
  const focused = useFocusedObjective()
  const openStep = useOpenStep('journey')
  const setCheckpoint = useJourneyStore((s) => s.setCheckpoint)
  const [completeOpen, setCompleteOpen] = useState(false)
  const ctx = moduleContext({ moduleId, persona, focused })
  // The learner is on this step's page: keep the checkpoint on it (the store ignores an unchanged one).
  const focusedId = focused?.id
  const stepId = ctx.step?.id
  useEffect(() => {
    if (focusedId && stepId) setCheckpoint(focusedId, { stepId })
  }, [focusedId, stepId, setCheckpoint])
  // The journey adds nothing inside an embedded page, and nothing to a page that is not a lesson.
  if (embedded || !ctx.tag) return null

  return (
    <div className="space-y-3" data-testid="module-journey-header">
      {focused && ctx.step ? (
        <>
          <JourneyStepBar
            objective={focused}
            currentStepId={ctx.step.id}
            compact={compact}
            onOpenStep={(step) => openStep(focused, step)}
            onComplete={() => setCompleteOpen(true)}
          />
          <CompletePanel
            objective={focused}
            open={completeOpen}
            onClose={() => setCompleteOpen(false)}
            onGoToStep={(step) => openStep(focused, step)}
          />
        </>
      ) : null}
      {ctx.lens ? <OtherRoleLens moduleId={moduleId} viewAs={ctx.viewAs} /> : null}
      <ResumeLine moduleId={moduleId} />
      <ModuleUpdateStripMount moduleId={moduleId} />
    </div>
  )
}

// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Your journey › Objectives (UX handoff 6.3, 7.2): every objective by state, the workspace of the
 * one in focus (its step bar, the Now box, optional steps), and the new-objective flow. On a phone
 * the same content stacks in one column.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  Chip,
  Eyebrow,
  StatusChip,
  StickerCard,
  StoryButton,
  StoryRow,
  storyButtonVariants,
} from '@/components/storybook'
import { JourneyStepBar } from './JourneyStepBar'
import { ObjectiveChanges } from './ObjectiveChanges'
import { CompletePanel } from './CompletePanel'
import { NewObjectiveFlow } from './NewObjectiveFlow'
import { StepPage } from './StepPage'
import { useOpenStep } from './useJourneyNav'
import { ObjectiveWorkLine } from './mountPoints'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useFocusedObjective, useIsDone, useRoleObjectives } from '@/hooks/useJourney'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { rolePathForPersona } from '@/services/journey/rolePaths'
import { startHere } from '@/services/journey/levels'
import {
  barSteps,
  nowStep,
  optionalSteps,
  requiredProgress,
  stepStatuses,
} from '@/services/journey/stepRules'
import {
  describeStep,
  finishCondition,
  objectiveTitle,
  stepReason,
  journeyHref,
} from '@/services/journey/stepView'
import type { Objective } from '@/services/journey/types'
import { roleLabel } from './RoleSwitch'

function ObjectiveCard({ objective, focused }: { objective: Objective; focused: boolean }) {
  const isDone = useIsDone()
  const focusObjective = useJourneyStore((s) => s.focusObjective)
  const resume = useJourneyStore((s) => s.resumeObjective)
  const reopen = useJourneyStore((s) => s.reopenObjective)
  const { done, total } = requiredProgress(objective, isDone)
  const checkpointStep = objective.steps.find((s) => s.id === objective.checkpoint.stepId)
  const last = checkpointStep ? describeStep(checkpointStep, objective).title : null
  return (
    <StickerCard
      as="article"
      tone={focused ? 'highlight' : 'default'}
      data-testid="objective-card"
      data-objective={objective.id}
      className="flex flex-col gap-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        {focused ? <StatusChip status="in-focus" /> : null}
        {objective.state === 'paused' ? <StatusChip status="active" label="Paused" /> : null}
        {objective.state === 'completed' ? <StatusChip status="completed" /> : null}
      </div>
      <h3 className="text-lg font-extrabold text-heading">{objectiveTitle(objective)}</h3>
      <p className="text-sm text-muted-foreground">
        {done} of {total} required{last ? ` · Last step: ${last}` : ''}
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        {!focused ? (
          <StoryButton variant="secondary" onClick={() => focusObjective(objective.id)}>
            Focus on this
          </StoryButton>
        ) : null}
        {objective.state === 'paused' ? (
          <StoryButton variant="secondary" onClick={() => resume(objective.id)}>
            Resume
          </StoryButton>
        ) : null}
        {objective.state === 'completed' ? (
          <StoryButton variant="secondary" onClick={() => reopen(objective.id)}>
            Reopen
          </StoryButton>
        ) : null}
      </div>
    </StickerCard>
  )
}

function Group({
  title,
  items,
  focusedId,
}: {
  title: string
  items: Objective[]
  focusedId: string | null
}) {
  return (
    <section aria-label={`${title} objectives`} className="space-y-3">
      <Eyebrow>
        {title} ({items.length})
      </Eyebrow>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((o) => (
            <ObjectiveCard key={o.id} objective={o} focused={o.id === focusedId} />
          ))}
        </div>
      )}
    </section>
  )
}

function Workspace({ objective }: { objective: Objective }) {
  const isDone = useIsDone()
  const compact = useIsMobileShell()
  const pause = useJourneyStore((s) => s.pauseObjective)
  const resume = useJourneyStore((s) => s.resumeObjective)
  const reopen = useJourneyStore((s) => s.reopenObjective)
  const deferStep = useJourneyStore((s) => s.deferStep)
  const restoreStep = useJourneyStore((s) => s.restoreStep)
  const openStep = useOpenStep('journey')
  const [completeOpen, setCompleteOpen] = useState(false)
  const bar = barSteps(objective)
  const now = nowStep(objective, isDone)
  const optional = optionalSteps(objective)
  const deferred = bar.filter((s) => s.deferred)
  const statuses = stepStatuses(objective, isDone)
  const nowIndex = now ? bar.findIndex((s) => s.id === now.id) : -1
  const nowView = now ? describeStep(now, objective) : null
  const currentId =
    objective.steps.find((s) => s.id === objective.checkpoint.stepId && s.required)?.id ??
    now?.id ??
    bar[bar.length - 1]?.id ??
    ''

  return (
    <StickerCard
      as="section"
      aria-label="Objective in focus"
      data-testid="objective-workspace"
      className="space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>Objective in focus</Eyebrow>
          <h2 className="text-xl font-extrabold text-heading">{objectiveTitle(objective)}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusChip
              status={objective.state === 'completed' ? 'completed' : 'active'}
              label={objective.state === 'paused' ? 'Paused' : undefined}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {objective.state === 'active' ? (
            <>
              <StoryButton variant="secondary" onClick={() => pause(objective.id)}>
                Pause
              </StoryButton>
              <StoryButton variant="primary" onClick={() => setCompleteOpen(true)}>
                Complete…
              </StoryButton>
            </>
          ) : null}
          {objective.state === 'paused' ? (
            <StoryButton variant="primary" onClick={() => resume(objective.id)}>
              Resume
            </StoryButton>
          ) : null}
          {objective.state === 'completed' ? (
            <StoryButton variant="primary" onClick={() => reopen(objective.id)}>
              Reopen
            </StoryButton>
          ) : null}
        </div>
      </div>

      <p className="text-sm">
        <span className="font-bold text-heading">Finish: </span>
        {finishCondition(objective)}.
      </p>

      <ObjectiveChanges objective={objective} />

      {currentId ? (
        <JourneyStepBar
          objective={objective}
          currentStepId={currentId}
          compact={compact}
          onOpenStep={(step) => openStep(objective, step)}
          onComplete={() => setCompleteOpen(true)}
        />
      ) : null}

      {nowView && now ? (
        <StoryRow tone="highlight" className="space-y-1" data-testid="now-box">
          <Eyebrow>
            Now · step {nowIndex + 1} of {bar.length}
          </Eyebrow>
          <p className="text-sm text-muted-foreground">
            {nowView.groupLabel} › {nowView.title}
          </p>
          <p className="text-sm">{stepReason(objective, now, isDone)}</p>
          {objective.state === 'active' ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StoryButton variant="primary" onClick={() => openStep(objective, now)}>
                Open {nowView.title}
              </StoryButton>
              {now.kind !== 'self-assessed' ? (
                <StoryButton variant="quiet" onClick={() => deferStep(objective.id, now.id)}>
                  Put this step off in this objective
                </StoryButton>
              ) : null}
            </div>
          ) : null}
        </StoryRow>
      ) : objective.state === 'active' ? (
        <StoryRow tone="highlight" data-testid="now-box">
          <p className="text-sm">
            All required steps are done. Complete the objective when you are ready.
          </p>
        </StoryRow>
      ) : null}

      {deferred.length > 0 ? (
        <div data-testid="deferred-steps">
          <Eyebrow>Put off in this objective</Eyebrow>
          <ul className="mt-1 space-y-1.5">
            {deferred.map((s) => (
              <StoryRow
                as="li"
                key={s.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="font-semibold">{describeStep(s, objective).title}</span>
                {objective.state === 'active' ? (
                  <StoryButton variant="quiet" onClick={() => restoreStep(objective.id, s.id)}>
                    Bring it back
                  </StoryButton>
                ) : (
                  <Chip>Deferred</Chip>
                )}
              </StoryRow>
            ))}
          </ul>
          <p className="mt-1 text-sm text-muted-foreground">
            Other objectives that hold the same module still count it.
          </p>
        </div>
      ) : null}

      {optional.length > 0 ? (
        <div>
          <Eyebrow>Optional</Eyebrow>
          <ul className="mt-1 space-y-1.5">
            {optional.map((s) => {
              const v = describeStep(s, objective)
              return (
                <StoryRow
                  as="li"
                  key={s.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <Link
                    to={v.to}
                    state={{ journeyOrigin: 'journey' }}
                    className="font-semibold text-primary-legible underline underline-offset-4"
                  >
                    {v.title}
                  </Link>
                  {statuses.get(s.id) === 'completed' || isDone(s.resourceTag) ? (
                    <StatusChip status="completed" />
                  ) : (
                    <Chip>Optional</Chip>
                  )}
                </StoryRow>
              )
            })}
          </ul>
        </div>
      ) : null}

      <ObjectiveWorkLine objectiveId={objective.id} />

      <CompletePanel
        objective={objective}
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onGoToStep={(step) => openStep(objective, step)}
      />
    </StickerCard>
  )
}

export function ObjectivesView() {
  const objectives = useRoleObjectives()
  const focused = useFocusedObjective()
  const persona = usePersonaStore((s) => s.selectedPersona)
  const level = usePersonaStore((s) => s.experienceLevel)
  const isDone = useIsDone()
  const [params, setParams] = useSearchParams()
  // The form is open after the button is pressed, or while the address says `new=1` (a link from
  // the Assistant's header, or a first visit), including when that link is followed with this view open.
  const [opened, setOpened] = useState(false)
  const creating = opened || params.get('new') === '1'
  const focusObjective = useJourneyStore((s) => s.focusObjective)
  // After Cancel or Create the form unmounts with the focused control inside it; focus goes back to the button that opens it.
  const openerRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef(false)
  useEffect(() => {
    if (!creating && returnFocus.current) {
      returnFocus.current = false
      openerRef.current?.focus()
    }
  }, [creating])

  const stepParam = params.get('step')
  const objectiveParam = params.get('objective')
  const stepObjective = objectiveParam ? objectives.find((o) => o.id === objectiveParam) : undefined
  if (stepParam && stepObjective && stepObjective.steps.some((s) => s.id === stepParam)) {
    return <StepPage objective={stepObjective} stepId={stepParam} />
  }

  const active = objectives.filter((o) => o.state === 'active')
  const paused = objectives.filter((o) => o.state === 'paused')
  const completed = objectives.filter((o) => o.state === 'completed')
  const path = rolePathForPersona(persona)
  const here = path ? startHere(path.parts, level, isDone) : null

  return (
    <div className="space-y-5" data-testid="objectives-view">
      {creating ? (
        <NewObjectiveFlow
          onCancel={() => {
            returnFocus.current = true
            setOpened(false)
            setParams(
              (p) => {
                const next = new URLSearchParams(p)
                next.delete('new')
                return next
              },
              { replace: true }
            )
          }}
          onCreated={(id) => {
            focusObjective(id)
            returnFocus.current = true
            setOpened(false)
            setParams(
              (p) => {
                const next = new URLSearchParams(p)
                next.delete('objective')
                next.delete('step')
                next.delete('new')
                return next
              },
              { replace: true }
            )
          }}
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {objectives.length === 0
              ? 'Want a path? Tell us what you want to be able to do and we build the steps.'
              : 'Each role keeps its own objectives.'}
          </p>
          <StoryButton ref={openerRef} variant="primary" onClick={() => setOpened(true)}>
            {objectives.length === 0 ? 'Start an objective' : 'New objective'}
          </StoryButton>
        </div>
      )}

      {objectives.length === 0 ? (
        <StickerCard as="section" aria-label="No objective yet" data-testid="no-objective">
          <Eyebrow>No objective yet</Eyebrow>
          {persona ? (
            <>
              <p className="mt-2 text-sm">
                You are viewing as {roleLabel(persona)}. Your Role map shows the modules for this
                role
                {here ? `, starting at “${here.title}”` : ''}.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={journeyHref({ view: 'role-map' })}
                  className={storyButtonVariants({ variant: 'secondary' })}
                >
                  Open Role map
                </Link>
                {here ? (
                  <Link
                    to={`/learn/${here.id}`}
                    state={{ journeyOrigin: 'journey' }}
                    className={storyButtonVariants({ variant: 'primary' })}
                  >
                    Start here: {here.title}
                  </Link>
                ) : null}
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm">
              Open any module from All modules. Nothing is hidden. Choose a role to see a path
              first.
            </p>
          )}
        </StickerCard>
      ) : null}

      {focused ? <Workspace objective={focused} key={focused.id} /> : null}

      {objectives.length > 0 ? (
        <div className="space-y-5">
          <Group title="Active" items={active} focusedId={focused?.id ?? null} />
          <Group title="Paused" items={paused} focusedId={focused?.id ?? null} />
          <Group title="Completed" items={completed} focusedId={focused?.id ?? null} />
        </div>
      ) : null}
    </div>
  )
}

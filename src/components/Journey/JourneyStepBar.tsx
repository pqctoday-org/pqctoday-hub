// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The step bar of an objective (UX handoff 6.10): the same bar on the module page, on a step page
 * and above the Now box in the workspace. It is the shared StepBar plus the movement controls:
 * Prev, Mark complete (Undo on a phone right after marking), Next and the hint under it.
 * The rules (what Next does, what Back means) are in services/journey/stepRules.ts.
 */
import { useState } from 'react'
import { Link } from 'react-router'
import {
  StepBar,
  StoryButton,
  StatusChip,
  Eyebrow,
  storyButtonVariants,
} from '@/components/storybook'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useIsDone } from '@/hooks/useJourney'
import { lessonByTag } from '@/services/journey/lessons'
import {
  barSteps,
  COPY,
  followingStep,
  isReadingAhead,
  nextControl,
  previousStep,
  stepStatuses,
} from '@/services/journey/stepRules'
import { describeStep, objectiveTitle } from '@/services/journey/stepView'
import type { Objective, Step } from '@/services/journey/types'

interface JourneyStepBarProps {
  objective: Objective
  /** The step the page is on. */
  currentStepId: string
  /** The phone's compact row: step numbers only (the titles read to a screen reader), and Undo after Mark complete. */
  compact?: boolean
  /** Open a step. Called for Prev, Next and a click on a step. */
  onOpenStep: (step: Step) => void
  /** Open the complete panel (the last step's Next). */
  onComplete: () => void
}

export function JourneyStepBar({
  objective,
  currentStepId,
  compact = false,
  onOpenStep,
  onComplete,
}: JourneyStepBarProps) {
  const isDone = useIsDone()
  const markStepComplete = useJourneyStore((s) => s.markStepComplete)
  const unmarkStep = useJourneyStore((s) => s.unmarkStep)
  const [announce, setAnnounce] = useState('')
  const [justMarked, setJustMarked] = useState<string | null>(null)

  const bar = barSteps(objective)
  const at = bar.findIndex((s) => s.id === currentStepId)
  const current = bar[at] // eslint-disable-line security/detect-object-injection
  if (!current) return null
  const statuses = stepStatuses(objective, isDone)
  const next = nextControl(objective, currentStepId, isDone)
  const prev = previousStep(objective, currentStepId)
  const following = followingStep(objective, currentStepId)
  const currentDone = isDone(current.resourceTag)
  const canMark =
    objective.state === 'active' &&
    current.kind !== 'self-assessed' &&
    !currentDone &&
    !current.deferred
  const lesson = lessonByTag(current.resourceTag)

  const mark = () => {
    if (markStepComplete(objective.id, current.id, lesson?.contentVersion)) {
      setJustMarked(current.id)
      const unlocked = at < bar.length - 1
      setAnnounce(
        `Step ${at + 1} marked complete.${unlocked ? ' Next unlocked.' : ' You can complete the objective.'}`
      )
    }
  }
  const undo = () => {
    unmarkStep(objective.id, current.id)
    setJustMarked(null)
    setAnnounce(`Step ${at + 1} is no longer marked complete.`)
  }

  const labelFor = (s: Step) => {
    const title = describeStep(s, objective).title
    const status = statuses.get(s.id)
    const words = [title]
    if (s.deferred) words.push('Deferred')
    else if (status === 'now') words.push('Now')
    if (s.id === currentStepId) words.push('here')
    return words.join(' · ')
  }

  const nextTitle = following ? describeStep(following, objective).title : ''
  const prevTitle = prev ? describeStep(prev, objective).title : ''

  return (
    <section
      aria-label="Objective steps"
      data-testid="journey-step-bar"
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <Eyebrow>Objective</Eyebrow>
          <p className="truncate font-bold text-heading">{objectiveTitle(objective)}</p>
        </div>
        <div className="flex items-center gap-2">
          {objective.state !== 'active' ? (
            <StatusChip
              status="active"
              label={objective.state === 'paused' ? 'Paused' : 'Completed'}
            />
          ) : null}
          <span className="text-sm font-bold text-heading">
            Step {at + 1} of {bar.length}
          </span>
        </div>
      </div>

      <StepBar
        className={compact ? 'mt-3 [&_button>span:nth-child(2)]:sr-only' : 'mt-3'}
        label="Objective steps list"
        currentId={currentStepId}
        steps={bar.map((s) => ({
          id: s.id,
          label: labelFor(s),
          completed: statuses.get(s.id) === 'completed',
        }))}
        onSelect={(id) => {
          const step = bar.find((s) => s.id === id)
          if (step) onOpenStep(step)
        }}
      />

      {isReadingAhead(objective, current.id, isDone) && objective.state === 'active' ? (
        <p
          className="mt-3 rounded-xl bg-caution px-3 py-2 text-sm text-caution-foreground"
          role="note"
        >
          {COPY.stepAhead}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StoryButton
          variant="secondary"
          disabled={!prev}
          onClick={() => prev && onOpenStep(prev)}
          aria-label={prev ? `Previous: ${prevTitle}` : 'Previous step'}
        >
          ← Prev
        </StoryButton>
        {canMark ? (
          <StoryButton variant="primary" onClick={mark}>
            Mark complete
          </StoryButton>
        ) : compact && justMarked === current.id && currentDone ? (
          <StoryButton variant="secondary" onClick={undo}>
            Undo
          </StoryButton>
        ) : currentDone ? (
          <StatusChip status="completed" />
        ) : null}
        {next.kind === 'complete' ? (
          <StoryButton variant="primary" disabled={!next.enabled} onClick={onComplete}>
            {COPY.stepLast}
          </StoryButton>
        ) : (
          <StoryButton
            variant="primary"
            disabled={!next.enabled}
            onClick={() => {
              const target = next.targetStepId
                ? bar.find((s) => s.id === next.targetStepId)
                : undefined
              if (target) onOpenStep(target)
            }}
          >
            {following ? `Next: ${nextTitle} →` : 'Next →'}
          </StoryButton>
        )}
      </div>
      {next.hint ? (
        <p className="mt-2 text-sm text-muted-foreground" data-testid="journey-next-hint">
          {next.hint}
        </p>
      ) : null}
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>
    </section>
  )
}

/** A quiet link back to where the learner started: Your journey or All modules. Nothing when they came from a link. */
export function JourneyBackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className={storyButtonVariants({ variant: 'quiet' })}>
      ← {label}
    </Link>
  )
}

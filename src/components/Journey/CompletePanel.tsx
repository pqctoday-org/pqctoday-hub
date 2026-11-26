// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "Before you complete" (UX handoff 6.5). Each required step with its status, the note for the
 * state, a button that goes to the first unfinished required step, and the learner's own
 * confirmation of the last step. Comments, artifacts and answers never count as proof.
 */
import { useId, useState } from 'react'
import { StatusChip, StoryButton, StoryRow } from '@/components/storybook'
import { JourneyDialog } from './JourneyDialog'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useIsDone } from '@/hooks/useJourney'
import { barSteps, completeCheck, stepDone } from '@/services/journey/stepRules'
import { describeStep, finishCondition } from '@/services/journey/stepView'
import type { Objective, Step } from '@/services/journey/types'

interface CompletePanelProps {
  objective: Objective
  open: boolean
  onClose: () => void
  /** Go to a step (the "go" button of a blocked panel). */
  onGoToStep: (step: Step) => void
  /** Called after the objective is marked complete. */
  onCompleted?: () => void
}

export function CompletePanel({
  objective,
  open,
  onClose,
  onGoToStep,
  onCompleted,
}: CompletePanelProps) {
  const isDone = useIsDone()
  const completeObjective = useJourneyStore((s) => s.completeObjective)
  const [confirmed, setConfirmed] = useState(false)
  const checkId = useId()
  const check = completeCheck(objective, isDone)
  const finish = finishCondition(objective)
  const allowed = check.state === 'allowed'
  const blockerIds = new Set(check.blockers.map((b) => b.id))

  const close = () => {
    setConfirmed(false)
    onClose()
  }

  return (
    <JourneyDialog
      open={open}
      onClose={close}
      eyebrow="Objective"
      title="Before you complete"
      testId="complete-panel"
    >
      <p className="text-sm">
        <span className="font-bold text-heading">Finish condition: </span>
        {finish}.
      </p>
      <ul className="space-y-2" aria-label="Required steps">
        {barSteps(objective)
          .filter((s) => !s.deferred)
          .map((s) => {
            const view = describeStep(s, objective)
            const isLast = s.id === check.confirmStep?.id
            const done = stepDone(s, isDone)
            return (
              <StoryRow as="li" key={s.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 text-sm font-semibold">{view.title}</span>
                {isLast ? (
                  <span className="text-sm text-muted-foreground">You confirm this one below</span>
                ) : done ? (
                  <StatusChip status="completed" />
                ) : (
                  <StatusChip status="not-started" label="Not done yet" />
                )}
              </StoryRow>
            )
          })}
      </ul>
      <p className="text-sm" data-testid="complete-note">
        {check.note}
      </p>
      {check.goStep ? (
        <StoryButton
          variant="secondary"
          onClick={() => {
            const step = check.goStep
            close()
            if (step) onGoToStep(step)
          }}
        >
          Go to {describeStep(check.goStep, objective).title}
        </StoryButton>
      ) : null}
      <div className="flex items-start gap-3">
        <input
          id={checkId}
          type="checkbox"
          className="mt-1 size-5 shrink-0 accent-primary"
          checked={confirmed}
          disabled={!allowed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        <label htmlFor={checkId} className="text-sm">
          I confirm I recorded completion of {finish}.
        </label>
      </div>
      <p className="text-sm text-muted-foreground">
        Comments, artifacts and answers stay saved as supporting material. They never count as proof
        of skill. Steps shared with other objectives stay credited there.
      </p>
      <div className="flex flex-wrap gap-2">
        <StoryButton
          variant="primary"
          disabled={!allowed || !confirmed || blockerIds.size > 0}
          onClick={() => {
            if (completeObjective(objective.id, confirmed, isDone)) {
              close()
              onCompleted?.()
            }
          }}
        >
          Mark objective complete
        </StoryButton>
        <StoryButton variant="secondary" onClick={close}>
          Cancel
        </StoryButton>
      </div>
    </JourneyDialog>
  )
}

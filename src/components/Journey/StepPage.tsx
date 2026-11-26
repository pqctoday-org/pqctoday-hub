// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The page of a step that is not a module (UX handoff 6.12): today the self-assessed last step.
 * It shows the step bar, what the work should cover (each point from a lesson the objective
 * holds, with a link back to it) and a mount point for the learner's own notes. The Assistant never
 * writes the learner's findings; this page holds an outline with placeholders only.
 */
import { Link, useNavigate } from 'react-router'
import { Chip, Eyebrow, StickerCard, StoryRow, StoryButton } from '@/components/storybook'
import { JourneyStepBar, JourneyBackLink } from './JourneyStepBar'
import { CompletePanel } from './CompletePanel'
import { ObjectiveChanges } from './ObjectiveChanges'
import { StepNotesMount } from './mountPoints'
import { useOpenStep } from './useJourneyNav'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useIsDone } from '@/hooks/useJourney'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { describeStep, finishCondition, journeyHref } from '@/services/journey/stepView'
import { barSteps } from '@/services/journey/stepRules'
import { retiredEntry } from '@/services/journey/retiredSteps'
import { useState } from 'react'
import type { Objective } from '@/services/journey/types'

export function StepPage({ objective, stepId }: { objective: Objective; stepId: string }) {
  const step = objective.steps.find((s) => s.id === stepId)
  const isDone = useIsDone()
  const compact = useIsMobileShell()
  const navigate = useNavigate()
  const openStep = useOpenStep('journey')
  const setCheckpoint = useJourneyStore((s) => s.setCheckpoint)
  const [completeOpen, setCompleteOpen] = useState(false)
  if (!step) return null
  const view = describeStep(step, objective)
  const points = barSteps(objective).filter((s) => s.kind === 'module')
  const outline = points.map((s) => `${describeStep(s, objective).title}: `)

  return (
    <div className="space-y-4" data-testid="step-page">
      <JourneyBackLink to={journeyHref()} label="Back to Your journey" />
      <StickerCard as="section" className="space-y-4">
        <div>
          <Eyebrow>{view.groupLabel}</Eyebrow>
          <h2 className="text-xl font-extrabold text-heading">{view.title}</h2>
          <div className="mt-2">
            <Chip>{view.kindLabel}</Chip>
          </div>
        </div>
        <JourneyStepBar
          objective={objective}
          currentStepId={step.id}
          compact={compact}
          onOpenStep={(s) => openStep(objective, s)}
          onComplete={() => setCompleteOpen(true)}
        />
        <ObjectiveChanges objective={objective} stepId={step.id} />
        {step.kind === 'self-assessed' ? (
          <div className="space-y-3">
            <p className="text-sm">
              This last step is self-assessed. You confirm it yourself when you complete the
              objective: {finishCondition(objective)}.
            </p>
            <div>
              <Eyebrow>
                What your work should cover · {points.filter((s) => isDone(s.resourceTag)).length}{' '}
                of {points.length} points covered
              </Eyebrow>
              <ul className="mt-2 space-y-1.5">
                {points.map((s) => {
                  const v = describeStep(s, objective)
                  return (
                    <StoryRow
                      as="li"
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <span>
                        <span className="font-semibold">{v.title}</span>
                        <span className="text-muted-foreground"> · from {v.groupLabel}</span>
                      </span>
                      <Link
                        to={v.to}
                        state={{ journeyOrigin: 'journey' }}
                        onClick={() => setCheckpoint(objective.id, { stepId: s.id })}
                        className="font-semibold text-primary-legible underline underline-offset-4"
                      >
                        Review in the module
                      </Link>
                    </StoryRow>
                  )
                })}
              </ul>
            </div>
            <StepNotesMount objectiveId={objective.id} stepId={step.id} outline={outline} />
            <StoryButton variant="secondary" onClick={() => navigate(journeyHref())}>
              Back to Your journey
            </StoryButton>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {retiredEntry(step.resourceTag)
              ? 'This step was retired. What changed and what you can do about it is above. Your other steps are unaffected.'
              : 'This step is not in the catalogue any more. Your other steps are unaffected.'}
          </p>
        )}
      </StickerCard>
      <CompletePanel
        objective={objective}
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onGoToStep={(s) => openStep(objective, s)}
      />
    </div>
  )
}

// SPDX-License-Identifier: AGPL-3.0-only
/**
 * What changed in the lessons of an objective since it was built (design note A06 and A07; requirements U01 to
 * U05, J02): a retired step with its replacement offered, "Curriculum changed" for a lesson that now lists a
 * lesson to take first, and a new section, a new tool, an updated section or an updated tool. Same cards as the
 * Updates the learner already has. Each names its kind in words, links to the section or tool, and can be marked
 * seen. Nothing here changes the path on its own: a step is added or swapped only by the learner's own button,
 * and "Keep my path" leaves the objective exactly as it is. Nothing is deleted.
 */
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  Eyebrow,
  StatusChip,
  StickerCard,
  StoryButton,
  StoryRow,
  storyButtonVariants,
} from '@/components/storybook'
import { useJourneyStore } from '@/store/useJourneyStore'
import { CHANGE_LABEL, type ObjectiveChange } from '@/services/journey/changes'
import { objectiveTitle } from '@/services/journey/stepView'
import { useAllObjectiveChanges, useObjectiveChanges } from '@/hooks/useObjectiveChanges'
import { useRoleObjectives } from '@/hooks/useJourney'
import type { Objective } from '@/services/journey/types'

const dateWords = (ms?: number): string | undefined =>
  ms === undefined
    ? undefined
    : new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

interface CardProps {
  objective: Objective
  change: ObjectiveChange
  onDone: (message: string) => void
  /** Show which objective it is about (the Updates list covers several). */
  showObjective?: boolean
}

export function ChangeCard({ objective, change, onDone, showObjective = false }: CardProps) {
  const acknowledge = useJourneyStore((s) => s.acknowledgeChange)
  const addRequiredStep = useJourneyStore((s) => s.addRequiredStep)
  const swapRetiredStep = useJourneyStore((s) => s.swapRetiredStep)
  const deferStep = useJourneyStore((s) => s.deferStep)
  const completed = objective.state === 'completed'
  const completedOn = dateWords(objective.completedAt)
  const open = change.href ? (
    <Link
      to={change.href}
      state={{ journeyOrigin: 'journey' }}
      className={storyButtonVariants({ variant: 'secondary' })}
    >
      Open {change.subject}
    </Link>
  ) : null

  return (
    <StoryRow
      as="li"
      data-testid="objective-change"
      data-kind={change.kind}
      tone={
        change.kind === 'new-required-step' || change.kind === 'retired-step'
          ? 'highlight'
          : 'default'
      }
      className="space-y-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status="changed" label={CHANGE_LABEL[change.kind]} />
        {showObjective ? (
          <span className="text-xs text-muted-foreground">{objectiveTitle(objective)}</span>
        ) : null}
      </div>
      <p className="text-sm font-bold text-heading">{change.subject}</p>
      <p className="text-sm text-foreground">{change.detail}</p>

      {change.kind === 'retired-step' ? (
        <p className="text-sm text-foreground">
          {change.replacement
            ? `Your progress and comments on it are kept. Swapping in ${change.replacement.title} keeps this step’s place in the objective.`
            : 'Your progress and comments on it are kept.'}
          {completed && completedOn ? ` You completed this objective on ${completedOn}.` : ''}
        </p>
      ) : null}
      {change.kind === 'new-required-step' ? (
        <p className="text-sm text-foreground">
          {completed
            ? `You completed this objective${completedOn ? ` on ${completedOn}` : ''}. That stays on record. You choose whether to add this step and reopen it.`
            : 'Nothing has changed in your objective. You choose whether to add this step.'}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {change.kind === 'retired-step' ? (
          <>
            {change.replacement ? (
              <StoryButton
                variant="primary"
                onClick={() =>
                  swapRetiredStep(objective.id, change.stepId, change.replacement!.tag, {
                    reopen: true,
                  }) && onDone(`${change.replacement!.title} is now this step.`)
                }
              >
                {completed
                  ? `Swap in ${change.replacement.title} and reopen`
                  : `Swap in ${change.replacement.title}`}
              </StoryButton>
            ) : null}
            {!completed ? (
              <StoryButton
                variant="quiet"
                onClick={() => {
                  deferStep(objective.id, change.stepId)
                  onDone(`${change.subject} is put off in this objective.`)
                }}
              >
                Put this step off
              </StoryButton>
            ) : null}
            {open}
          </>
        ) : change.kind === 'new-required-step' ? (
          <>
            {open ? (
              <Link
                to={change.href!}
                state={{ journeyOrigin: 'journey' }}
                className={storyButtonVariants({ variant: 'secondary' })}
              >
                Review {change.subject}
              </Link>
            ) : null}
            <StoryButton
              variant="primary"
              onClick={() => {
                if (
                  addRequiredStep(objective.id, change.addTag!, change.lessonTag, {
                    reopen: true,
                  })
                ) {
                  acknowledge(objective.id, change.id)
                  onDone(
                    completed
                      ? `${change.subject} was added and the objective is open again.`
                      : `${change.subject} was added before ${change.lessonTitle}.`
                  )
                }
              }}
            >
              {completed ? 'Add it and reopen the objective' : 'Add it to my objective'}
            </StoryButton>
            <StoryButton
              variant="quiet"
              onClick={() => {
                acknowledge(objective.id, change.id)
                onDone('Your path is kept as it is.')
              }}
            >
              Keep my path
            </StoryButton>
          </>
        ) : (
          <>
            {open}
            <StoryButton
              variant="quiet"
              onClick={() => {
                acknowledge(objective.id, change.id)
                onDone(`${CHANGE_LABEL[change.kind]}: ${change.subject} is marked seen.`)
              }}
            >
              Mark seen
            </StoryButton>
          </>
        )}
      </div>
    </StoryRow>
  )
}

interface ObjectiveChangesProps {
  objective: Objective
  /** Only the changes about this step (a step page, a module page). */
  stepId?: string
  className?: string
}

/** The unanswered changes of an objective, or of one of its steps. Renders nothing when there are none. */
export function ObjectiveChanges({ objective, stepId, className }: ObjectiveChangesProps) {
  const changes = useObjectiveChanges(objective, stepId)
  const [message, setMessage] = useState('')
  const holder = useRef<HTMLDivElement>(null)

  const done = (m: string) => {
    setMessage(m)
    // The card that was answered is gone; keyboard focus goes to the list's holder, which says what happened.
    requestAnimationFrame(() => holder.current?.focus())
  }

  return (
    <div
      ref={holder}
      tabIndex={-1}
      className={`outline-none ${className ?? ''}`}
      data-testid="objective-changes"
    >
      {changes.length > 0 ? (
        <section aria-label="What changed in this objective" className="space-y-2">
          <Eyebrow>
            {stepId ? 'What changed in this step' : 'What changed since this objective was built'}
          </Eyebrow>
          <ul className="space-y-2">
            {changes.map((c) => (
              <ChangeCard key={c.id} objective={objective} change={c} onDone={done} />
            ))}
          </ul>
        </section>
      ) : null}
      <p
        role="status"
        aria-live="polite"
        className={message ? 'mt-2 text-sm font-semibold' : 'sr-only'}
      >
        {message}
      </p>
    </div>
  )
}

/**
 * The same cards for every objective of the learner's role, for the Updates view. One card per change, naming
 * the objective it is about.
 */
export function ObjectiveChangesList({ className }: { className?: string }) {
  const objectives = useRoleObjectives()
  const changes = useAllObjectiveChanges()
  const [message, setMessage] = useState('')
  const byId = new Map(objectives.map((o) => [o.id, o]))
  if (changes.length === 0 && !message) return null
  return (
    <StickerCard
      as="section"
      aria-labelledby="objective-changes-heading"
      padding="roomy"
      className={className}
      data-testid="objective-changes-list"
    >
      <h2 id="objective-changes-heading" className="text-xl font-extrabold text-heading">
        Changes in your objectives
        {changes.length > 0 ? (
          <span className="ml-2 align-middle text-sm font-bold text-muted-foreground">
            ({changes.length} new)
          </span>
        ) : null}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        New or changed sections and tools, and steps the Hub changed, in the lessons of your
        objectives. Nothing changes in an objective until you choose.
      </p>
      <ul className="mt-3 space-y-3" aria-label="Changes in your objectives">
        {changes.map((c) => {
          const objective = byId.get(c.objectiveId)
          return objective ? (
            <ChangeCard
              key={`${c.objectiveId}:${c.id}`}
              objective={objective}
              change={c}
              showObjective
              onDone={setMessage}
            />
          ) : null
        })}
      </ul>
      <p
        role="status"
        aria-live="polite"
        className={message ? 'mt-2 text-sm font-semibold' : 'sr-only'}
      >
        {message}
      </p>
    </StickerCard>
  )
}

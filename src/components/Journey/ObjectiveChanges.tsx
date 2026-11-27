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
import { useAllChangeGroups, useObjectiveChanges } from '@/hooks/useObjectiveChanges'
import { useRoleObjectives } from '@/hooks/useJourney'
import type { Objective } from '@/services/journey/types'
import { formatDate } from '@/lib/format'

const dateWords = (ms?: number): string | undefined =>
  ms === undefined ? undefined : formatDate(ms, 'day', { relative: false })

interface CardProps {
  objective: Objective
  change: ObjectiveChange
  onDone: (message: string) => void
  /** Show which objective it is about (the Updates list covers several). */
  showObjective?: boolean
  /** Other objectives the same change is about (a new section or tool, an update): marked seen together. */
  alsoObjectives?: Objective[]
}

export function ChangeCard({
  objective,
  change,
  onDone,
  showObjective = false,
  alsoObjectives = [],
}: CardProps) {
  const acknowledge = useJourneyStore((s) => s.acknowledgeChange)
  const addRequiredStep = useJourneyStore((s) => s.addRequiredStep)
  const swapRetiredStep = useJourneyStore((s) => s.swapRetiredStep)
  const deferStep = useJourneyStore((s) => s.deferStep)
  const completed = objective.state === 'completed'
  // Marking seen answers the change for every objective it is about.
  const markSeen = () => {
    acknowledge(objective.id, change.id)
    for (const o of alsoObjectives) acknowledge(o.id, change.id)
  }
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
          <span className="text-xs text-muted-foreground">
            {[objective, ...alsoObjectives].map(objectiveTitle).join(' · ')}
          </span>
        ) : null}
      </div>
      <p className="text-sm font-bold text-heading">{change.subject}</p>
      <p className="text-sm text-foreground">{change.detail}</p>

      {change.kind === 'retired-step' ? (
        <p className="text-sm text-foreground">
          {change.replacement
            ? `Your progress and comments on it are kept. Swapping in ${change.replacement.title} keeps this step’s place in the objective.`
            : change.replacementHeld
              ? `${change.replacementHeld.title} is already a step of this objective, so there is nothing to swap in. Your progress and comments on this step are kept.`
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
                onClick={() => {
                  if (
                    swapRetiredStep(objective.id, change.stepId, change.replacement!.tag, {
                      reopen: true,
                    })
                  ) {
                    onDone(`${change.replacement!.title} is now this step.`)
                  } else {
                    // The store refuses a swap it cannot make; the learner is told, and the card stays to be answered.
                    onDone(
                      `Nothing was changed: ${change.replacement!.title} could not be swapped in. You can put this step off or mark it seen.`
                    )
                  }
                }}
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
            {completed || !change.replacement ? (
              <StoryButton
                variant="quiet"
                onClick={() => {
                  markSeen()
                  onDone(`${change.subject} is marked seen. Your objective is kept as it is.`)
                }}
              >
                Mark seen
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
                } else {
                  // Nothing could be added (the objective already holds it, or the step it goes before is gone):
                  // say so, and clear the card, which describes a change that is no longer needed.
                  acknowledge(objective.id, change.id)
                  onDone(
                    `Nothing was added: ${change.subject} is already part of this objective or could not be placed. Your path is kept as it is.`
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
                markSeen()
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
  const status = useRef<HTMLParagraphElement>(null)

  const done = (m: string) => {
    setMessage(m)
    // The card that was answered is gone; keyboard focus goes to the message, which names what happened.
    requestAnimationFrame(() => status.current?.focus())
  }

  return (
    <div className={className} data-testid="objective-changes">
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
        ref={status}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={
          message
            ? 'mt-2 rounded-lg text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
            : 'sr-only'
        }
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
  const groups = useAllChangeGroups()
  const [message, setMessage] = useState('')
  const status = useRef<HTMLParagraphElement>(null)
  const byId = new Map(objectives.map((o) => [o.id, o]))
  if (groups.length === 0 && !message) return null
  const done = (m: string) => {
    setMessage(m)
    // The answered card is gone: focus goes to the message, so it is not lost to the top of the page.
    requestAnimationFrame(() => status.current?.focus())
  }
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
        {groups.length > 0 ? (
          <span className="ml-2 align-middle text-sm font-bold text-muted-foreground">
            ({groups.length} new)
          </span>
        ) : null}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        New or changed sections and tools, and steps the Hub changed, in the lessons of your
        objectives. Nothing changes in an objective until you choose.
      </p>
      <ul className="mt-3 space-y-3" aria-label="Changes in your objectives">
        {groups.map((g) => {
          const [first, ...rest] = g.objectiveIds.map((id) => byId.get(id))
          if (!first) return null
          return (
            <ChangeCard
              key={`${g.change.objectiveId}:${g.change.id}`}
              objective={first}
              alsoObjectives={rest.filter((o): o is Objective => Boolean(o))}
              change={g.change}
              showObjective
              onDone={done}
            />
          )
        })}
      </ul>
      <p
        ref={status}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={
          message
            ? 'mt-2 rounded-lg text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
            : 'sr-only'
        }
      >
        {message}
      </p>
    </StickerCard>
  )
}

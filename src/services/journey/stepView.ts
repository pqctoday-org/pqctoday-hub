// SPDX-License-Identifier: AGPL-3.0-only
/**
 * How a step reads and where it leads. The words come from the data the step points at (a lesson's
 * title and stage name); only the self-assessed step has words of its own.
 */
import { lessonByTag } from './lessons'
import type { Objective, Step } from './types'

export interface StepView {
  title: string
  /** "Stage 2 · Core concepts" for a lesson; "Finish" for the self-assessed step. */
  groupLabel: string
  kindLabel: string
  /** Where a click on the step leads. */
  to: string
}

export const SELF_ASSESSED_TITLE = 'Record your outcome'

export interface JourneyAddress {
  view?: 'objectives' | 'role-map' | 'my-work' | 'updates'
  objective?: string
  step?: string
  /** Open the new-objective form (`new=1`). */
  new?: boolean
}

/** The address of a place in Your journey. `mode=journey` is how the Learn page names the view. */
export function journeyHref(a: JourneyAddress = {}): string {
  const p = new URLSearchParams({ mode: 'journey' })
  if (a.view && a.view !== 'objectives') p.set('jview', a.view)
  if (a.objective) p.set('objective', a.objective)
  if (a.step) p.set('step', a.step)
  if (a.new) p.set('new', '1')
  return `/learn?${p.toString()}`
}

export function describeStep(step: Step, objective: Objective): StepView {
  if (step.kind === 'self-assessed') {
    return {
      title: SELF_ASSESSED_TITLE,
      groupLabel: 'Finish',
      kindLabel: 'Self-assessed activity',
      to: journeyHref({ objective: objective.id, step: step.id }),
    }
  }
  const lesson = step.kind === 'module' ? lessonByTag(step.resourceTag) : undefined
  if (lesson) {
    return {
      title: lesson.title,
      groupLabel: `Stage ${lesson.stage} · ${lesson.stageName}`,
      kindLabel: 'Module',
      to: `/learn/${lesson.id}`,
    }
  }
  // A tag the lessons data no longer holds: say so plainly and keep the step reachable.
  return {
    title: step.resourceTag,
    groupLabel: 'Not in the catalogue',
    kindLabel: step.kind === 'business-tool' ? 'Business tool' : 'Answer',
    to: journeyHref({ objective: objective.id, step: step.id }),
  }
}

/** "TLS review" reads better than the learner's whole sentence in a card heading; the goal itself is kept whole. */
export function objectiveTitle(o: Objective): string {
  return o.goal.length > 80 ? `${o.goal.slice(0, 77).trimEnd()}…` : o.goal
}

/** "you record completion of “goal”, covering A, B and C." from the objective's own required lessons. */
export function finishCondition(o: Objective): string {
  const titles = o.steps
    .filter((s) => s.required && s.kind === 'module')
    .map((s) => lessonByTag(s.resourceTag)?.title)
    .filter((t): t is string => Boolean(t))
  const covers =
    titles.length === 0
      ? ''
      : titles.length === 1
        ? `, covering ${titles[0]}`
        : `, covering ${titles.slice(0, -1).join(', ')} and ${titles[titles.length - 1]}`
  return `you record completion of “${o.goal}”${covers}`
}

/** The reason a step is next: "You finished X." from the step before it, or the start of the objective. */
export function stepReason(o: Objective, step: Step, isDone: (tag: string) => boolean): string {
  const bar = o.steps.filter((s) => s.required).sort((a, b) => a.position - b.position)
  const at = bar.findIndex((s) => s.id === step.id)
  const before = at > 0 ? bar[at - 1] : undefined
  if (before && isDone(before.resourceTag)) return `You finished ${describeStep(before, o).title}.`
  if (step.origin.type === 'take-first') {
    const forLesson = lessonByTag(step.origin.for)
    if (forLesson) return `Take first for ${forLesson.title}.`
  }
  return at === 0 ? 'This is where the objective starts.' : 'The earlier steps are not done yet.'
}

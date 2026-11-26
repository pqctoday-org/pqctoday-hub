// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Mount points: the places in Your journey and on the module page where the panels of other parts
 * of the release sit. Each is an exported component with a stable name; the journey screens render
 * them where the panel belongs. This file is the one seam between the journey and those panels:
 *
 * - MyWorkMount, UpdatesMount, useUpdatesCount, ObjectiveWorkLine, StepNotesMount: My work and
 *   Updates (comments, tracked outputs, saved answers, Markdown export, release notices).
 * - BeltScoreMount: the belt score, journey phases and recent events, at the top of Role map.
 * - ModuleUpdateStripMount, ModuleCommentsMount: the "Revised" strip and the comments on the module page.
 *
 * The panels read the learner's objectives as plain data (see `usePanelObjectives`); nothing the
 * learner wrote is copied into the journey store.
 */
import { useCallback } from 'react'
import { useInRouterContext, useNavigate } from 'react-router'
import { CommentBox, MyWorkPanel, RevisedSectionStrip, UpdatesPanel } from '@/components/MyWork'
import { JourneyProgressStrip } from '@/components/RightPanel/JourneyProgressStrip'
import { useMyWorkStore } from '@/store/useMyWorkStore'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useAssistantSessionStore } from '@/store/useAssistantSessionStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { useAssistantContext } from '@/components/Assistant/useAssistantContext'
import { usePersonaStore } from '@/store/usePersonaStore'
import { usePanelObjectives } from '@/hooks/useJourney'
import { useUpdateCounts } from '@/hooks/useUpdateCounts'
import { ObjectiveChangesList } from './ObjectiveChanges'
import { buildItems, filterItems } from '@/services/myWork/items'
import { journeyHref } from '@/services/journey/stepView'
import { lessonById } from '@/services/journey/lessons'
import { barSteps } from '@/services/journey/stepRules'

export interface ObjectiveScope {
  /** The objective the panel is filtered to; null or absent shows everything. */
  objectiveId?: string | null
}

/** Your journey › My work: comments, tracked outputs, saved answers and references, with export. */
export function MyWorkMount({ objectiveId }: ObjectiveScope) {
  const { work } = usePanelObjectives()
  const getContext = useAssistantContext()
  const ask = useAssistantSessionStore((s) => s.ask)
  const openDrawer = useRightPanelStore((s) => s.open)
  // A saved answer keeps its question, the text and the tags of its records, never the records'
  // wording. "Open the answer" asks the question again in the drawer, so the records read are the
  // Hub's current ones.
  const openAnswer = useCallback(
    (answer: { question: string }) => {
      openDrawer('chat')
      void ask(answer.question, getContext())
    },
    [ask, openDrawer, getContext]
  )
  return (
    <div data-mount="my-work" data-objective={objectiveId ?? ''}>
      <MyWorkPanel objectives={work} onOpenAnswer={openAnswer} />
    </div>
  )
}

/** The number on the "Updates · n" tab: the notices the learner has not yet seen. */
export function useUpdatesCount(): number {
  return useUpdateCounts().total
}

/** Your journey › Updates: the release comparison and the notices. */
export function UpdatesMount({ objectiveId }: ObjectiveScope) {
  const { updates } = usePanelObjectives()
  const persona = usePersonaStore((s) => s.selectedPersona)
  return (
    <div data-mount="updates" data-objective={objectiveId ?? ''} className="space-y-4">
      <ObjectiveChangesList />
      <UpdatesPanel objectives={updates} personaId={persona} />
    </div>
  )
}

/** "Work: 2 comments · 1 artifact" under an objective, counted the way My work counts. */
export function ObjectiveWorkLine({ objectiveId }: { objectiveId: string }) {
  const { work } = usePanelObjectives()
  const comments = useMyWorkStore((s) => s.comments)
  const outputs = useMyWorkStore((s) => s.outputs)
  const answers = useMyWorkStore((s) => s.answers)
  const references = useMyWorkStore((s) => s.references)
  const objective = work.find((o) => o.id === objectiveId)
  const items = objective
    ? filterItems(buildItems({ comments, outputs, answers, references }, work), objectiveId, 'all')
    : []
  const nComments = items.filter((i) => i.type === 'comment').length
  const nArtifacts = items.filter((i) => i.type !== 'comment').length
  return (
    <p
      className="text-sm text-muted-foreground"
      data-mount="objective-work-line"
      data-objective={objectiveId}
    >
      Work: {nComments} {nComments === 1 ? 'comment' : 'comments'} · {nArtifacts}{' '}
      {nArtifacts === 1 ? 'artifact' : 'artifacts'}
    </p>
  )
}

/**
 * The notes area of a self-assessed step. The learner's notes are comments on the last lesson of
 * the objective, so they show in My work under this objective. They are never proof of skill.
 */
export function StepNotesMount({
  objectiveId,
  stepId,
  outline,
}: {
  objectiveId: string
  stepId: string
  /** The points the work should cover, as lines of text. */
  outline: string[]
}) {
  const navigate = useNavigate()
  const objective = useJourneyStore((s) => s.objectives[objectiveId]) // eslint-disable-line security/detect-object-injection
  const lastLesson = objective
    ? barSteps(objective)
        .filter((s) => s.kind === 'module')
        .at(-1)
    : undefined
  return (
    <div
      data-mount="step-notes"
      data-objective={objectiveId}
      data-step={stepId}
      data-outline={outline.length}
    >
      {lastLesson ? (
        <CommentBox
          tag={lastLesson.resourceTag}
          title="Draft notes (optional)"
          onReviewUpdate={() => navigate(journeyHref({ view: 'updates' }))}
        />
      ) : null}
    </div>
  )
}

/** The belt score, journey phases, recent events and badges, at the top of Role map. */
export function BeltScoreMount() {
  return (
    <div data-mount="belt-score">
      <JourneyProgressStrip />
    </div>
  )
}

/** The "Revised" strip of a module page, when the lesson changed past what the learner last read. */
export function ModuleUpdateStripMount({ moduleId }: { moduleId: string }) {
  // Outside a router (a stand-alone preview) there is no page to review the update on.
  return useInRouterContext() ? (
    <ModuleUpdateStrip moduleId={moduleId} />
  ) : (
    <div data-mount="module-update-strip" data-module={moduleId} />
  )
}

function ModuleUpdateStrip({ moduleId }: { moduleId: string }) {
  const navigate = useNavigate()
  const tag = lessonById(moduleId)?.lmId
  return (
    <div data-mount="module-update-strip" data-module={moduleId}>
      {tag ? (
        <RevisedSectionStrip
          tag={tag}
          onReview={() => navigate(journeyHref({ view: 'updates' }))}
        />
      ) : null}
    </div>
  )
}

/** "Your comments on this module" on the module page. */
export function ModuleCommentsMount({ moduleId }: { moduleId: string }) {
  return useInRouterContext() ? (
    <ModuleComments moduleId={moduleId} />
  ) : (
    <div data-mount="module-comments" data-module={moduleId} />
  )
}

function ModuleComments({ moduleId }: { moduleId: string }) {
  const navigate = useNavigate()
  const tag = lessonById(moduleId)?.lmId
  if (!tag) return <div data-mount="module-comments" data-module={moduleId} />
  return (
    <div data-mount="module-comments" data-module={moduleId}>
      <CommentBox tag={tag} onReviewUpdate={() => navigate(journeyHref({ view: 'updates' }))} />
    </div>
  )
}

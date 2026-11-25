// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Mount points: places in Your journey and on the module page that other parts of the release fill.
 * Each is an exported component with a stable name. The journey screens render them where the panel
 * belongs; the lane that owns the panel replaces the body of its mount point (or the import in it),
 * and nothing else in the journey changes.
 *
 * - MyWorkMount, UpdatesMount, useUpdatesCount, ObjectiveWorkLine, StepNotesMount: My work and
 *   Updates (comments, tracked outputs, saved answers, Markdown export, release notices).
 * - BeltScoreMount: the belt score, journey phases and recent events, re-homed to the top of Role map.
 * - ModuleUpdateStripMount, ModuleCommentsMount: the "Revised" strip and the section comments on the module page.
 *
 * Until a panel is mounted, each one shows the plain empty state of the handoff, so the screen is
 * complete and truthful without it.
 */
import { Eyebrow, StickerCard } from '@/components/storybook'

export interface ObjectiveScope {
  /** The objective the panel is filtered to; null or absent shows everything. */
  objectiveId?: string | null
}

/** Your journey › My work. Replaced by the My work panel (comments, tracked outputs, saved answers, export). */
export function MyWorkMount({ objectiveId }: ObjectiveScope) {
  return (
    <StickerCard
      as="section"
      aria-label="My work"
      data-mount="my-work"
      data-objective={objectiveId ?? ''}
    >
      <Eyebrow>My work</Eyebrow>
      <p className="mt-2 text-sm text-muted-foreground">
        Stored on this device only. Nothing here counts as completion.
      </p>
      <p className="mt-3 font-semibold text-heading">Nothing here yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Comments, saved answers and notes you keep while you learn appear here.
      </p>
    </StickerCard>
  )
}

/** The number on the "Updates · n" tab. Replaced by the count of unseen notices. */
export function useUpdatesCount(): number {
  return 0
}

/** Your journey › Updates. Replaced by the release comparison and notices. */
export function UpdatesMount({ objectiveId }: ObjectiveScope) {
  return (
    <StickerCard
      as="section"
      aria-label="Updates"
      data-mount="updates"
      data-objective={objectiveId ?? ''}
    >
      <Eyebrow>Updates</Eyebrow>
      <p className="mt-2 font-semibold text-heading">
        You&apos;re up to date for your saved objectives.
      </p>
    </StickerCard>
  )
}

/** The line "Work: 2 comments · 1 artifact" under an objective. Replaced by the counts from My work. */
export function ObjectiveWorkLine({ objectiveId }: { objectiveId: string }) {
  return (
    <p
      className="text-sm text-muted-foreground"
      data-mount="objective-work-line"
      data-objective={objectiveId}
    >
      Work: 0 comments · 0 artifacts
    </p>
  )
}

/** The notes area of a self-assessed step: "Start my notes from this outline" and the draft box. */
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
  return (
    <div
      data-mount="step-notes"
      data-objective={objectiveId}
      data-step={stepId}
      data-outline={outline.length}
    />
  )
}

/** The belt score, journey phases and recent events, shown at the top of Role map. Renders nothing until mounted. */
export function BeltScoreMount() {
  return <div data-mount="belt-score" />
}

/** The strip on a revised module ("Revised: ..."). Renders nothing until mounted. */
export function ModuleUpdateStripMount({ moduleId }: { moduleId: string }) {
  return <div data-mount="module-update-strip" data-module={moduleId} />
}

/** "Your comments on this section" on the module page. Renders nothing until mounted. */
export function ModuleCommentsMount({ moduleId }: { moduleId: string }) {
  return <div data-mount="module-comments" data-module={moduleId} />
}

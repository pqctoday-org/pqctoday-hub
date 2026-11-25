// SPDX-License-Identifier: AGPL-3.0-only
/**
 * New objective (UX handoff 6.4): one text box, then a preview that creates nothing. The preview has
 * five states: the form, "One question first" for a goal that is too broad, the preview itself, a
 * duplicate of an open objective, and a coverage gap. Create saves exactly what the preview showed.
 */
import { useEffect, useId, useRef, useState } from 'react'
import {
  Eyebrow,
  StickerCard,
  StoryButton,
  StoryRow,
  StoryTextarea,
  StatusChip,
} from '@/components/storybook'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useIsDone, useRoleObjectives } from '@/hooks/useJourney'
import { usePersonaStore } from '@/store/usePersonaStore'
import {
  buildPreview,
  objectiveIdFor,
  stepsFromPreview,
  type ObjectivePreview,
} from '@/services/journey/objectiveBuilder'
import { lessonByTag } from '@/services/journey/lessons'
import { describeStep, finishCondition, objectiveTitle } from '@/services/journey/stepView'
import { requiredProgress, barSteps } from '@/services/journey/stepRules'
import type { Objective } from '@/services/journey/types'

interface NewObjectiveFlowProps {
  onCreated: (objectiveId: string) => void
  onCancel: () => void
  /** A goal to start from (a link or a suggestion). */
  initialGoal?: string
}

/** The objective a preview would become, for reading its finish condition and steps with the saved objective's own functions. */
function asObjective(p: ObjectivePreview): Objective {
  const id = objectiveIdFor(p.role, p.goal)
  return {
    id,
    role: p.role,
    goal: p.goal,
    state: 'active',
    steps: stepsFromPreview(id, p),
    checkpoint: { path: [], stepId: null },
    createdAt: 0,
    updatedAt: 0,
  }
}

const titleOf = (tag: string) => lessonByTag(tag)?.title ?? tag

export function NewObjectiveFlow({ onCreated, onCancel, initialGoal = '' }: NewObjectiveFlowProps) {
  const persona = usePersonaStore((s) => s.selectedPersona)
  const industry = usePersonaStore((s) => s.selectedIndustry)
  const existing = useRoleObjectives()
  const isDone = useIsDone()
  const createObjective = useJourneyStore((s) => s.createObjective)
  const [goal, setGoal] = useState(initialGoal)
  const [preview, setPreview] = useState<ObjectivePreview | null>(null)
  // Set when the device did not keep the objective: how it was being created, for Try again.
  const [failedWith, setFailedWith] = useState<{ allowDuplicate: boolean } | null>(null)
  const retryRef = useRef<HTMLButtonElement>(null)
  const fieldId = useId()
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (preview) resultRef.current?.focus()
  }, [preview])

  // After a failed save, focus goes to Try again so the next key press retries.
  useEffect(() => {
    if (failedWith) retryRef.current?.focus()
  }, [failedWith])

  const runPreview = () => {
    if (!goal.trim()) return
    setPreview(buildPreview({ goal, persona, industry, existing, isDone }))
  }
  const create = (allowDuplicate = false) => {
    if (!preview) return
    const { id, failed } = createObjective(preview, { allowDuplicate })
    if (failed) {
      // Nothing was saved. The goal and the preview stay as they are, so Try again saves them once.
      setFailedWith({ allowDuplicate })
      return
    }
    setFailedWith(null)
    onCreated(id)
  }

  const duplicate = preview?.duplicateOf
    ? existing.find((o) => o.id === preview.duplicateOf)
    : undefined
  const asObj = preview && preview.steps.length > 0 ? asObjective(preview) : null

  return (
    <StickerCard as="section" aria-label="New objective" data-testid="new-objective">
      <label htmlFor={fieldId} className="block text-base font-bold text-heading">
        What do you want to be able to do?
      </label>
      <p className="mt-1 text-sm text-muted-foreground">
        Your role, industry and level are used if you have set them.
      </p>
      <StoryTextarea
        id={fieldId}
        className="mt-3"
        value={goal}
        onChange={(e) => {
          setGoal(e.target.value)
          if (preview) setPreview(null)
          setFailedWith(null)
        }}
        placeholder="For example: Review our TLS migration design"
        maxLength={300}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <StoryButton variant="primary" onClick={runPreview} disabled={!goal.trim()}>
          Preview
        </StoryButton>
        <StoryButton variant="secondary" onClick={onCancel}>
          Cancel
        </StoryButton>
      </div>

      {preview ? (
        <div
          ref={resultRef}
          tabIndex={-1}
          className="mt-5 space-y-3 outline-none"
          data-testid={`preview-${preview.state}`}
        >
          {preview.state === 'broad' ? (
            <div role="status">
              <h3 className="text-lg font-extrabold text-heading">One question first.</h3>
              <p className="mt-1 text-sm">
                That is broad. Is it for a decision, a design, or a briefing? Add a few words and
                preview again.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-extrabold text-heading" role="status">
                {preview.state === 'duplicate'
                  ? 'Preview · you already have this'
                  : preview.state === 'gap'
                    ? 'Preview · coverage gap'
                    : 'Preview · nothing is saved yet'}
              </h3>

              {preview.state === 'duplicate' && duplicate ? (
                <p className="text-sm">
                  This matches your open objective <strong>{objectiveTitle(duplicate)}</strong>{' '}
                  (step {requiredProgress(duplicate, isDone).done + 1} of{' '}
                  {barSteps(duplicate).length}). Continue it instead, or create a separate objective
                  anyway.
                </p>
              ) : null}

              {preview.state === 'gap' ? (
                <div className="space-y-2 text-sm">
                  <p>The Hub does not cover this goal well enough to build a full objective.</p>
                  <p>
                    <span className="font-bold text-heading">Mapped topics: </span>
                    {preview.mapped.length ? preview.mapped.map(titleOf).join(', ') : 'none'}
                  </p>
                  <p>
                    <span className="font-bold text-heading">Not covered: </span>
                    {preview.notCovered.length ? preview.notCovered.join(', ') : 'none'}
                  </p>
                </div>
              ) : null}

              {asObj && preview.state !== 'gap' ? (
                <PreviewBody preview={preview} objective={asObj} />
              ) : null}
            </>
          )}

          {failedWith ? (
            <div role="alert" className="space-y-2 rounded-2xl border-2 border-ink bg-card p-3">
              <p className="text-sm font-bold text-heading">Your objective was not saved.</p>
              <p className="text-sm">
                Your goal and this preview are still here. Nothing was lost. Try again, or keep the
                preview open while you free some space in your browser.
              </p>
              <StoryButton
                ref={retryRef}
                variant="primary"
                onClick={() => create(failedWith.allowDuplicate)}
              >
                Try again
              </StoryButton>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {preview.state === 'ready' ? (
              <StoryButton variant="primary" onClick={() => create()}>
                Create objective
              </StoryButton>
            ) : null}
            {preview.state === 'duplicate' && duplicate ? (
              <>
                <StoryButton variant="primary" onClick={() => onCreated(duplicate.id)}>
                  Continue the existing objective
                </StoryButton>
                <StoryButton variant="secondary" onClick={() => create(true)}>
                  Create anyway
                </StoryButton>
              </>
            ) : null}
            {preview.state === 'gap' && preview.mapped.length > 0 ? (
              <StoryButton variant="primary" onClick={() => create()}>
                Create with the mapped topics
              </StoryButton>
            ) : null}
            {preview.state === 'ready' || preview.state === 'gap' ? (
              <StoryButton
                variant="secondary"
                onClick={() => {
                  setPreview(null)
                  setFailedWith(null)
                }}
              >
                Change the goal
              </StoryButton>
            ) : null}
          </div>
        </div>
      ) : null}
    </StickerCard>
  )
}

function PreviewBody({ preview, objective }: { preview: ObjectivePreview; objective: Objective }) {
  const required = preview.steps.filter((s) => s.required)
  const optional = preview.steps.filter((s) => !s.required)
  const first =
    barSteps(objective).find((s) => s.resourceTag === preview.firstStepTag) ??
    barSteps(objective).find((s) => s.kind === 'self-assessed')
  const why = (s: ObjectivePreview['steps'][number]) =>
    s.origin.type === 'take-first' ? `take first for ${titleOf(s.origin.for)}` : 'matches your goal'
  return (
    <div className="space-y-3 text-sm">
      <p>
        <span className="font-bold text-heading">Finish condition: </span>
        {finishCondition(objective)}.
      </p>
      <div>
        <Eyebrow>Required</Eyebrow>
        <ul className="mt-1 space-y-1.5">
          {required.map((s) => (
            <StoryRow
              as="li"
              key={s.tag}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span>
                <span className="font-semibold">{titleOf(s.tag)}</span>{' '}
                <span className="text-muted-foreground">· {why(s)}</span>
              </span>
              {s.alreadyDone ? <StatusChip status="completed" /> : null}
            </StoryRow>
          ))}
          <StoryRow as="li">
            <span className="font-semibold">Record your outcome</span>{' '}
            <span className="text-muted-foreground">· self-assessed, you confirm it yourself</span>
          </StoryRow>
        </ul>
      </div>
      {optional.length > 0 ? (
        <p>
          <span className="font-bold text-heading">Optional: </span>
          {optional.map((s) => titleOf(s.tag)).join(', ')}
        </p>
      ) : null}
      {preview.alreadyDone.length > 0 ? (
        <p>
          <span className="font-bold text-heading">Already done for you: </span>
          {preview.alreadyDone.map(titleOf).join(', ')}
        </p>
      ) : null}
      {first ? (
        <p>
          <span className="font-bold text-heading">First step: </span>
          {describeStep(first, objective).title}
        </p>
      ) : null}
    </div>
  )
}

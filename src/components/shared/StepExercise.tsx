// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Round 9, wave 2 (2026-09-19) — "Try it" under a workshop step: one question
 * from `src/data/stepExercises.ts`, options as buttons, and feedback that
 * names the concept whether the answer was right or not. Renders nothing for
 * a step with no exercise, so it can be mounted unconditionally.
 */
import { useRef, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { stepExerciseFor, type StepExercise as PracticeQuestion } from '@/data/stepExercises'
import { STEP_TRANSFER_EXERCISES } from '@/data/stepTransferExercises'
import type { WorkshopPracticeAnswer, WorkshopPracticeAnswers } from '@/services/storage/types'
import { useModuleStore } from '@/store/useModuleStore'
import { cn } from '@/lib/utils'

interface StepExerciseProps {
  moduleId: string
  stepId: string
  className?: string
}

function questionIdentity(exercise: PracticeQuestion): string {
  return JSON.stringify([exercise.prompt, exercise.options, exercise.answer])
}

function restoredChoice(exercise: PracticeQuestion | undefined, saved?: WorkshopPracticeAnswer) {
  if (!exercise || saved?.question !== questionIdentity(exercise)) return null
  return Number.isInteger(saved.choice) &&
    saved.choice >= 0 &&
    saved.choice < exercise.options.length
    ? saved.choice
    : null
}

export function StepExercise({ moduleId, stepId, className }: StepExerciseProps) {
  const original = stepExerciseFor(moduleId, stepId)
  const transfer = STEP_TRANSFER_EXERCISES[`${moduleId}/${stepId}`]
  const [showTransfer, setShowTransfer] = useState(false)
  const prompt = useRef<HTMLParagraphElement>(null)
  // Both identifiers come from a registered workshop step.
  /* eslint-disable security/detect-object-injection */
  const saved = useModuleStore((state) => state.modules[moduleId]?.workshopPractice?.[stepId])
  const updateAnswers = (answers?: WorkshopPracticeAnswers) => {
    const { modules, updateModuleProgress } = useModuleStore.getState()
    const practice = { ...modules[moduleId]?.workshopPractice }
    if (answers) practice[stepId] = answers
    else delete practice[stepId]
    updateModuleProgress(moduleId, { workshopPractice: practice })
  }
  /* eslint-enable security/detect-object-injection */
  const originalPick = restoredChoice(original ?? transfer, saved?.first)
  const transferPick = restoredChoice(transfer, saved?.transfer)
  const ex = showTransfer ? transfer : (original ?? transfer)
  const picked = showTransfer ? transferPick : originalPick
  if (!ex) return null
  const setPicked = (choice: number) =>
    updateAnswers({
      ...saved,
      [showTransfer ? 'transfer' : 'first']: {
        question: questionIdentity(ex),
        choice,
      },
    })
  const correct = picked !== null && picked === ex.answer
  return (
    <section
      aria-label="Try it"
      data-testid="step-exercise"
      className={cn('mt-6 rounded-xl border border-border bg-muted/20 p-4', className)}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Try it
      </p>
      <p
        ref={prompt}
        tabIndex={-1}
        className="mt-1 text-sm font-medium text-foreground"
        aria-live="polite"
      >
        {ex.prompt}
      </p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Answers">
        {ex.options.map((opt, i) => (
          <Button
            key={opt}
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={picked === i}
            onClick={() => setPicked(i)}
            className={cn(
              'h-auto whitespace-normal text-left',
              picked !== null && i === ex.answer && 'border-status-success bg-status-success/10',
              picked === i && i !== ex.answer && 'border-status-error bg-status-error/10'
            )}
          >
            {opt}
          </Button>
        ))}
      </div>
      {picked !== null && (
        <p
          role="status"
          data-testid="step-feedback"
          className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-foreground"
        >
          {correct ? (
            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0 text-status-success"
              aria-hidden="true"
            />
          ) : (
            <XCircle size={16} className="mt-0.5 shrink-0 text-status-error" aria-hidden="true" />
          )}
          <span>
            <span className="font-semibold">
              {correct ? 'Right. ' : `Not quite — it is "${ex.options[ex.answer]}". `}
            </span>
            {ex.why}
            {ex.source && (
              <>
                {' '}
                <a
                  className="text-primary underline underline-offset-2"
                  href={ex.source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ex.source.label}
                </a>
              </>
            )}
          </span>
        </p>
      )}
      {saved && (
        <div className="mt-3 flex flex-wrap gap-2">
          {original && transfer && originalPick !== null && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11"
              onClick={() => setShowTransfer((current) => !current)}
            >
              {showTransfer ? 'Back to the first question' : 'Apply it to another case'}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              updateAnswers()
              setShowTransfer(false)
              prompt.current?.focus()
            }}
          >
            Clear practice answers
          </Button>
        </div>
      )}
    </section>
  )
}

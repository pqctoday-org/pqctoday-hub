// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 2 (2026-09-19) — "Try it" under a workshop step: one question
 * from `src/data/stepExercises.ts`, options as buttons, and feedback that
 * names the concept whether the answer was right or not. Renders nothing for
 * a step with no exercise, so it can be mounted unconditionally.
 */
import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { stepExerciseFor } from '@/data/stepExercises'
import { cn } from '@/lib/utils'

interface StepExerciseProps {
  moduleId: string
  stepId: string
  className?: string
}

export function StepExercise({ moduleId, stepId, className }: StepExerciseProps) {
  const ex = stepExerciseFor(moduleId, stepId)
  const [picked, setPicked] = useState<number | null>(null)
  if (!ex) return null
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
      <p className="mt-1 text-sm font-medium text-foreground">{ex.prompt}</p>
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
          </span>
        </p>
      )}
    </section>
  )
}

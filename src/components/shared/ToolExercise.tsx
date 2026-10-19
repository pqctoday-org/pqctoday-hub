// SPDX-License-Identifier: AGPL-3.0-only
/** Round 9, wave 2 (2026-09-19) — "Try it" under a Playground tool (src/data/toolExercises.ts). */
import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TOOL_EXERCISES } from '@/data/toolExercises'
import { BUSINESS_TOOL_EXERCISES } from '@/data/businessToolExercises'
import { PAGE_EXERCISES } from '@/data/pageExercises'
import { cn } from '@/lib/utils'
import type { StepExercise } from '@/data/stepExercises'

/** Stable per-tool rotation: repeat visits stay predictable, correct choices do not. */
export function presentExercise(toolId: string, questionIndex: number, exercise: StepExercise) {
  const seed = [...`${toolId}:${questionIndex}`].reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    7
  )
  const offset = seed % exercise.options.length
  const options = exercise.options.map(
    (_, index) =>
      exercise.options[(index - offset + exercise.options.length) % exercise.options.length]
  )
  return { ...exercise, options, answer: (exercise.answer + offset) % exercise.options.length }
}

export function ToolExercise({
  toolId,
  family = 'playground',
  className,
}: {
  toolId: string
  /** 'page' keys src/data/pageExercises.ts by route (round 9, 2026-09-19). */
  family?: 'playground' | 'business' | 'page'
  className?: string
}) {
  // toolId comes from the registry route (or the router's pathname for 'page'),
  // matched against our own keys.
  /* eslint-disable security/detect-object-injection */
  const list =
    family === 'business'
      ? BUSINESS_TOOL_EXERCISES[toolId]
      : family === 'page'
        ? PAGE_EXERCISES[toolId]
        : TOOL_EXERCISES[toolId]
  /* eslint-enable security/detect-object-injection */
  const [picked, setPicked] = useState<Record<number, number>>({})
  if (!list || list.length === 0) return null
  return (
    <section
      aria-label="Try it"
      data-testid="tool-exercise"
      className={cn('rounded-xl border border-border bg-muted/20 p-4', className)}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Try it
      </p>
      <ol className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
        <li>
          <span className="font-semibold text-foreground">1. Predict</span> before you run it.
        </li>
        <li>
          <span className="font-semibold text-foreground">2. Run</span> or change the tool above.
        </li>
        <li>
          <span className="font-semibold text-foreground">3. Explain</span> what the result shows.
        </li>
      </ol>
      {list.map((ex, qi) => {
        const shown = presentExercise(toolId, qi, ex)
        // eslint-disable-next-line security/detect-object-injection -- qi is the map index
        const p = picked[qi]
        const correct = p !== undefined && p === shown.answer
        return (
          <div key={ex.prompt} className={cn(qi > 0 && 'mt-4 border-t border-border pt-4')}>
            <p className="mt-1 text-sm font-medium text-foreground">{ex.prompt}</p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Answers">
              {shown.options.map((opt, i) => (
                <Button
                  key={opt}
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-pressed={p === i}
                  onClick={() => setPicked((s) => ({ ...s, [qi]: i }))}
                  className={cn(
                    'h-auto whitespace-normal text-left',
                    p !== undefined &&
                      i === shown.answer &&
                      'border-status-success bg-status-success/10',
                    p === i && i !== shown.answer && 'border-status-error bg-status-error/10'
                  )}
                >
                  {opt}
                </Button>
              ))}
            </div>
            {p !== undefined && (
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
                  <XCircle
                    size={16}
                    className="mt-0.5 shrink-0 text-status-error"
                    aria-hidden="true"
                  />
                )}
                <span>
                  <span className="font-semibold">What the result means: </span>
                  <span className="font-semibold">
                    {correct ? 'Right. ' : `Not quite — it is "${shown.options[shown.answer]}". `}
                  </span>
                  {ex.why}
                </span>
              </p>
            )}
          </div>
        )
      })}
    </section>
  )
}

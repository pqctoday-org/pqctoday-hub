// SPDX-License-Identifier: GPL-3.0-only
/** Round 9, wave 2 (2026-09-19) — "Try it" under a Playground tool (src/data/toolExercises.ts). */
import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TOOL_EXERCISES } from '@/data/toolExercises'
import { BUSINESS_TOOL_EXERCISES } from '@/data/businessToolExercises'
import { cn } from '@/lib/utils'

export function ToolExercise({
  toolId,
  family = 'playground',
}: {
  toolId: string
  family?: 'playground' | 'business'
}) {
  // eslint-disable-next-line security/detect-object-injection -- toolId comes from the registry route
  const list = family === 'business' ? BUSINESS_TOOL_EXERCISES[toolId] : TOOL_EXERCISES[toolId]
  const [picked, setPicked] = useState<Record<number, number>>({})
  if (!list || list.length === 0) return null
  return (
    <section
      aria-label="Try it"
      data-testid="tool-exercise"
      className="rounded-xl border border-border bg-muted/20 p-4"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Try it
      </p>
      {list.map((ex, qi) => {
        // eslint-disable-next-line security/detect-object-injection -- qi is the map index
        const p = picked[qi]
        const correct = p !== undefined && p === ex.answer
        return (
          <div key={ex.prompt} className={cn(qi > 0 && 'mt-4 border-t border-border pt-4')}>
            <p className="mt-1 text-sm font-medium text-foreground">{ex.prompt}</p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Answers">
              {ex.options.map((opt, i) => (
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
                      i === ex.answer &&
                      'border-status-success bg-status-success/10',
                    p === i && i !== ex.answer && 'border-status-error bg-status-error/10'
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
                  <span className="font-semibold">
                    {correct ? 'Right. ' : `Not quite — it is "${ex.options[ex.answer]}". `}
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

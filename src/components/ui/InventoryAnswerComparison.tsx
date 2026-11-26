// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { computeAssessment } from '@/hooks/assessmentUtils'
import type { AssessmentInput, AssessmentResult } from '@/hooks/assessmentTypes'
import { Button } from '@/components/ui/button'

export function InventoryAnswerComparison({
  input,
  result,
}: {
  input: AssessmentInput
  result: AssessmentResult
}) {
  const [comparison, setComparison] = useState<AssessmentResult | null>(null)
  const unknown = Boolean(input.currentCryptoUnknown)
  const alternative = unknown ? 'Use a sample RSA-2048 inventory' : 'Mark algorithms as unknown'

  return (
    <details className="bg-card border-2 border-ink rounded-3xl shadow-[0_6px_0_hsl(var(--edge))] mt-4 p-3 text-sm print:hidden">
      <summary className="cursor-pointer font-semibold">Compare one assessment answer</summary>
      <p className="my-2 text-muted-foreground">
        See how the recommendations respond to a change in your answer about algorithms in use. This
        comparison keeps every other answer fixed and leaves your saved assessment intact.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() =>
            setComparison(
              computeAssessment({
                ...input,
                currentCrypto: unknown ? ['RSA-2048'] : [],
                currentCryptoCategories: [],
                currentCryptoUnknown: !unknown,
              })
            )
          }
        >
          {alternative}
        </Button>
        {comparison && (
          <Button type="button" size="sm" variant="outline" onClick={() => setComparison(null)}>
            Clear comparison
          </Button>
        )}
      </div>
      <div className="mt-3" role="status" aria-live="polite">
        {comparison && (
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: 'Saved answers', result },
              { title: alternative, result: comparison },
            ].map(({ title, result: outcome }) => (
              <section
                key={title}
                aria-label={title}
                className="rounded-2xl border border-border p-3"
              >
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1">Priority index {outcome.riskScore}/100</p>
                <p className="mt-2 font-medium">First three recommended actions</p>
                <ol className="ml-5 list-decimal space-y-1">
                  {outcome.recommendedActions.slice(0, 3).map((action) => (
                    <li key={action.priority}>{action.action}</li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </details>
  )
}

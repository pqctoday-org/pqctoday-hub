// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { ListChecks, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CLAIM_SORTER_ITEMS } from '../data/claimSorterData'
import type { ClaimMaturity } from '../data/sourceClaims'
import { ClaimLine } from '../components/ClaimLine'

interface AnswerState {
  maturity?: ClaimMaturity
  scope?: 'full' | 'reduced'
  revealed?: boolean
}

export const ClaimSorter: React.FC = () => {
  const [answers, setAnswers] = useState<ReadonlyMap<string, AnswerState>>(() => new Map())

  const updateAnswer = (id: string, patch: Partial<AnswerState>) => {
    setAnswers((prev) => {
      const next = new Map(prev)
      const cur = next.get(id) ?? {}
      next.set(id, { ...cur, ...patch })
      return next
    })
  }

  const revealedCount = [...answers.values()].filter((a) => a.revealed).length
  const correctCount = CLAIM_SORTER_ITEMS.filter((item) => {
    const a = answers.get(item.id)
    return (
      a?.revealed && a.maturity === item.expectedMaturity && a.scope === item.expectedTargetScope
    )
  }).length

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ListChecks size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gradient">
                Step 4: Claim &amp; Rubric Sorter (12 Statements)
              </h3>
              <p className="text-sm text-muted-foreground">
                Classify each statement by evidence maturity (<code>demonstrated</code>,{' '}
                <code>reported</code>, or <code>hypothesised</code>) and target scope (
                <code>full</code> vs <code>reduced</code>), then check your classification against
                the primary source and Capability Rubric.
              </p>
            </div>
          </div>
          <div className="text-xs px-3 py-1.5 rounded-lg bg-muted/60 border border-border font-medium text-foreground">
            Checked: {revealedCount} / {CLAIM_SORTER_ITEMS.length} &middot; Exact matches:{' '}
            {correctCount}
          </div>
        </div>

        <div className="space-y-4">
          {CLAIM_SORTER_ITEMS.map((item, idx) => {
            const ans = answers.get(item.id) ?? {}
            const isCorrect =
              ans.maturity === item.expectedMaturity && ans.scope === item.expectedTargetScope
            return (
              <div
                key={item.id}
                className="p-4 rounded-lg bg-muted/50 border border-border space-y-3"
              >
                <p className="text-sm font-medium text-foreground">
                  {idx + 1}. {item.statement}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground block">
                      Maturity classification
                    </span>
                    <div
                      className="flex flex-wrap gap-1.5"
                      role="group"
                      aria-label={`Maturity ${idx + 1}`}
                    >
                      {(['demonstrated', 'reported', 'hypothesised'] as const).map((m) => (
                        <Button
                          key={m}
                          type="button"
                          size="sm"
                          variant={ans.maturity === m ? 'gradient' : 'outline'}
                          onClick={() => updateAnswer(item.id, { maturity: m, revealed: false })}
                          className="text-xs"
                          aria-pressed={ans.maturity === m}
                        >
                          {m}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground block">Target scope</span>
                    <div
                      className="flex gap-1.5"
                      role="group"
                      aria-label={`Target scope ${idx + 1}`}
                    >
                      {(['full', 'reduced'] as const).map((sc) => (
                        <Button
                          key={sc}
                          type="button"
                          size="sm"
                          variant={ans.scope === sc ? 'gradient' : 'outline'}
                          onClick={() => updateAnswer(item.id, { scope: sc, revealed: false })}
                          className="text-xs"
                          aria-pressed={ans.scope === sc}
                        >
                          {sc}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="self-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={!ans.maturity || !ans.scope}
                      onClick={() => updateAnswer(item.id, { revealed: true })}
                    >
                      Check &amp; Reveal Source
                    </Button>
                  </div>
                </div>

                {ans.revealed ? (
                  <div className="space-y-3 pt-2 border-t border-border/60">
                    <div
                      className={`p-3 rounded border text-xs flex items-start gap-2 ${
                        isCorrect
                          ? 'bg-status-success/10 border-status-success/30 text-foreground'
                          : 'bg-status-warning/10 border-status-warning/30 text-foreground'
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle2 size={15} className="text-status-success shrink-0 mt-0.5" />
                      ) : (
                        <XCircle size={15} className="text-status-warning shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold">
                          Expected: {item.expectedMaturity} &middot; {item.expectedTargetScope}{' '}
                          target
                        </p>
                        <p className="text-muted-foreground mt-0.5">{item.rationale}</p>
                      </div>
                    </div>
                    <ClaimLine id={item.claimId} />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

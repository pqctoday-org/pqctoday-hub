// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import {
  EVIDENCE_CLASSES,
  EVIDENCE_CLASS_IDS,
  type EvidenceClassId,
} from '@/data/validation/evidenceClasses'
import {
  CLAIM_LADDER,
  EVIDENCE_SCENARIOS,
  NOT_TEST_EVIDENCE,
  type ScenarioAnswer,
} from '../data/evidenceLevels'

const OPTIONS: { id: ScenarioAnswer; label: string }[] = [
  ...EVIDENCE_CLASS_IDS.map((id) => ({ id, label: EVIDENCE_CLASSES[id].label })),
  { id: NOT_TEST_EVIDENCE, label: 'Not test evidence' },
]

const labelFor = (a: ScenarioAnswer) =>
  a === NOT_TEST_EVIDENCE ? 'Not test evidence' : EVIDENCE_CLASSES[a as EvidenceClassId].label

/**
 * Workshop step 1 — classify ten observations into the Hub's eight evidence
 * classes (or "not test evidence"), then see the rung and the only claim the
 * observation permits. The classes come from src/data/validation/evidenceClasses.ts.
 */
export const EvidenceClassifier: React.FC = () => {
  const [answers, setAnswers] = useState<Record<string, ScenarioAnswer>>({})
  const answered = Object.keys(answers).length
  const correct = EVIDENCE_SCENARIOS.filter((s) => answers[s.id] === s.answer).length

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4 text-sm">
        <p className="text-foreground/80">
          Each card is an observation from a test log. Pick the one evidence class it supports — or
          “Not test evidence” if nothing it describes compares an output with an expected value or
          behaviour. The answer shows the highest claim-ladder rung and the only wording the
          observation permits.
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {answered} of {EVIDENCE_SCENARIOS.length} answered · {correct} correct
          </p>
          {answered > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setAnswers({})}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Start over
            </Button>
          ) : null}
        </div>
      </div>

      {EVIDENCE_SCENARIOS.map((s, idx) => {
        const picked = answers[s.id]
        const done = picked !== undefined
        const right = picked === s.answer
        return (
          <article
            key={s.id}
            className="glass-panel space-y-3 p-4"
            aria-labelledby={`evidence-scenario-${s.id}`}
            data-testid={`evidence-scenario-${s.id}`}
          >
            <h3 id={`evidence-scenario-${s.id}`} className="text-sm font-semibold text-foreground">
              Observation {idx + 1}
            </h3>
            <p className="text-sm text-foreground/80">{s.observation}</p>
            <div
              role="group"
              aria-label={`Evidence class for observation ${idx + 1}`}
              className="flex flex-wrap gap-1.5"
            >
              {OPTIONS.map((o) => (
                <Button
                  key={o.id}
                  size="sm"
                  variant={picked === o.id ? 'secondary' : 'outline'}
                  aria-pressed={picked === o.id}
                  disabled={done}
                  onClick={() => setAnswers((a) => ({ ...a, [s.id]: o.id }))}
                  className={clsx(
                    'h-auto whitespace-normal py-1 text-left text-xs',
                    done && o.id === s.answer && 'border-status-success text-status-success'
                  )}
                >
                  {o.label}
                </Button>
              ))}
            </div>
            {done ? (
              <div
                className={clsx(
                  'space-y-1.5 rounded-md border p-3 text-xs',
                  right
                    ? 'border-status-success/40 bg-status-success/10'
                    : 'border-status-error/40 bg-status-error/10'
                )}
              >
                <p className="flex items-center gap-1.5 font-semibold text-foreground">
                  {right ? (
                    <CheckCircle2 size={14} className="text-status-success" aria-hidden="true" />
                  ) : (
                    <XCircle size={14} className="text-status-error" aria-hidden="true" />
                  )}
                  {right ? 'Correct' : `Not quite — the answer is ${labelFor(s.answer)}`}
                </p>
                <p className="text-foreground/80">{s.why}</p>
                <p className="text-muted-foreground">
                  <span className="font-semibold">Claim ladder: </span>
                  {s.rung === null
                    ? 'does not apply to this observation.'
                    : `rung ${s.rung} — ${CLAIM_LADDER[s.rung - 1]}.`}
                </p>
                {s.answer !== NOT_TEST_EVIDENCE ? (
                  <p className="text-muted-foreground">
                    <span className="font-semibold">Permitted claim: </span>“
                    {EVIDENCE_CLASSES[s.answer as EvidenceClassId].permittedClaim}”
                  </p>
                ) : null}
                <p className="text-muted-foreground">
                  <span className="font-semibold">Trap: </span>
                  {s.trap}
                </p>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

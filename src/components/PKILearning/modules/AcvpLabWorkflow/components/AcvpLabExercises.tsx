// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle2, Play, XCircle } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { CONCEPT_CHECKS } from '../data/conceptChecks'
import { Cite } from './Cite'
import { DraftStatusNotice } from './DraftStatusNotice'

interface AcvpLabExercisesProps {
  onOpenWorkshopStep: (step: number) => void
}

const GUIDED: { title: string; step: number; task: string }[] = [
  {
    title: '1. Classify ten test-log observations',
    step: 0,
    task: 'Aim for ten out of ten without guessing: for each miss, reread the permitted claim and ask what external expected value (if any) the observation was compared with.',
  },
  {
    title: '2. Predict the PKCS#11 boundary for a whole vector set',
    step: 1,
    task: 'Load the ML-DSA sigVer sample and predict all twelve groups before revealing any. Which groups are only partly executable, and which per-test field decides it?',
  },
  {
    title: '3. Produce and audit a response artifact',
    step: 2,
    task: 'Run the ML-KEM sample on one engine, then on the other. Do both response.json files compare the same against NIST’s expected results? Which evidence.json fields differ, and why is that difference not a disagreement about the answers?',
  },
]

/** Concept checks + guided workshop tasks. No question here is about this page’s UI. */
export const AcvpLabExercises: React.FC<AcvpLabExercisesProps> = ({ onOpenWorkshopStep }) => {
  const [picked, setPicked] = useState<Record<string, number>>({})
  const correct = CONCEPT_CHECKS.filter((q) => picked[q.id] === q.correct).length

  return (
    <div className="w-full space-y-6">
      <DraftStatusNotice />

      <div className="glass-panel p-6">
        <h2 className="mb-2 text-xl font-bold text-gradient">Guided Workshop Tasks</h2>
        <div className="space-y-3">
          {GUIDED.map((g) => (
            <div
              key={g.title}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <h3 className="font-semibold text-foreground">{g.title}</h3>
                <p className="text-sm text-muted-foreground">{g.task}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => onOpenWorkshopStep(g.step)}
              >
                <Play className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Open step
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel space-y-4 p-6">
        <div>
          <h2 className="text-xl font-bold text-gradient">Check Your Understanding</h2>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {Object.keys(picked).length} of {CONCEPT_CHECKS.length} answered · {correct} correct
          </p>
        </div>
        {CONCEPT_CHECKS.map((q, qi) => {
          const choice = picked[q.id]
          const done = choice !== undefined
          return (
            <fieldset key={q.id} className="space-y-2 rounded-lg border border-border p-4">
              <legend className="px-1 text-sm font-semibold text-foreground">
                {qi + 1}. {q.question}
              </legend>
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => (
                  <Button
                    key={opt}
                    variant="outline"
                    size="sm"
                    aria-pressed={choice === oi}
                    disabled={done}
                    onClick={() => setPicked((p) => ({ ...p, [q.id]: oi }))}
                    className={clsx(
                      'h-auto w-full justify-start whitespace-normal py-2 text-left text-xs',
                      done && oi === q.correct && 'border-status-success text-status-success',
                      done &&
                        choice === oi &&
                        oi !== q.correct &&
                        'border-status-error text-status-error'
                    )}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
              {done ? (
                <div className="space-y-1 rounded-md bg-muted/40 p-3 text-xs">
                  <p className="flex items-center gap-1.5 font-semibold text-foreground">
                    {choice === q.correct ? (
                      <CheckCircle2 size={14} className="text-status-success" aria-hidden="true" />
                    ) : (
                      <XCircle size={14} className="text-status-error" aria-hidden="true" />
                    )}
                    {choice === q.correct ? 'Correct' : 'Not quite'}
                  </p>
                  <p className="text-foreground/80">{q.explanation}</p>
                  <p className="flex flex-wrap gap-1">
                    {q.cites.map((c) => (
                      <Cite key={`${c.s}-${c.at ?? ''}`} s={c.s} at={c.at} />
                    ))}
                  </p>
                </div>
              ) : null}
            </fieldset>
          )
        })}
      </div>
    </div>
  )
}

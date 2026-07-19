// SPDX-License-Identifier: GPL-3.0-only
//
// QuizCard — the knowledge-check footer for a Learn walkthrough: a lesson's
// question bank, answered one pick per question with an immediate reveal +
// "why". Completion (= every question answered correctly at least once this
// attempt) persists per lesson in localStorage under `${namespace}-quiz-
// ${lessonId}` — no backend, no telemetry beyond the existing analytics
// event.
import { useState } from 'react'
import { Award, CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { logEvent } from '@/utils/analytics'

export interface QuizQuestion {
  q: string
  options: string[]
  /** Index into `options`. */
  answer: number
  /** Shown after answering — WHY the right answer is right. */
  why: string
}

const storageKey = (namespace: string, lessonId: string) => `${namespace}-quiz-${lessonId}`

const readDone = (namespace: string, lessonId: string): boolean => {
  try {
    return localStorage.getItem(storageKey(namespace, lessonId)) === '1'
  } catch {
    return false
  }
}

function QuestionBlock({
  index,
  question,
  picked,
  onPick,
}: {
  index: number
  question: QuizQuestion
  picked: number | null
  onPick: (option: number) => void
}) {
  const answered = picked !== null
  return (
    <li className="rounded-lg border border-border bg-background/40 p-3">
      <p className="text-[12.5px] font-medium text-foreground">
        {index + 1}. {question.q}
      </p>
      <div className="mt-2 space-y-1.5">
        {question.options.map((opt, i) => {
          const isAnswer = i === question.answer
          const isPicked = picked === i
          return (
            <Button
              key={i}
              variant="ghost"
              disabled={answered}
              onClick={() => onPick(i)}
              className={cn(
                'flex h-auto w-full items-start justify-start gap-2 whitespace-normal rounded-md border px-2.5 py-1.5 text-left text-[12px]',
                !answered && 'border-border hover:border-primary/40',
                answered && isAnswer && 'border-status-success/60 bg-status-success/10',
                answered &&
                  isPicked &&
                  !isAnswer &&
                  'border-destructive/60 bg-destructive/10 opacity-100',
                answered && !isPicked && !isAnswer && 'border-border opacity-60'
              )}
            >
              {answered && isAnswer && (
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-status-success" />
              )}
              {answered && isPicked && !isAnswer && (
                <XCircle size={13} className="mt-0.5 shrink-0 text-destructive" />
              )}
              <span className="text-foreground">{opt}</span>
            </Button>
          )
        })}
      </div>
      {answered && (
        <p className="mt-2 border-l-2 border-primary/60 bg-muted/30 py-1.5 pl-2.5 text-[11.5px] text-muted-foreground">
          <span className="font-semibold text-foreground">Why · </span>
          {question.why}
        </p>
      )}
    </li>
  )
}

/** NOTE: render with `key={lessonId}` — switching lessons remounts the
 * card, which is what resets the pick state (no effect needed). */
export function QuizCard({
  lessonId,
  questions,
  namespace,
  analyticsCategory,
}: {
  lessonId: string
  questions: QuizQuestion[] | undefined
  /** localStorage key prefix, e.g. `'cacp'` or `'hsm-pkcs11'`. */
  namespace: string
  /** Analytics event category, e.g. `'KMIP Quiz'` / `'PKCS11 Quiz'`. Defaults to `${namespace} Quiz`. */
  analyticsCategory?: string
}) {
  const [picks, setPicks] = useState<(number | null)[]>(() =>
    Array.from({ length: questions?.length ?? 0 }, () => null)
  )
  const [done, setDone] = useState(() => readDone(namespace, lessonId))

  if (!questions?.length) return null

  const answered = picks.filter((p) => p !== null).length
  const correct = picks.filter((p, i) => p === questions[i].answer).length
  const allAnswered = answered === questions.length
  const allCorrect = allAnswered && correct === questions.length

  const onPick = (qi: number, option: number) => {
    const next = picks.map((p, i) => (i === qi ? option : p))
    setPicks(next)
    const nowAnswered = next.filter((p) => p !== null).length
    if (nowAnswered === questions.length) {
      const nowCorrect = next.filter((p, i) => p === questions[i].answer).length
      logEvent(
        'Playground',
        analyticsCategory ?? `${namespace} Quiz`,
        `${lessonId}:${nowCorrect}/${questions.length}`
      )
      if (nowCorrect === questions.length) {
        setDone(true)
        try {
          localStorage.setItem(storageKey(namespace, lessonId), '1')
        } catch {
          /* ignore */
        }
      }
    }
  }

  const reset = () => setPicks(Array.from({ length: questions.length }, () => null))

  return (
    <section className="rounded-xl border border-border bg-card p-4" data-testid="learn-quiz">
      <div className="flex items-center gap-2">
        <Award size={15} className={done ? 'text-status-success' : 'text-primary'} />
        <p className="text-[11px] font-bold uppercase tracking-wide text-foreground">
          Check your understanding
        </p>
        {done && (
          <span className="rounded bg-status-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-status-success">
            Passed
          </span>
        )}
        {allAnswered && (
          <span className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
            {correct}/{questions.length} correct
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="h-6 gap-1 px-2 text-[10.5px] text-muted-foreground hover:text-foreground"
            >
              <RotateCcw size={11} /> Retry
            </Button>
          </span>
        )}
      </div>
      <ol className="mt-3 space-y-2.5">
        {questions.map((q, i) => (
          <QuestionBlock
            key={i}
            index={i}
            question={q}
            picked={picks[i]}
            onPick={(o) => onPick(i, o)}
          />
        ))}
      </ol>
      {allCorrect && (
        <p className="mt-3 text-[12px] text-status-success">
          All correct — you've genuinely got this one.
        </p>
      )}
    </section>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
/**
 * QuizGateModal (WP2.5) — the comprehension check gating a Learn module's
 * "Mark complete" in the embed header. Reuses the real quiz bank's own
 * QuestionCard/FeedbackPanel (src/components/PKILearning/modules/Quiz) — no
 * new question-rendering UI, matching how quizSelection.ts reuses the real
 * question bank rather than authoring new questions.
 *
 * Closes the audit's self-attestation finding: the free one-click "Mark
 * complete" toggle let a player complete a module — which gates program
 * maturity — with zero comprehension check, contradicting the sim's own
 * "no manual bypass" invariant everywhere else. A wrong answer here costs
 * nothing but a retry (this is a comprehension check, not a trap — the
 * trap economy is a different, deliberately costly mechanic); the question
 * itself never changes mid-attempt (picked once per module per run).
 *
 * role="dialog" (not "alertdialog") — matches SimRunComplete: informational
 * flow with a primary action, not a destructive-action interrupt.
 */
import { useEffect, useRef, useState } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuestionCard } from '@/components/PKILearning/modules/Quiz/components/QuestionCard'
import { FeedbackPanel } from '@/components/PKILearning/modules/Quiz/components/FeedbackPanel'
import type { QuizQuestion } from '@/components/PKILearning/modules/Quiz/types'

function isCorrect(question: QuizQuestion, answer: string | string[] | undefined): boolean {
  if (answer === undefined) return false
  if (Array.isArray(question.correctAnswer)) {
    if (!Array.isArray(answer)) return false
    const a = [...answer].sort()
    const b = [...question.correctAnswer].sort()
    return a.length === b.length && a.every((v, i) => v === b[i])
  }
  return answer === question.correctAnswer
}

export interface QuizGateModalProps {
  question: QuizQuestion
  moduleTitle: string
  onPass: () => void
  onCancel: () => void
}

export function QuizGateModal({ question, moduleTitle, onPass, onCancel }: QuizGateModalProps) {
  const reduce = useReducedMotion()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const trapRef = useFocusTrap(true)
  const [answer, setAnswer] = useState<string | string[] | undefined>(undefined)
  const [submitted, setSubmitted] = useState(false)
  const correct = submitted && isCorrect(question, answer)

  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const canSubmit = Array.isArray(answer) ? answer.length > 0 : answer !== undefined
  const retry = () => {
    setSubmitted(false)
    setAnswer(undefined)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quiz-gate-title"
          onClick={(e) => e.stopPropagation()}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          transition={{ duration: reduce ? 0 : 0.16, ease: 'easeOut' }}
          className="w-full max-w-lg rounded-2xl border-2 border-primary/30 bg-card p-5 shadow-2xl"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                One quick check before this counts as done
              </p>
              <h2 id="quiz-gate-title" className="text-sm font-bold text-foreground">
                {moduleTitle}
              </h2>
            </div>
            <Button
              ref={cancelRef}
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancel}
              aria-label="Cancel"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </Button>
          </div>

          <QuestionCard
            question={question}
            selectedAnswer={answer}
            hasSubmitted={submitted}
            onSelectAnswer={setAnswer}
          />

          {submitted && (
            <FeedbackPanel
              isCorrect={correct}
              explanation={question.explanation}
              learnMorePath={question.learnMorePath}
            />
          )}

          <div className="mt-4 flex justify-end gap-2">
            {!submitted ? (
              <Button
                type="button"
                variant="gradient"
                size="sm"
                disabled={!canSubmit}
                onClick={() => setSubmitted(true)}
              >
                Submit
              </Button>
            ) : correct ? (
              <Button
                type="button"
                variant="gradient"
                size="sm"
                onClick={onPass}
                className="gap-1.5"
              >
                <CheckCircle2 size={14} aria-hidden="true" />
                Mark complete
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={retry}>
                Try again
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

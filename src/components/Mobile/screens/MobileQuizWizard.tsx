// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useQuizState } from '@/components/PKILearning/modules/Quiz/hooks/useQuizState'
import { QuestionCard } from '@/components/PKILearning/modules/Quiz/components/QuestionCard'
import { FeedbackPanel } from '@/components/PKILearning/modules/Quiz/components/FeedbackPanel'
import { QuizProgress } from '@/components/PKILearning/modules/Quiz/components/QuizProgress'
import type { QuizQuestion, QuizScoreSummary } from '@/components/PKILearning/modules/Quiz/types'

export interface MobileQuizCompletionData {
  summary: QuizScoreSummary
  answers: Record<string, string | string[]>
  results: Record<string, boolean>
}

export interface MobileQuizWizardProps {
  questions: QuizQuestion[]
  /** "Checkpoint quiz — Foundations", the capstone's persona label, etc. —
   *  shown above the question, matching the handoff ("Source module named
   *  above each question"). */
  title: string
  onComplete: (data: MobileQuizCompletionData) => void
  onExit: () => void
}

/**
 * Handoff screen 5 — Checkpoint quiz sheet. One question per screen, reusing
 * useQuizState (the real reducer/scoring engine desktop's QuizWizard also
 * uses) plus QuestionCard/FeedbackPanel/QuizProgress verbatim — all three
 * already carry no desktop-only layout assumptions (44px touch targets,
 * plain flex/grid; QuizProgress already ships its own compact mobile
 * branch), so this is real reuse, not a second implementation of scoring or
 * question rendering. Only the outer chrome (header, spacing, action bar) is
 * mobile-specific.
 */
export function MobileQuizWizard({ questions, title, onComplete, onExit }: MobileQuizWizardProps) {
  const {
    state,
    currentQuestion,
    currentAnswer,
    hasAnswered,
    isLastQuestion,
    startQuiz,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    getScoreSummary,
  } = useQuizState()

  useEffect(() => {
    if (questions.length > 0) startQuiz(questions)
  }, [questions, startQuiz])

  useEffect(() => {
    if (state.isComplete) {
      onComplete({
        summary: getScoreSummary(),
        answers: { ...state.answers },
        results: { ...state.results },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isComplete])

  if (!currentQuestion) return null

  const isSubmitted = state.hasSubmittedCurrent
  const questionIds = state.questions.map((q) => q.id)

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onExit}
          className="h-auto p-0 text-[11.5px] font-bold text-muted-foreground"
        >
          Exit
        </Button>
        <span className="text-[10.5px] font-bold uppercase tracking-wide text-primary">
          {title}
        </span>
      </div>

      <QuizProgress
        currentIndex={state.currentIndex}
        total={state.questions.length}
        results={state.results}
        questionIds={questionIds}
      />

      <div className="glass-panel p-4">
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={currentAnswer}
          hasSubmitted={isSubmitted}
          onSelectAnswer={(answer) => selectAnswer(currentQuestion.id, answer)}
        />
        {isSubmitted && (
          <FeedbackPanel
            isCorrect={state.results[currentQuestion.id] ?? false}
            explanation={currentQuestion.explanation}
            learnMorePath={currentQuestion.learnMorePath}
          />
        )}
      </div>

      {!isSubmitted && (
        <Button
          type="button"
          onClick={submitAnswer}
          disabled={!hasAnswered}
          className="h-11 w-full rounded-[10px] bg-primary text-[13.5px] font-bold text-primary-foreground"
        >
          Check answer
        </Button>
      )}
      {isSubmitted && !isLastQuestion && (
        <Button
          type="button"
          onClick={nextQuestion}
          className="h-11 w-full rounded-[10px] bg-primary text-[13.5px] font-bold text-primary-foreground"
        >
          Next question
        </Button>
      )}
      {isSubmitted && isLastQuestion && (
        <Button
          type="button"
          onClick={nextQuestion}
          className="h-11 w-full rounded-[10px] bg-primary text-[13.5px] font-bold text-primary-foreground"
        >
          See your result
        </Button>
      )}
    </div>
  )
}

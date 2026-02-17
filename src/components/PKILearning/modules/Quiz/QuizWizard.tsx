import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuizProgress } from './components/QuizProgress'
import { QuestionCard } from './components/QuestionCard'
import { FeedbackPanel } from './components/FeedbackPanel'
import { useQuizState } from './hooks/useQuizState'
import type { QuizQuestion, QuizScoreSummary } from './types'

export interface QuizCompletionData {
  summary: QuizScoreSummary
  answers: Record<string, string | string[]>
  results: Record<string, boolean>
}

interface QuizWizardProps {
  questions: QuizQuestion[]
  onComplete: (data: QuizCompletionData) => void
  onExit: () => void
}

export const QuizWizard: React.FC<QuizWizardProps> = ({ questions, onComplete, onExit }) => {
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
    prevQuestion,
    getScoreSummary,
  } = useQuizState()

  useEffect(() => {
    if (questions.length > 0) {
      startQuiz(questions)
    }
  }, [questions, startQuiz])

  const buildCompletionData = (): QuizCompletionData => ({
    summary: getScoreSummary(),
    answers: { ...state.answers },
    results: { ...state.results },
  })

  useEffect(() => {
    if (state.isComplete) {
      onComplete(buildCompletionData())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isComplete])

  if (!currentQuestion) return null

  const handleCheckAnswer = () => {
    submitAnswer()
  }

  const handleNext = () => {
    nextQuestion()
  }

  const handleFinish = () => {
    onComplete(buildCompletionData())
  }

  const questionIds = state.questions.map((q) => q.id)
  const isSubmitted = state.hasSubmittedCurrent

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Exit Quiz
        </button>
        <span className="text-sm text-muted-foreground">
          {Object.keys(state.results).length} of {state.questions.length} answered
        </span>
      </div>

      <QuizProgress
        currentIndex={state.currentIndex}
        total={state.questions.length}
        results={state.results}
        questionIds={questionIds}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="glass-panel p-6 md:p-8"
        >
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
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={prevQuestion}
          disabled={state.currentIndex === 0}
          className="gap-1"
        >
          <ChevronLeft size={16} />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {!isSubmitted && (
            <Button variant="gradient" onClick={handleCheckAnswer} disabled={!hasAnswered}>
              <Check size={16} className="mr-1" />
              Check Answer
            </Button>
          )}

          {isSubmitted && !isLastQuestion && (
            <Button variant="gradient" onClick={handleNext} className="gap-1">
              Next Question
              <ChevronRight size={16} />
            </Button>
          )}

          {isSubmitted && isLastQuestion && (
            <Button variant="gradient" onClick={handleFinish}>
              See Results
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

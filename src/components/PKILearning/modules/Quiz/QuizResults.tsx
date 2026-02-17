import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScoreBreakdown } from './components/ScoreBreakdown'
import { FeedbackPanel } from './components/FeedbackPanel'
import { QuestionCard } from './components/QuestionCard'
import type { QuizScoreSummary, QuizQuestion, CategoryScore } from './types'
import clsx from 'clsx'

interface QuizResultsProps {
  summary: QuizScoreSummary
  questions: QuizQuestion[]
  answers: Record<string, string | string[]>
  results: Record<string, boolean>
  onRetake: () => void
  onChangeTopics: () => void
}

function getTierMessage(percentage: number): { message: string; color: string } {
  if (percentage >= 90)
    return { message: 'Excellent! You have a strong grasp of PQC concepts.', color: 'text-success' }
  if (percentage >= 70)
    return {
      message: 'Good work! Review the topics below for areas to improve.',
      color: 'text-primary',
    }
  if (percentage >= 50)
    return {
      message: 'Getting there. Focus on the categories where you scored lowest.',
      color: 'text-warning',
    }
  return {
    message: 'Consider reviewing the learning modules to strengthen your PQC knowledge.',
    color: 'text-destructive',
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  summary,
  questions,
  answers,
  results,
  onRetake,
  onChangeTopics,
}) => {
  const [showReview, setShowReview] = useState(false)
  const tier = getTierMessage(summary.overall.percentage)

  const scoreColor =
    summary.overall.percentage >= 80
      ? 'text-success'
      : summary.overall.percentage >= 60
        ? 'text-warning'
        : 'text-destructive'

  return (
    <div className="space-y-8">
      {/* Overall score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="glass-panel p-6 md:p-8 text-center"
      >
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-4">
          <Trophy className="text-primary" size={32} />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gradient">Quiz Complete</h2>
        <div className={clsx('text-5xl md:text-6xl font-bold my-4', scoreColor)}>
          {summary.overall.percentage}%
        </div>
        <p className="text-lg text-muted-foreground mb-1">
          {summary.overall.correct} of {summary.overall.total} correct
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Time: {formatTime(summary.timeSpentSeconds)}
        </p>
        <p className={clsx('text-sm font-medium', tier.color)}>{tier.message}</p>
      </motion.div>

      {/* Category breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-panel p-6"
      >
        <ScoreBreakdown scores={summary.byCategory} />
      </motion.div>

      {/* Difficulty breakdown */}
      {Object.keys(summary.byDifficulty).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="glass-panel p-6"
        >
          <ScoreBreakdown
            scores={summary.byDifficulty as Record<string, CategoryScore>}
            title="Score by Difficulty"
          />
        </motion.div>
      )}

      {/* Review toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <button
          onClick={() => setShowReview((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors w-full justify-center"
        >
          {showReview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showReview ? 'Hide Review' : 'Review All Answers'}
        </button>

        {showReview && (
          <div className="mt-6 space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="glass-panel p-5">
                <p className="text-xs text-muted-foreground mb-3">
                  Question {index + 1} of {questions.length}
                </p>
                <QuestionCard
                  question={question}
                  selectedAnswer={answers[question.id]}
                  hasSubmitted={true}
                  onSelectAnswer={() => {}}
                />
                <FeedbackPanel
                  isCorrect={results[question.id] ?? false}
                  explanation={question.explanation}
                  learnMorePath={question.learnMorePath}
                />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button variant="gradient" onClick={onRetake} className="gap-2">
          <RotateCcw size={16} />
          Retake Quiz
        </Button>
        <Button variant="outline" onClick={onChangeTopics} className="gap-2">
          <ArrowLeft size={16} />
          Try Different Topics
        </Button>
      </div>
    </div>
  )
}

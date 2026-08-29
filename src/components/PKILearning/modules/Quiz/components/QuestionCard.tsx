// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import clsx from 'clsx'
import type { QuizQuestion } from '../types'
import { Button } from '@/components/ui/button'
import { quizCategories } from '@/data/quizDataLoader'

const CATEGORY_LABEL = new Map(quizCategories.map((c) => [c.id, c.label]))

interface QuestionCardProps {
  question: QuizQuestion
  selectedAnswer: string | string[] | undefined
  hasSubmitted: boolean
  onSelectAnswer: (answer: string | string[]) => void
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedAnswer,
  hasSubmitted,
  onSelectAnswer,
}) => {
  const isMultiSelect = question.type === 'multi-select'
  const correctAnswer = question.correctAnswer

  const handleOptionClick = (optionId: string) => {
    if (hasSubmitted) return

    if (isMultiSelect) {
      const current = (selectedAnswer as string[]) || []
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      onSelectAnswer(next)
    } else {
      onSelectAnswer(optionId)
    }
  }

  const isSelected = (optionId: string): boolean => {
    if (!selectedAnswer) return false
    if (isMultiSelect) return (selectedAnswer as string[]).includes(optionId)
    return selectedAnswer === optionId
  }

  const isCorrectOption = (optionId: string): boolean => {
    if (Array.isArray(correctAnswer)) return correctAnswer.includes(optionId)
    return correctAnswer === optionId
  }

  const getOptionClasses = (optionId: string): string => {
    const selected = isSelected(optionId)
    const correct = isCorrectOption(optionId)

    if (hasSubmitted) {
      if (correct) return 'border-success bg-success/10 text-success'
      if (selected && !correct) return 'border-destructive bg-destructive/10 text-status-error'
      return 'border-border text-muted-foreground opacity-60'
    }

    if (selected) return 'border-primary bg-primary/10 text-primary'
    return 'border-border text-muted-foreground hover:border-primary/30'
  }

  const difficultyColor = {
    beginner: 'text-success',
    intermediate: 'text-warning',
    advanced: 'text-destructive',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={clsx(
            'text-xs font-bold uppercase tracking-wider',
            difficultyColor[question.difficulty]
          )}
        >
          {question.difficulty}
        </span>
        {isMultiSelect && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 font-medium">
            Select all that apply
          </span>
        )}
      </div>

      {/* Source category, named above the question (design handoff §5 —
          "Source module named above each question"). Neither desktop's nor
          mobile's quiz wizard previously showed this at all (2026-08-24
          audit R4.1): a question's real `category` field maps to a real
          quizCategories label — this is the closest honest source context
          available. A specific per-question lm_id/module title (the
          handoff's literal "PQC 101 · LM-001" example) has no such mapping
          in the data model; showing that would mean inventing an
          association, not distilling a real one. */}
      <p
        data-testid="question-source-category"
        className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {CATEGORY_LABEL.get(question.category) ?? question.category}
      </p>
      <h3 className="text-lg font-bold text-foreground leading-relaxed">{question.question}</h3>

      <div
        className={clsx(
          'grid gap-2',
          question.type === 'true-false' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
        )}
        role={isMultiSelect ? 'group' : 'radiogroup'}
        aria-label="Answer options"
      >
        {question.options.map((option) => (
          <Button
            variant="ghost"
            key={option.id}
            role={isMultiSelect ? undefined : 'radio'}
            aria-checked={isMultiSelect ? undefined : isSelected(option.id)}
            aria-pressed={isMultiSelect ? isSelected(option.id) : undefined}
            disabled={hasSubmitted}
            onClick={() => handleOptionClick(option.id)}
            className={clsx(
              'p-4 min-h-[44px] h-auto rounded-lg border text-left transition-colors whitespace-normal',
              getOptionClasses(option.id),
              !hasSubmitted && 'cursor-pointer',
              hasSubmitted && 'cursor-default'
            )}
          >
            <span className="text-sm font-medium">{option.text}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}

import React from 'react'
import clsx from 'clsx'
import type { QuizQuestion } from '../types'

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
      if (selected && !correct) return 'border-destructive bg-destructive/10 text-destructive'
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
          <button
            key={option.id}
            role={isMultiSelect ? undefined : 'radio'}
            aria-checked={isMultiSelect ? undefined : isSelected(option.id)}
            aria-pressed={isMultiSelect ? isSelected(option.id) : undefined}
            disabled={hasSubmitted}
            onClick={() => handleOptionClick(option.id)}
            className={clsx(
              'p-4 rounded-lg border text-left transition-colors',
              getOptionClasses(option.id),
              !hasSubmitted && 'cursor-pointer',
              hasSubmitted && 'cursor-default'
            )}
          >
            <span className="text-sm font-medium">{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

import React from 'react'
import clsx from 'clsx'
import type { CategoryScore, QuizCategory } from '../types'
import { QUIZ_CATEGORIES } from '@/data/quizData'

interface ScoreBreakdownProps {
  scores: Partial<Record<QuizCategory, CategoryScore>>
  title?: string
}

function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-success'
  if (percentage >= 60) return 'text-warning'
  return 'text-destructive'
}

function getBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-success'
  if (percentage >= 60) return 'bg-warning'
  return 'bg-destructive'
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  scores,
  title = 'Score by Category',
}) => {
  const entries = Object.entries(scores) as [QuizCategory, CategoryScore][]
  if (entries.length === 0) return null

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">{title}</h4>
      <div className="space-y-3">
        {entries.map(([categoryId, score]) => {
          const meta = QUIZ_CATEGORIES.find((c) => c.id === categoryId)
          const label = meta?.label ?? categoryId

          return (
            <div key={categoryId}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className={clsx('text-sm font-bold', getScoreColor(score.percentage))}>
                  {score.correct}/{score.total} ({score.percentage}%)
                </span>
              </div>
              <div className="h-2.5 bg-border rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all duration-500',
                    getBarColor(score.percentage)
                  )}
                  style={{ width: `${score.percentage}%` }}
                  role="progressbar"
                  aria-valuenow={score.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${label}: ${score.percentage}%`}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

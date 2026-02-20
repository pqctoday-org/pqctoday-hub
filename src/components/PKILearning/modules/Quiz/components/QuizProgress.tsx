/* eslint-disable security/detect-object-injection */
import React from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import clsx from 'clsx'

interface QuizProgressProps {
  currentIndex: number
  total: number
  results: Record<string, boolean>
  questionIds: string[]
}

export const QuizProgress: React.FC<QuizProgressProps> = ({
  currentIndex,
  total,
  results,
  questionIds,
}) => {
  const progress = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0

  return (
    <>
      {/* Mobile: compact bar */}
      <div className="sm:hidden mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Question {currentIndex + 1} of {total}
          </span>
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={total}
            aria-label={`Question ${currentIndex + 1} of ${total}`}
          />
        </div>
      </div>

      {/* Desktop: dot indicators */}
      <div className="hidden sm:flex items-center justify-center gap-1.5 mb-6 flex-wrap">
        {questionIds.map((id, index) => {
          const isCurrent = index === currentIndex
          const isAnswered = results[id] !== undefined
          const isCorrect = results[id]

          return (
            <div
              key={id}
              className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200',
                isCurrent && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                isAnswered && isCorrect && 'bg-success/20 text-success border border-success/40',
                isAnswered &&
                  !isCorrect &&
                  'bg-destructive/20 text-destructive border border-destructive/40',
                !isAnswered && isCurrent && 'bg-primary/20 text-primary border border-primary/40',
                !isAnswered &&
                  !isCurrent &&
                  'bg-muted/30 text-muted-foreground border border-border'
              )}
              aria-label={`Question ${index + 1}${isAnswered ? (isCorrect ? ', correct' : ', incorrect') : isCurrent ? ', current' : ''}`}
            >
              {isAnswered && isCorrect ? (
                <CheckCircle size={14} />
              ) : isAnswered && !isCorrect ? (
                <XCircle size={14} />
              ) : (
                index + 1
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

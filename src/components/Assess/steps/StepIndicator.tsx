// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'react'

import { Button } from '../../ui/button'

import clsx from 'clsx'

function StepIndicator({
  current,
  total,
  titles,
  onStepClick,
}: {
  current: number
  total: number
  titles: string[]
  /** Called when user clicks any step to jump to it. */
  onStepClick?: (step: number) => void
}) {
  const activeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [current])

  return (
    <>
      {/* Compact display for small screens */}
      <div className="flex items-center justify-center gap-3 mb-6 sm:hidden">
        <span className="text-sm font-bold text-primary">
          Step {current + 1} of {total}
        </span>
        <div
          className="flex-1 max-w-48 h-2 rounded-full bg-border overflow-hidden"
          role="progressbar"
          aria-label="Assessment progress"
          aria-valuenow={current + 1}
          aria-valuemin={1}
          aria-valuemax={total}
        >
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((current + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Full step indicator for larger screens */}
      <div
        className="hidden sm:flex items-center gap-1 md:gap-2 mb-6 overflow-x-auto pb-2"
        role="group"
        aria-label="Assessment progress"
      >
        {Array.from({ length: total }, (_, i) => {
          const isCompleted = i < current
          const isCurrent = i === current
          const isClickable = !!onStepClick && !isCurrent

          return (
            <div
              key={i}
              ref={isCurrent ? activeRef : undefined}
              className="flex items-center gap-1 md:gap-2"
            >
              <div className="flex flex-col items-center gap-1">
                <Button
                  variant="ghost"
                  type="button"
                  disabled={isCurrent}
                  onClick={() => isClickable && onStepClick(i)}
                  aria-current={isCurrent ? 'step' : undefined}
                  // eslint-disable-next-line security/detect-object-injection
                  aria-label={`Step ${i + 1}: ${titles[i] ?? ''}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
                  className={clsx(
                    'w-7 h-7 md:w-8 md:h-8 rounded-full p-0 border-2 transition-transform',
                    isCurrent
                      ? 'border-primary text-primary bg-primary/10 hover:bg-primary/10'
                      : isCompleted
                        ? 'border-success text-success bg-success/10 hover:bg-success/10'
                        : 'border-border text-muted-foreground hover:bg-transparent',
                    isClickable && 'cursor-pointer hover:scale-110',
                    isClickable && isCompleted && 'hover:bg-success/20 hover:border-success/80',
                    isClickable &&
                      !isCompleted &&
                      'hover:border-primary/50 hover:text-primary hover:bg-primary/5'
                  )}
                >
                  {isCompleted ? '✓' : i + 1}
                </Button>
                <span
                  className={clsx(
                    'text-[10px] md:text-xs font-medium transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[3.5rem] sm:max-w-none sm:overflow-visible',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {/* eslint-disable-next-line security/detect-object-injection */}
                  {titles[i]}
                </span>
              </div>
              {i < total - 1 && (
                <div
                  className={clsx(
                    'w-4 md:w-8 h-0.5 self-start mt-3.5',
                    isCompleted ? 'bg-success' : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

export { StepIndicator }

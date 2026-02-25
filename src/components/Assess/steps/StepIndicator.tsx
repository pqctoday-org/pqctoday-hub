import { useEffect, useRef } from 'react'

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
  /** Called when user clicks a completed step to jump back to it. */
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
        <div className="flex-1 max-w-48 h-2 rounded-full bg-border overflow-hidden">
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
          const isClickable = isCompleted && onStepClick

          return (
            <div
              key={i}
              ref={isCurrent ? activeRef : undefined}
              className="flex items-center gap-1 md:gap-2"
            >
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(i)}
                  aria-current={isCurrent ? 'step' : undefined}
                  // eslint-disable-next-line security/detect-object-injection
                  aria-label={`Step ${i + 1}: ${titles[i] ?? ''}${isCompleted ? ' (completed — click to edit)' : isCurrent ? ' (current)' : ''}`}
                  className={clsx(
                    'w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold border-2 transition-colors',
                    isCurrent
                      ? 'border-primary text-primary bg-primary/10'
                      : isCompleted
                        ? 'border-success text-success bg-success/10'
                        : 'border-border text-muted-foreground',
                    isClickable &&
                      'cursor-pointer hover:bg-success/20 hover:border-success/80 hover:scale-110 transition-transform'
                  )}
                >
                  {isCompleted ? '✓' : i + 1}
                </button>
                <span
                  className={clsx(
                    'text-[9px] md:text-[10px] font-medium transition-colors whitespace-nowrap',
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

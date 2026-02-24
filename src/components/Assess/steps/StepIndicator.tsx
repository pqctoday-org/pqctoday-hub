import { useEffect, useRef } from 'react'

import clsx from 'clsx'

function StepIndicator({
  current,
  total,
  titles,
}: {
  current: number
  total: number
  titles: string[]
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
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            ref={i === current ? activeRef : undefined}
            className="flex items-center gap-1 md:gap-2"
          >
            <div className="flex flex-col items-center gap-1">
              <div
                aria-current={i === current ? 'step' : undefined}
                // eslint-disable-next-line security/detect-object-injection
                aria-label={`Step ${i + 1}: ${titles[i] ?? ''}${i < current ? ' (completed)' : i === current ? ' (current)' : ''}`}
                className={clsx(
                  'w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold border-2 transition-colors',
                  i === current
                    ? 'border-primary text-primary bg-primary/10'
                    : i < current
                      ? 'border-success text-success bg-success/10'
                      : 'border-border text-muted-foreground'
                )}
              >
                {i < current ? '✓' : i + 1}
              </div>
              <span
                className={clsx(
                  'text-[9px] md:text-[10px] font-medium transition-colors whitespace-nowrap',
                  i === current ? 'text-foreground' : 'text-muted-foreground'
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
                  i < current ? 'bg-success' : 'bg-border'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </>
  )
}

export { StepIndicator }

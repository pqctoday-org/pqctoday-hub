import React from 'react'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  className = '',
}) => {
  const percentage = Math.round(((currentStep + 1) / totalSteps) * 100)

  return (
    <div className={`space-y-2 max-w-full ${className}`}>
      {/* Stats - moved above progress bar */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Module {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-primary font-medium">{percentage}% Complete</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-full bg-muted/30 rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(percentage, 100)}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${percentage}%`}
        />
      </div>
    </div>
  )
}

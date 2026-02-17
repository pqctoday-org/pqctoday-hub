import React from 'react'
import type { MigrationStep } from '../../types/MigrateTypes'
import { STEP_PHASE_COLORS } from '../../data/migrationWorkflowData'

interface MigrationStepIndicatorProps {
  steps: MigrationStep[]
  activeStepId: string | null
  onStepClick: (stepId: string) => void
}

export const MigrationStepIndicator: React.FC<MigrationStepIndicatorProps> = ({
  steps,
  activeStepId,
  onStepClick,
}) => {
  return (
    <div className="w-full overflow-x-auto pb-2 -mb-2">
      <div className="flex items-center justify-between min-w-[600px] px-2 sm:px-4">
        {steps.map((step, index) => {
          const isActive = step.id === activeStepId
          const phaseColor = STEP_PHASE_COLORS[step.id]

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => onStepClick(step.id)}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
                aria-label={`Step ${step.stepNumber}: ${step.title}`}
                aria-pressed={isActive}
              >
                <div
                  className={`
                    flex items-center justify-center
                    w-9 h-9 sm:w-11 sm:h-11
                    rounded-full
                    text-sm sm:text-base
                    font-bold
                    transition-all duration-300
                    ${
                      isActive
                        ? 'text-primary-foreground ring-2 ring-offset-2 ring-offset-background scale-110'
                        : 'bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:scale-105'
                    }
                  `}
                  style={
                    isActive
                      ? {
                          backgroundColor: `hsl(var(--${phaseColor}))`,
                          boxShadow: `0 0 20px hsl(var(--${phaseColor}) / 0.4)`,
                          ringColor: `hsl(var(--${phaseColor}))`,
                        }
                      : undefined
                  }
                >
                  {step.stepNumber}
                </div>
                <span
                  className={`
                    text-[10px] sm:text-xs font-medium transition-colors duration-200
                    ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}
                  `}
                >
                  {step.shortTitle}
                </span>
              </button>

              {index < steps.length - 1 && (
                <div className="h-0.5 flex-1 min-w-[24px] sm:min-w-[40px] bg-muted mx-1 sm:mx-2 self-start mt-[18px] sm:mt-[22px]" />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

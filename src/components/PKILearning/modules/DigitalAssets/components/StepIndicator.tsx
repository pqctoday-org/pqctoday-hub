import React from 'react'
import { Check } from 'lucide-react'

interface StepIndicatorProps {
    totalSteps: number
    currentStep: number
    className?: string
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
    totalSteps,
    currentStep,
    className = '',
}) => {
    return (
        <div className={`flex items-center gap-1 sm:gap-2 ${className}`}>
            {Array.from({ length: totalSteps }).map((_, index) => {
                const isComplete = index < currentStep
                const isCurrent = index === currentStep

                return (
                    <React.Fragment key={index}>
                        {/* Step Circle/Dash */}
                        <div
                            className={`
                flex items-center justify-center
                w-6 h-6 sm:w-8 sm:h-8
                rounded-full
                text-xs sm:text-sm
                font-medium
                transition-all duration-300
                ${isComplete
                                    ? 'bg-success text-success-foreground'
                                    : isCurrent
                                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                                        : 'bg-muted text-muted-foreground'
                                }
              `}
                        >
                            {isComplete ? <Check size={14} className="sm:w-4 sm:h-4" /> : index + 1}
                        </div>

                        {/* Connector Line */}
                        {index < totalSteps - 1 && (
                            <div
                                className={`
                  h-0.5 flex-1 min-w-[8px] sm:min-w-[16px]
                  transition-all duration-300
                  ${isComplete ? 'bg-success' : 'bg-muted'}
                `}
                            />
                        )}
                    </React.Fragment>
                )
            })}
        </div>
    )
}

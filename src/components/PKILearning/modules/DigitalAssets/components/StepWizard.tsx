import React, { useEffect, useRef } from 'react'
import { ChevronRight, ChevronLeft, Play, CheckCircle, AlertCircle } from 'lucide-react'
// Removed unused imports

export interface Step {
  id: string
  title: string
  description: string
  code: string
  language: 'bash' | 'javascript'
  actionLabel?: string
}

interface StepWizardProps {
  steps: Step[]
  currentStepIndex: number
  onNext: () => void
  onBack: () => void
  onExecute: () => Promise<void>
  isExecuting: boolean
  output: string | null
  error: string | null
  isStepComplete: boolean
}

export const StepWizard: React.FC<StepWizardProps> = ({
  steps,
  currentStepIndex,
  onNext,
  onBack,
  onExecute,
  isExecuting,
  output,
  error,
  isStepComplete,
}) => {
  const step = steps[currentStepIndex]
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column: Instructions & Controls */}
      <div className="flex flex-col space-y-6">
        <div className="bg-surface-800/50 border border-white/10 rounded-xl p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-primary-400">
              STEP {currentStepIndex + 1} OF {steps.length}
            </span>
            <div className="flex gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 w-6 rounded-full transition-colors ${
                    idx <= currentStepIndex ? 'bg-primary-500' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
          <p className="text-muted-foreground mb-6">{step.description}</p>

          <div className="bg-black/40 rounded-lg p-4 font-mono text-sm border border-white/5 mb-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-2">
              <span className="text-xs text-muted-foreground uppercase">{step.language}</span>
            </div>
            <pre className="text-primary-300 whitespace-pre-wrap">{step.code}</pre>
          </div>

          <div className="mt-auto flex gap-4">
            <button
              onClick={onBack}
              disabled={currentStepIndex === 0 || isExecuting}
              className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            {!isStepComplete ? (
              <button
                onClick={onExecute}
                disabled={isExecuting}
                className="flex-1 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    {step.actionLabel || 'Execute Command'}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={onNext}
                disabled={currentStepIndex === steps.length - 1}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next Step
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Output & Visualization */}
      <div className="flex flex-col space-y-6">
        <div className="bg-black/80 border border-white/10 rounded-xl p-4 flex-1 flex flex-col font-mono text-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 bg-white/5 p-2 flex items-center justify-between border-b border-white/10">
            <span className="text-xs text-muted-foreground">TERMINAL OUTPUT</span>
            {isStepComplete && <CheckCircle size={14} className="text-green-500" />}
          </div>

          <div className="mt-8 flex-1 overflow-y-auto min-h-[300px]" ref={outputRef}>
            {output ? (
              <pre className="text-green-400 whitespace-pre-wrap break-all">{output}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-white/20">
                Waiting for execution...
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <pre className="whitespace-pre-wrap break-all">{error}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

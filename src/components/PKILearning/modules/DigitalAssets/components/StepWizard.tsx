import React, { useEffect, useRef } from 'react'
import { ChevronRight, ChevronLeft, Play, CheckCircle, AlertCircle } from 'lucide-react'
import { OutputFormatter } from './OutputFormatter'
import { CopyButton } from './CopyButton'

export interface Step {
  id: string
  title: string
  description: string | React.ReactNode
  code: string
  language: 'bash' | 'javascript'
  actionLabel?: string
  explanationTable?: {
    label: string
    value: string | React.ReactNode
    description: string
  }[]
  diagram?: React.ReactNode
  customControls?: React.ReactNode
}

interface StepWizardProps {
  steps: Step[]
  currentStepIndex: number
  onNext: () => void
  onBack: () => void
  onComplete?: () => void
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
  onComplete,
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
    <div className="max-w-7xl mx-auto h-full">
      {/* Main Step Content - Full Width */}
      <div className="glass-panel border border-border rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <span className="text-xs font-mono text-primary">
            STEP {currentStepIndex + 1} OF {steps.length}
          </span>
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  idx <= currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{step.title}</h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-6">{step.description}</p>

        {/* Optional diagram */}
        {step.diagram && <div className="mb-6">{step.diagram}</div>}

        {step.explanationTable ? (
          <div className="mb-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="p-2 sm:p-3 font-medium">Field</th>
                  <th className="p-2 sm:p-3 font-medium">Value</th>
                  <th className="p-2 sm:p-3 font-medium hidden sm:table-cell">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {step.explanationTable.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="p-2 sm:p-3 font-mono text-primary text-xs sm:text-sm break-words">
                      {row.label}
                    </td>
                    <td className="p-2 sm:p-3 font-mono text-foreground/80 text-xs sm:text-sm break-all">
                      {row.value}
                    </td>
                    <td className="p-2 sm:p-3 text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">
                      {row.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-muted/40 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm border border-border mb-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-2 border-b border-border pb-2">
              <span className="text-xs text-muted-foreground uppercase">{step.language}</span>
            </div>
            <pre className="text-primary whitespace-pre-wrap break-all break-words max-w-full">
              {step.code}
            </pre>
          </div>
        )}

        {/* Custom Controls (if any) */}
        {step.customControls}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onBack}
            disabled={isExecuting}
            className="px-4 py-3 min-h-[44px] min-w-[44px] rounded-lg border border-border text-foreground hover:bg-muted/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>

          {!isStepComplete ? (
            <>
              <button
                onClick={onExecute}
                disabled={isExecuting}
                className="flex-1 px-4 py-3 min-h-[44px] rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    {step.actionLabel || 'Execute Command'}
                  </>
                )}
              </button>
              <button
                onClick={onNext}
                disabled={currentStepIndex === steps.length - 1 || isExecuting}
                className="px-4 py-3 min-h-[44px] min-w-[44px] rounded-lg border border-border text-foreground hover:bg-muted/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                title="Skip this step"
              >
                <span className="hidden sm:inline">Skip</span>
                <ChevronRight size={16} />
              </button>
            </>
          ) : currentStepIndex === steps.length - 1 ? (
            <button
              onClick={onComplete || onBack}
              className="flex-1 px-4 py-3 min-h-[44px] rounded-lg bg-success hover:bg-success/90 text-success-foreground font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              Completed
            </button>
          ) : (
            <button
              onClick={onNext}
              className="flex-1 px-4 py-3 min-h-[44px] rounded-lg bg-success hover:bg-success/90 text-success-foreground font-medium transition-colors flex items-center justify-center gap-2"
            >
              Next Step
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Output - Full Width Below */}
      <div className="bg-muted/30 border border-border rounded-xl overflow-hidden max-h-[350px]">
        <div className="bg-muted/20 p-3 flex items-center justify-between border-b border-border">
          <span className="text-xs text-muted-foreground">TERMINAL OUTPUT</span>
          <div className="flex items-center gap-2">
            {isStepComplete && <CheckCircle size={14} className="text-success" />}
            {output && <CopyButton text={output} label="" />}
          </div>
        </div>

        <div
          className="p-4 overflow-x-auto overflow-y-auto min-h-[150px] max-h-[250px] font-mono text-sm"
          ref={outputRef}
        >
          {output ? (
            <OutputFormatter output={output} />
          ) : (
            <div className="h-full flex items-center justify-center text-foreground/20 text-sm">
              Waiting for execution...
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <pre className="whitespace-pre-wrap break-all break-words max-w-full text-xs sm:text-sm">
                {error}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

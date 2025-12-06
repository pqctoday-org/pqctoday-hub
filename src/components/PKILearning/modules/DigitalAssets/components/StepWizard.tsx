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
  explanationTable?: {
    label: string
    value: string | React.ReactNode
    description: string
  }[]
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
    <div className="max-w-7xl mx-auto h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Left Column: Instructions & Controls */}
        <div className="flex flex-col space-y-6 min-w-0">
          <div className="glass-panel border border-border rounded-xl p-6 flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-4">
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

            <h2 className="text-2xl font-bold text-foreground mb-2">{step.title}</h2>
            <p className="text-muted-foreground mb-6">{step.description}</p>

            {step.explanationTable ? (
              <div className="mb-6 overflow-hidden rounded-lg border border-border">
                <table className="w-full text-left text-sm table-fixed">
                  <thead className="bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="p-3 font-medium w-[20%]">Field</th>
                      <th className="p-3 font-medium w-[50%]">Value</th>
                      <th className="p-3 font-medium w-[30%]">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {step.explanationTable.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono text-primary break-words">{row.label}</td>
                        <td className="p-3 font-mono text-foreground/80 break-all break-words max-w-full whitespace-pre-wrap">
                          {row.value}
                        </td>
                        <td className="p-3 text-muted-foreground break-words">{row.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-muted/40 rounded-lg p-4 font-mono text-sm border border-border mb-6 overflow-x-auto">
                <div className="flex items-center justify-between mb-2 border-b border-border pb-2">
                  <span className="text-xs text-muted-foreground uppercase">{step.language}</span>
                </div>
                <pre className="text-primary whitespace-pre-wrap break-all break-words max-w-full">
                  {step.code}
                </pre>
              </div>
            )}

            <div className="mt-auto flex gap-4">
              <button
                onClick={onBack}
                disabled={isExecuting}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft size={16} />
                Back
              </button>

              {!isStepComplete ? (
                <button
                  onClick={onExecute}
                  disabled={isExecuting}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              ) : (
                <button
                  onClick={onNext}
                  disabled={currentStepIndex === steps.length - 1}
                  className="flex-1 px-4 py-2 rounded-lg bg-success hover:bg-success/90 text-success-foreground font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next Step
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Output & Visualization */}
        <div className="flex flex-col space-y-6 min-w-0">
          <div className="bg-muted/30 border border-border rounded-xl p-4 flex-1 flex flex-col font-mono text-sm relative overflow-hidden max-h-[600px] min-w-0">
            <div className="absolute top-0 left-0 right-0 bg-muted/20 p-2 flex items-center justify-between border-b border-border">
              <span className="text-xs text-muted-foreground">TERMINAL OUTPUT</span>
              {isStepComplete && <CheckCircle size={14} className="text-success" />}
            </div>

            <div className="mt-8 flex-1 overflow-y-auto min-h-[300px]" ref={outputRef}>
              {output ? (
                <pre className="text-foreground whitespace-pre-wrap break-all break-words max-w-full">
                  {output}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-foreground/20">
                  Waiting for execution...
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <pre className="whitespace-pre-wrap break-all break-words max-w-full">
                    {error}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

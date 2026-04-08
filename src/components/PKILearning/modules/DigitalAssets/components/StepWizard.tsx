// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useRef } from 'react'
import { ChevronRight, ChevronLeft, Play, CheckCircle, AlertCircle } from 'lucide-react'
import { OutputFormatter } from './OutputFormatter'
import { CopyButton } from '@/components/ui/CopyButton'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'

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
    description: string | React.ReactNode
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
  completeLabel?: string
  onExecute: () => Promise<void>
  isExecuting: boolean
  output: string | Record<string, string> | null
  error: string | null
  isStepComplete: boolean
  renderOutput?: (output: string | Record<string, string>) => React.ReactNode
}

export const StepWizard: React.FC<StepWizardProps> = ({
  steps,
  currentStepIndex,
  onNext,
  onBack,
  onComplete,
  completeLabel,
  onExecute,
  isExecuting,
  output,
  error,
  isStepComplete,
  renderOutput,
}) => {
  /* eslint-disable-next-line security/detect-object-injection */
  const step = steps[currentStepIndex]
  const outputRef = useRef<HTMLDivElement>(null)
  const [activeTabOverride, setActiveTabOverride] = React.useState<string | null>(null)

  // Reset override tracking if step changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTabOverride(null)
  }, [currentStepIndex])

  useEffect(() => {
    if (outputRef.current) {
      // Anchoring to the top ensures newest prepended logs are instantly visible without scroll fatigue
      outputRef.current.scrollTop = 0
    }
  }, [output])

  // Calculate active tab dynamically
  const activeTab =
    activeTabOverride ||
    (output && typeof output === 'object'
      ? Object.keys(output).includes('SoftHSMv3')
        ? 'SoftHSMv3'
        : Object.keys(output)[0]
      : null)

  if (!step) return null

  return (
    <div className="w-full h-full flex flex-col">
      {/* Main Step Content - Full Width */}
      <div className="glass-panel border border-border rounded-xl p-4 sm:p-5 mb-4 flex flex-col">
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
                {...(idx === currentStepIndex ? { 'aria-current': 'step' as const } : {})}
              />
            ))}
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{step.title}</h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-4">{step.description}</p>

        {/* Optional diagram */}
        {step.diagram && <div className="mb-4">{step.diagram}</div>}

        {step.explanationTable ? (
          <div className="mb-4 overflow-x-auto rounded-lg border border-border">
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
          <CodeBlock
            code={step.code}
            language={step.language}
            className="mb-4 mt-0 text-xs sm:text-sm"
          />
        )}

        {/* Custom Controls (if any) */}
        {step.customControls}

        <div className="mt-auto flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isExecuting}
            aria-label="Go to previous step"
            className="min-h-[44px] min-w-[44px] gap-2"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </Button>

          {!isStepComplete ? (
            <>
              <Button
                variant="default"
                onClick={onExecute}
                disabled={isExecuting}
                className="flex-1 min-h-[44px] gap-2"
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
              </Button>
              <Button
                variant="outline"
                onClick={onNext}
                disabled={currentStepIndex === steps.length - 1 || isExecuting}
                title="Skip this step"
                aria-label="Proceed to next step"
                className="min-h-[44px] min-w-[44px] gap-2"
              >
                <span className="hidden sm:inline">Skip</span>
                <ChevronRight size={16} />
              </Button>
            </>
          ) : currentStepIndex === steps.length - 1 ? (
            <Button
              onClick={onComplete || onBack}
              className="flex-1 min-h-[44px] gap-2 bg-success hover:bg-success/90 text-success-foreground"
            >
              <CheckCircle size={16} />
              {completeLabel || 'Completed'}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              className="flex-1 min-h-[44px] gap-2 bg-success hover:bg-success/90 text-success-foreground"
            >
              Next Step
              <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Terminal Output - Full Width Below */}
      <div className="bg-muted/30 border border-border rounded-xl overflow-hidden max-h-[350px] flex flex-col">
        <div className="bg-muted/20 border-b border-border">
          <div className="p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">TERMINAL OUTPUT</span>
            <div className="flex items-center gap-2">
              {isStepComplete && <CheckCircle size={14} className="text-success" />}
              {output && (
                <CopyButton
                  text={typeof output === 'object' ? (activeTab ? output[activeTab] : '') : output}
                  label=""
                />
              )}
            </div>
          </div>

          {/* Tabs for dual-engine output */}
          {output && typeof output === 'object' && (
            <div className="flex px-2 gap-1 border-t border-border bg-background/50">
              {Object.keys(output).map((tab) => (
                <Button
                  key={tab}
                  variant="ghost"
                  onClick={() => setActiveTabOverride(tab)}
                  className={`px-3 py-1.5 h-auto text-xs font-medium rounded-t-lg border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-primary bg-muted/40'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20'
                  }`}
                >
                  {tab}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div
          className="p-4 overflow-x-auto overflow-y-auto flex-1 min-h-[150px] max-h-[250px] font-mono text-sm"
          ref={outputRef}
          aria-live="polite"
          aria-label="Command output"
        >
          {output ? (
            renderOutput ? (
              renderOutput(typeof output === 'object' && activeTab ? output[activeTab] : output)
            ) : (
              <OutputFormatter
                output={
                  typeof output === 'object' && activeTab ? output[activeTab] : (output as string)
                }
              />
            )
          ) : (
            <div className="h-full flex items-center justify-center text-foreground/20 text-sm">
              Waiting for execution...
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive flex items-start gap-2">
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

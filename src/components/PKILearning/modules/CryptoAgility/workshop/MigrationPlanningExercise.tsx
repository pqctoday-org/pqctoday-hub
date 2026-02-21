/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronLeft, CheckCircle, Circle, ClipboardCheck, Route } from 'lucide-react'
import { MIGRATION_STEPS } from '@/data/migrationWorkflowData'

export const MigrationPlanningExercise: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const step = MIGRATION_STEPS[currentStep]

  const markComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    if (currentStep < MIGRATION_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const phaseColors = [
    'border-l-phase-discovery',
    'border-l-phase-research',
    'border-l-phase-poc',
    'border-l-phase-testing',
    'border-l-phase-migration',
    'border-l-phase-standardization',
    'border-l-phase-guidance',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Migration Planning</h3>
        <p className="text-sm text-muted-foreground">
          Walk through the 7-phase PQC migration framework. Each phase includes specific tasks,
          framework alignment, and estimated timelines aligned with NIST IR 8547 and NSA CNSA 2.0.
        </p>
      </div>

      {/* Phase stepper */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {MIGRATION_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                idx === currentStep
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : completedSteps.has(idx)
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              {completedSteps.has(idx) ? <CheckCircle size={12} /> : <Circle size={12} />}
              <span className="hidden sm:inline">{s.shortTitle}</span>
              <span className="sm:hidden">{idx + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${(completedSteps.size / MIGRATION_STEPS.length) * 100}%` }}
        />
      </div>

      {/* Current phase detail */}
      {step && (
        <div
          className={`glass-panel p-6 border-l-4 ${phaseColors[currentStep] || 'border-l-primary'}`}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                  Phase {step.stepNumber}
                </span>
                {step.estimatedDuration && (
                  <span className="text-xs text-muted-foreground">{step.estimatedDuration}</span>
                )}
              </div>
              <h4 className="text-xl font-bold text-foreground">{step.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
            </div>
          </div>

          {/* Tasks */}
          <div className="mb-4">
            <h5 className="text-sm font-bold text-foreground mb-2">Key Tasks</h5>
            <div className="space-y-2">
              {step.tasks.map((task, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
                  <span className="text-xs font-bold text-primary shrink-0 mt-0.5">{idx + 1}.</span>
                  <div>
                    <div className="text-sm font-medium text-foreground">{task.title}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Framework alignment */}
          {step.frameworks && step.frameworks.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-bold text-foreground mb-2">Framework Alignment</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {step.frameworks.map((fw, idx) => (
                  <div key={idx} className="text-xs bg-muted/50 p-2 rounded border border-border">
                    <span className="font-bold text-foreground">{fw.source}:</span>{' '}
                    <span className="text-muted-foreground">{fw.mapping}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NSA Timeline */}
          {step.nsaTimeline && (
            <div className="bg-muted/50 p-3 rounded border border-border mb-4">
              <span className="text-xs font-bold text-foreground">NSA CNSA 2.0: </span>
              <span className="text-xs text-muted-foreground">{step.nsaTimeline}</span>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-1 px-4 py-2 text-sm rounded border border-border hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={markComplete}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors"
            >
              {completedSteps.has(currentStep) ? (
                <>
                  <CheckCircle size={14} /> Completed
                </>
              ) : currentStep === MIGRATION_STEPS.length - 1 ? (
                <>
                  Mark Complete <CheckCircle size={14} />
                </>
              ) : (
                <>
                  Complete &amp; Next <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Links to app sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/assess"
          className="flex items-center gap-3 glass-panel p-4 hover:border-primary/30 transition-colors"
        >
          <ClipboardCheck size={20} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-bold text-foreground">Run Assessment</div>
            <p className="text-xs text-muted-foreground">
              Start Phase 1 with a guided risk assessment
            </p>
          </div>
        </Link>
        <Link
          to="/migrate"
          className="flex items-center gap-3 glass-panel p-4 hover:border-primary/30 transition-colors"
        >
          <Route size={20} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-bold text-foreground">Migration Guide</div>
            <p className="text-xs text-muted-foreground">
              Detailed migration workflows and software catalog
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}

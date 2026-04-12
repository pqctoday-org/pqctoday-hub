// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMigrationWorkflowStore, WORKFLOW_PHASES } from '@/store/useMigrationWorkflowStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONA_WORKFLOW_LABELS } from '@/data/personaConfig'
import { cn } from '@/lib/utils'

const RELEVANT_ROUTES = ['/assess', '/report', '/compliance', '/migrate', '/timeline', '/business']

export const WorkflowBanner: React.FC = () => {
  const { workflowActive, currentPhase, completedPhases, completedAt, dismissWorkflow } =
    useMigrationWorkflowStore()
  const persona = usePersonaStore((s) => s.selectedPersona)
  const location = useLocation()
  const navigate = useNavigate()

  if (!workflowActive) return null
  if (!RELEVANT_ROUTES.includes(location.pathname)) return null

  const currentIndex = WORKFLOW_PHASES.findIndex((p) => p.id === currentPhase)
  const currentPhaseConfig = WORKFLOW_PHASES[currentIndex]
  const nextPhase = WORKFLOW_PHASES[currentIndex + 1]
  const isComplete = completedAt !== null

  // Persona-aware phase label (falls back to default)
  const getPhaseLabel = (phaseId: string) => {
    if (persona) {
      const labels = PERSONA_WORKFLOW_LABELS[persona] // eslint-disable-line security/detect-object-injection
      const label = labels?.[phaseId as keyof typeof labels]
      if (label) return label
    }
    return WORKFLOW_PHASES.find((p) => p.id === phaseId)?.label ?? phaseId
  }

  const handleNext = () => {
    if (nextPhase) {
      navigate(nextPhase.route)
    }
  }

  return (
    <div
      className="glass-panel p-3 mb-4 print:hidden"
      role="status"
      aria-label="Migration planning workflow progress"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Progress indicator */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {WORKFLOW_PHASES.map((phase) => {
              const isCompleted = completedPhases.includes(phase.id)
              const isCurrent = phase.id === currentPhase && !isComplete

              return (
                <Button
                  variant="ghost"
                  key={phase.id}
                  onClick={() => navigate(phase.route)}
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-colors',
                    isCompleted && 'bg-success',
                    isCurrent && 'bg-primary ring-2 ring-primary/30',
                    !isCompleted && !isCurrent && 'bg-muted'
                  )}
                  aria-label={`${getPhaseLabel(phase.id)} — ${isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}`}
                />
              )
            })}
          </div>

          {isComplete ? (
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 size={16} className="text-success flex-shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">
                Migration planning complete
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-muted-foreground flex-shrink-0">
                Step {currentIndex + 1}/{WORKFLOW_PHASES.length}:
              </span>
              <span className="text-sm font-medium text-foreground truncate">
                {currentPhaseConfig ? getPhaseLabel(currentPhaseConfig.id) : ''}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isComplete && nextPhase && (
            <Button variant="outline" size="sm" onClick={handleNext}>
              <span className="hidden sm:inline">Next: {getPhaseLabel(nextPhase.id)}</span>
              <span className="sm:hidden">Next</span>
              <ArrowRight size={14} className="ml-1" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissWorkflow}
            aria-label="Dismiss workflow"
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}

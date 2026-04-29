// SPDX-License-Identifier: GPL-3.0-only
/**
 * MigrationWire — Command Center Fig 3 Migration zone data wire.
 *
 * Surfaces the user's progress through the cross-page migration workflow
 * (Assess → Comply → Migrate → Timeline) defined in
 * `useMigrationWorkflowStore.WORKFLOW_PHASES`. Each phase chip links back to
 * its source page so users can resume in-place.
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Circle, Route } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BusinessMetrics } from '../../hooks/useBusinessMetrics'
import { WORKFLOW_PHASES } from '@/store/useMigrationWorkflowStore'

export interface MigrationWireProps {
  metrics: BusinessMetrics
}

export const MigrationWire: React.FC<MigrationWireProps> = ({ metrics }) => {
  const navigate = useNavigate()
  const completed = new Set(metrics.completedPhases)
  const total = WORKFLOW_PHASES.length
  const done = WORKFLOW_PHASES.filter((p) => completed.has(p.id)).length

  if (done === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 flex items-start gap-3">
        <Route size={18} className="text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground">Migration workflow not started</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            The 4-phase workflow (Assess → Comply → Migrate → Timeline) tracks your cross-page
            progress. Open the Migrate page to begin.
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => navigate('/migrate')} className="gap-1">
          Open Migrate <ArrowRight size={12} />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Route size={14} className="text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Migration workflow · {done}/{total} phases complete
          </span>
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={() => navigate('/migrate')}
          className="h-auto p-0 text-xs"
        >
          Open Migrate <ArrowRight size={12} className="ml-0.5" />
        </Button>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {WORKFLOW_PHASES.map((phase, idx) => {
          const isDone = completed.has(phase.id)
          return (
            <React.Fragment key={phase.id}>
              <Button
                variant="ghost"
                onClick={() => navigate(phase.route)}
                className={`h-auto px-2 py-1 gap-1.5 text-xs rounded border ${
                  isDone
                    ? 'border-status-success/30 bg-status-success/10 text-status-success'
                    : 'border-border bg-muted/20 text-muted-foreground'
                }`}
                title={phase.description}
              >
                {isDone ? (
                  <Check size={12} />
                ) : (
                  <Circle size={12} className="text-muted-foreground/60" />
                )}
                <span>{phase.label}</span>
              </Button>
              {idx < WORKFLOW_PHASES.length - 1 && (
                <ArrowRight size={10} className="text-muted-foreground/40 shrink-0" />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

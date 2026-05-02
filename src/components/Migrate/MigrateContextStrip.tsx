// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Wrench, X, Factory, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MigrationWorkflow } from './MigrationWorkflow'
import type { MigrationStep } from '../../types/MigrateTypes'

interface StepFilter {
  stepNumber: number
  stepTitle: string
  stepId: string
}

interface MigrateContextStripProps {
  industryFilter: string | null
  onClearIndustry: () => void
  stepFilter: StepFilter | null
  onClearStep: () => void
  workflowCollapsed: boolean
  onToggleWorkflow: () => void
  onViewSoftware: (step: MigrationStep) => void
}

const LS_KEY = 'pqc-migrate-context-strip-open'

function getInitialOpen(hasActiveFilter: boolean): boolean {
  const stored = localStorage.getItem(LS_KEY)
  if (stored !== null) return stored === 'true'
  return hasActiveFilter
}

export const MigrateContextStrip: React.FC<MigrateContextStripProps> = ({
  industryFilter,
  onClearIndustry,
  stepFilter,
  onClearStep,
  workflowCollapsed,
  onToggleWorkflow,
  onViewSoftware,
}) => {
  const hasActive = Boolean(industryFilter || stepFilter)
  const [open, setOpen] = useState(() => getInitialOpen(hasActive))

  const toggleOpen = () => {
    setOpen((v) => {
      localStorage.setItem(LS_KEY, String(!v))
      return !v
    })
  }

  const summaryParts: string[] = []
  if (industryFilter) summaryParts.push(industryFilter)
  if (stepFilter) summaryParts.push(`Step ${stepFilter.stepNumber}`)
  summaryParts.push('WIP data')

  return (
    <div className="glass-panel border border-border rounded-lg overflow-hidden mb-4">
      {/* Header row — always visible */}
      <Button
        variant="ghost"
        onClick={toggleOpen}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 h-auto rounded-none text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="font-medium text-foreground text-xs">Migration context</span>
          {!open && summaryParts.length > 0 && (
            <span className="text-xs text-muted-foreground truncate">
              · {summaryParts.join(' · ')}
            </span>
          )}
        </div>
        {hasActive && (
          <span className="shrink-0 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
            {(industryFilter ? 1 : 0) + (stepFilter ? 1 : 0)} active
          </span>
        )}
      </Button>

      {/* Expandable body */}
      {open && (
        <div className="border-t border-border divide-y divide-border/50">
          {/* WIP disclaimer */}
          <div className="flex items-start gap-3 px-4 py-3 text-sm">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border border-status-warning/40 bg-status-warning/15 text-status-warning shrink-0 mt-0.5">
              <Wrench size={11} />
              WIP
            </span>
            <p className="hidden md:block text-muted-foreground">
              PQC product data is being actively reviewed and validated. Help by submitting product
              updates via the <em>Update PQC Info</em> link in each product card.
            </p>
            <p className="md:hidden text-xs text-muted-foreground">
              Data under review. Submit updates via <em>Update PQC Info</em> in each card.
            </p>
          </div>

          {/* Industry filter */}
          {industryFilter && (
            <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-primary">
              <Factory size={13} className="shrink-0" />
              <span>
                Showing products relevant to <strong>{industryFilter}</strong>
              </span>
              <Button
                variant="link"
                onClick={onClearIndustry}
                className="ml-auto flex items-center gap-1 p-0 h-auto text-xs"
                aria-label="Clear industry filter"
              >
                <X size={12} />
                Clear
              </Button>
            </div>
          )}

          {/* Step filter */}
          {stepFilter && (
            <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-primary">
              <ListChecks size={13} className="shrink-0" />
              <span>
                Showing products for{' '}
                <strong>
                  Step {stepFilter.stepNumber}: {stepFilter.stepTitle}
                </strong>
              </span>
              <Button
                variant="link"
                onClick={onClearStep}
                className="ml-auto flex items-center gap-1 p-0 h-auto text-xs"
                aria-label="Clear step filter"
              >
                <X size={12} />
                Clear
              </Button>
            </div>
          )}

          {/* Migration Workflow (desktop) */}
          <div className="hidden md:block px-4 py-3">
            <Button
              variant="ghost"
              onClick={onToggleWorkflow}
              className="flex items-center gap-2 text-sm text-muted-foreground mb-2 p-0 h-auto"
              aria-expanded={!workflowCollapsed}
              aria-controls="migration-workflow-hero"
            >
              {workflowCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              {workflowCollapsed ? 'Show Migration Framework' : 'Hide Migration Framework'}
            </Button>
            {!workflowCollapsed && (
              <div id="migration-workflow-hero" className="animate-fade-in">
                <MigrationWorkflow onViewSoftware={onViewSoftware} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

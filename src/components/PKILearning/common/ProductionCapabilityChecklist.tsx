// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { ShieldCheck, ChevronDown } from 'lucide-react'
import { getModuleCapabilityChecklist } from '@/data/moduleCapabilityChecklists'

export interface ProductionCapabilityChecklistProps {
  moduleId: string
  defaultOpen?: boolean
}

export const ProductionCapabilityChecklist: React.FC<ProductionCapabilityChecklistProps> = ({
  moduleId,
  defaultOpen = false,
}) => {
  const spec = getModuleCapabilityChecklist(moduleId)
  if (!spec) return null

  return (
    <details
      open={defaultOpen}
      data-testid="production-capability-checklist"
      data-module-id={moduleId}
      aria-label="Production Tool Capabilities and Verification Checklist"
      className="group mt-6 rounded-xl border border-primary/25 bg-card/80 p-4 text-sm shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-foreground select-none">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>Production Tool Capabilities &amp; Verification Checklist</span>
          <span className="hidden sm:inline-block rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {spec.roleFocus}
          </span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="mt-3 space-y-3 border-t border-border/60 pt-3 text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground">
            Capabilities to require in your production tools:
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs sm:text-sm">
            {spec.productionCapabilities.map((cap, idx) => (
              <li key={idx}>{cap}</li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              How to evaluate in your environment
            </p>
            <p className="mt-1 text-xs leading-relaxed">{spec.evaluationMethod}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Production evidence to collect
            </p>
            <p className="mt-1 text-xs leading-relaxed">{spec.evidenceRequired}</p>
          </div>
        </div>

        <p className="text-xs italic text-muted-foreground">{spec.educationalBoundary}</p>
      </div>
    </details>
  )
}

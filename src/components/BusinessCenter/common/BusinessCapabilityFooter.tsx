// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { ShieldCheck, ChevronDown } from 'lucide-react'
import { getBusinessCapabilityChecklist } from '@/data/businessCapabilityChecklists'

export interface BusinessCapabilityFooterProps {
  toolId: string
  defaultOpen?: boolean
}

export const BusinessCapabilityFooter: React.FC<BusinessCapabilityFooterProps> = ({
  toolId,
  defaultOpen = false,
}) => {
  const spec = getBusinessCapabilityChecklist(toolId)
  if (!spec) return null

  return (
    <details
      open={defaultOpen}
      data-testid="business-capability-footer"
      aria-label="Production Tool Capabilities and Evaluation Criteria"
      className="group mt-2 rounded-lg border border-primary/25 bg-card/80 p-3 text-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-semibold text-foreground select-none">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>Production Tool Capabilities to Evaluate ({spec.productionToolCategory})</span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="mt-3 space-y-2.5 border-t border-border/60 pt-3 text-muted-foreground">
        <div>
          <p className="text-xs sm:text-sm font-semibold text-foreground">
            Capabilities to require in your enterprise tooling:
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs sm:text-sm">
            {spec.requiredCapabilities.map((cap, idx) => (
              <li key={idx}>{cap}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed">
          <span className="font-semibold text-foreground">How to evaluate in production:</span>{' '}
          {spec.evaluationCriteria}
        </p>

        <p className="text-xs italic text-muted-foreground">{spec.sampleVsProductionBoundary}</p>
      </div>
    </details>
  )
}

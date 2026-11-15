// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { ShieldCheck, ChevronDown, AlertOctagon, ShieldAlert } from 'lucide-react'
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
  const [showStressTest, setShowStressTest] = useState(false)

  if (!spec) return null

  const { auditStressTest } = spec

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

        <div
          data-testid="business-stress-test-panel"
          className="rounded-md border border-primary/30 bg-muted/30 p-2.5 space-y-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ShieldAlert className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Governance Audit Stress-Test &amp; Coverage Gap Inspector
            </span>
            <button
              type="button"
              data-testid="business-stress-test-btn"
              onClick={() => setShowStressTest((prev) => !prev)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                showStressTest
                  ? 'border-amber-500/60 bg-amber-500/15 text-foreground'
                  : 'border-border bg-background hover:bg-muted text-foreground'
              }`}
            >
              Run Audit Stress-Test (Reject Incomplete Evidence)
            </button>
          </div>

          {showStressTest && (
            <div
              data-testid="business-stress-test-receipt"
              className="rounded border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  <AlertOctagon className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                  AUDIT STATUS: GOVERNANCE SIGN-OFF REFUSED
                </span>
                <code className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                  {auditStressTest.detectedGapCode}
                </code>
              </div>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Simulated Flawed Submission:</span>{' '}
                {auditStressTest.flawedArtifactSummary}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Governance Rejection Reason:</span>{' '}
                {auditStressTest.governanceRejectionReason}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Required Production Remediation:</span>{' '}
                {auditStressTest.remediationAction}
              </p>
            </div>
          )}
        </div>

        <p className="text-xs italic text-muted-foreground">{spec.sampleVsProductionBoundary}</p>
      </div>
    </details>
  )
}

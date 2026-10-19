// SPDX-License-Identifier: AGPL-3.0-only
import { Info } from 'lucide-react'
import { businessToolEvidence } from '@/data/businessToolEvidence'

export function BusinessToolEvidenceNotice({
  toolId,
  compact = false,
}: {
  toolId: string
  compact?: boolean
}) {
  const evidence = businessToolEvidence(toolId)
  if (!evidence) return null

  if (compact) {
    return (
      <span
        className="inline-flex rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary"
        aria-label={`Output type: ${evidence.label}`}
      >
        {evidence.label}
      </span>
    )
  }

  return (
    <aside
      className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm"
      aria-label="How to interpret this business tool"
    >
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 space-y-1 text-muted-foreground">
          <p className="font-semibold text-foreground">{evidence.label}</p>
          <p>
            <span className="font-semibold text-foreground">What it can show:</span>{' '}
            {evidence.proves}
          </p>
          <p>
            <span className="font-semibold text-foreground">What it cannot establish:</span>{' '}
            {evidence.doesNotProve}
          </p>
          <p>
            Validate inputs, sources, owners and approvals before using an export in a real
            decision.
          </p>
        </div>
      </div>
    </aside>
  )
}

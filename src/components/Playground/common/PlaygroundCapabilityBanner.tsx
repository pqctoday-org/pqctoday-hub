// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { ShieldCheck, ChevronDown } from 'lucide-react'
import { getPlaygroundCapabilityChecklist } from '@/data/playgroundCapabilityChecklists'

export interface PlaygroundCapabilityBannerProps {
  toolId: string
  defaultOpen?: boolean
}

export const PlaygroundCapabilityBanner: React.FC<PlaygroundCapabilityBannerProps> = ({
  toolId,
  defaultOpen = false,
}) => {
  const spec = getPlaygroundCapabilityChecklist(toolId)

  return (
    <details
      open={defaultOpen}
      data-testid="playground-capability-banner"
      aria-label="Production Tool Capabilities and Sandbox Boundary"
      className="group rounded-lg border border-primary/25 bg-card/80 p-3 text-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-semibold text-foreground select-none">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>Production Tool Capabilities &amp; Verification Requirements</span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="mt-3 space-y-2.5 border-t border-border/60 pt-3 text-muted-foreground">
        <p className="text-xs sm:text-sm leading-relaxed">
          <span className="font-semibold text-foreground">What this sample check establishes:</span>{' '}
          {spec.whatCheckEstablishes}
        </p>
        <p className="text-xs sm:text-sm leading-relaxed">
          <span className="font-semibold text-foreground">
            Browser sandbox limitation (non-certification boundary):
          </span>{' '}
          {spec.sandboxLimitation}
        </p>
        <div>
          <p className="text-xs sm:text-sm font-semibold text-foreground">
            What to require and test in your production tools:
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs sm:text-sm">
            {spec.productionToolRequirements.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  )
}

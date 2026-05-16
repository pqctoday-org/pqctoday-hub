// SPDX-License-Identifier: GPL-3.0-only
/**
 * HiddenFrameworksToggle — expandable explainer for jurisdiction-filtered
 * frameworks shown under the tracked-frameworks lists in GovernanceWire and
 * RiskManagementWire.
 *
 * The Command Center filters `trackedFrameworks` through the applicability
 * engine and hides any framework that matches neither the user's country nor
 * their industry. Previously we just rendered `"{N} hidden — not applicable
 * to {jurisdiction}"` as a static line, leaving users with a count but no
 * explanation of *what* was filtered or *why*. This widget swaps that static
 * line for a button that toggles a small panel listing the top 5 hidden
 * frameworks with a short per-item reason.
 */
import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface HiddenFramework {
  id: string
  name: string
  reason: string
}

export interface HiddenFrameworksToggleProps {
  hidden: HiddenFramework[]
  /** The user's active jurisdiction label — country preferred, industry as fallback */
  jurisdictionLabel: string
  /** Initial visible row cap before "Show all" is clicked */
  initialLimit?: number
}

export const HiddenFrameworksToggle: React.FC<HiddenFrameworksToggleProps> = ({
  hidden,
  jurisdictionLabel,
  initialLimit = 5,
}) => {
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const panelId = React.useId()
  if (hidden.length === 0) return null

  const visible = showAll ? hidden : hidden.slice(0, initialLimit)
  const remaining = hidden.length - visible.length

  // Use the shared <Button> component (ghost variant) per the UX component
  // contract; size sm + utility overrides bring it down to the inline caption
  // scale that the surrounding wires already use elsewhere.
  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="h-auto justify-start gap-1 px-0 py-0 text-[11px] font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        {open ? (
          <ChevronDown size={12} className="text-status-info" aria-hidden="true" />
        ) : (
          <ChevronRight size={12} className="text-status-info" aria-hidden="true" />
        )}
        <span>
          {hidden.length} hidden — not applicable to {jurisdictionLabel}.{' '}
          <span className="underline decoration-dotted">
            {open ? 'Hide details' : 'Show details'}
          </span>
        </span>
      </Button>
      {open && (
        <div
          id={panelId}
          className="rounded border border-border bg-muted/40 px-2.5 py-2 text-[11px] text-muted-foreground"
        >
          <ul className="space-y-1">
            {visible.map((f) => (
              <li key={f.id} className="leading-snug">
                <span className="font-medium text-foreground">{f.name}</span>
                <span className="text-muted-foreground"> — {f.reason}</span>
              </li>
            ))}
          </ul>
          {remaining > 0 && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => setShowAll(true)}
              className="mt-1.5 h-auto px-0 py-0 text-[11px] text-status-info"
            >
              Show all ({remaining} more)
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { EyeOff } from 'lucide-react'

export interface AttackerSidecarProps {
  /** Static per-step copy describing what an eavesdropper observes. */
  observes: string
}

/**
 * Red-bordered addendum rendered above the terminal when the user has
 * switched to "IMSI-catcher view". Static copy only — no dependency on
 * execution state (that's intentional for this pass).
 */
export const AttackerSidecar: React.FC<AttackerSidecarProps> = ({ observes }) => {
  return (
    <div
      role="note"
      aria-label="What an IMSI catcher would observe at this step"
      className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 flex items-start gap-2"
    >
      <EyeOff size={14} className="text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 text-xs text-foreground/90 leading-snug">
        <span className="font-semibold text-destructive">What the eavesdropper captures:</span>{' '}
        {observes}
      </div>
    </div>
  )
}

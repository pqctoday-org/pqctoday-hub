// SPDX-License-Identifier: GPL-3.0-only
/**
 * DevSandboxDiffNote — the WS-I honesty surface every Developer tab shows:
 * a collapsible note stating, in plain language, exactly how running a
 * script here differs from running the same script in the dev sandbox.
 * These deltas already exist as code comments in the shims (p11/
 * __init__.py, pqctoday_kmip/__init__.py) — this is the same information
 * surfaced to the person actually reading the tab, not just the source.
 */
import { useState } from 'react'
import { Info, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '../../../ui/button'

export interface DevSandboxDiffNoteProps {
  points: string[]
}

export const DevSandboxDiffNote: React.FC<DevSandboxDiffNoteProps> = ({ points }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b bg-muted/20">
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        className="w-full justify-start gap-2 px-4 py-2 h-auto text-xs font-normal text-muted-foreground hover:text-foreground"
        aria-expanded={open}
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <Info className="h-3.5 w-3.5" />
        How this differs from the dev sandbox
      </Button>
      {open && (
        <div className="px-4 pb-3">
          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
            {points.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

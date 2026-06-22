// SPDX-License-Identifier: GPL-3.0-only
//
// The single consolidated assist strip — replaces the legacy stack of
// PersonaHint + WhyWeAskHint + info banner. One quiet "Why we ask" disclosure.
// (The "Use recommended" smart-default action stays as the step's own in-pane
// escape hatch, which the question pane renders below this strip.)
import React, { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { Button } from '../../ui/button'

interface AssessAssistStripProps {
  why: string
}

export const AssessAssistStrip: React.FC<AssessAssistStripProps> = ({ why }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-2">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
        <Button
          variant="ghost"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="h-auto gap-1.5 px-0 py-0 text-xs font-semibold text-primary hover:bg-transparent hover:text-primary"
        >
          <Lightbulb size={14} />
          Why we ask
        </Button>
      </div>
      {open && (
        <div className="mt-1.5 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          {why}
        </div>
      )}
    </div>
  )
}

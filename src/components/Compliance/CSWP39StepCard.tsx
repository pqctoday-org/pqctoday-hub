// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CSWP39Step, CSWP39CrossWalkRow } from './cswp39Data'

interface CSWP39StepCardProps {
  step: CSWP39Step
  crossWalk?: CSWP39CrossWalkRow
  onFrameworkChipClick: (
    targetTab: 'standards' | 'technical' | 'certification' | 'compliance',
    searchQuery: string
  ) => void
  /** Optional badge rendered next to the section-ref chip (Command Center: maturity tier). */
  tierBadge?: ReactNode
  /** Optional content rendered inside the expanded panel below "Aligns with". */
  children?: ReactNode
  /** Initial expansion state. Defaults to false (collapsed). */
  defaultOpen?: boolean
}

export const CSWP39StepCard: React.FC<CSWP39StepCardProps> = ({
  step,
  crossWalk,
  onFrameworkChipClick,
  tierBadge,
  children,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="glass-panel p-4 border border-border rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
          {step.number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-foreground">{step.title}</h3>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-2 py-0.5 rounded bg-muted/60">
              CSWP.39 {step.sectionRef}
            </span>
            <span className="text-[10px] text-secondary font-medium px-2 py-0.5 rounded bg-secondary/10">
              CPM {step.cpmPillar}
            </span>
            {tierBadge}
          </div>
          <p className="text-xs text-foreground/80 mt-1.5">{step.explainer}</p>
        </div>
        <Button
          variant="ghost"
          className="shrink-0 h-8 px-2"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Collapse step details' : 'Expand step details'}
        >
          {open ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </Button>
      </div>

      {open && (
        <div className="mt-3 pl-12 space-y-3">
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Requirements
            </div>
            <ul className="space-y-1">
              {step.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <CheckCircle2 size={12} className="text-status-success mt-0.5 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {crossWalk && crossWalk.frameworks.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Aligns with
              </div>
              <div className="flex flex-wrap gap-1.5">
                {crossWalk.frameworks.map((fw) => (
                  <Button
                    key={fw.label}
                    variant="ghost"
                    onClick={() => onFrameworkChipClick(fw.targetTab, fw.searchQuery)}
                    title={fw.hint}
                    className="h-auto text-[11px] px-2 py-1 rounded-md bg-muted/60 hover:bg-primary/10 border border-border hover:border-primary/40 text-foreground hover:text-primary transition-colors font-normal"
                  >
                    {fw.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {children}
        </div>
      )}
    </div>
  )
}

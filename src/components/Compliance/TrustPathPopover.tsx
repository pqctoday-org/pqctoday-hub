// SPDX-License-Identifier: GPL-3.0-only
import { useState, useRef, useEffect } from 'react'
import { Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TrustPath } from '@/utils/applicabilityEngine'

interface TrustPathPopoverProps {
  path: TrustPath
  standardLabel: string
}

/**
 * "Why shown?" popover for derived compliance standards.
 * Displays the IR 8477 trust path: source standard → relationship type → derived standard,
 * with evidence quote, reviewer attribution, and confidence score.
 */
export function TrustPathPopover({ path, standardLabel }: TrustPathPopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const confColor =
    path.derivedConfidence >= 70
      ? 'text-status-success'
      : path.derivedConfidence >= 40
        ? 'text-status-warning'
        : 'text-status-error'

  return (
    <div ref={ref} className="relative inline-block">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Why shown?"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="h-5 w-5"
      >
        <Info className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Trust path explanation"
          className="absolute z-50 bottom-full mb-1 right-0 w-80 glass-panel rounded-lg border border-border p-3 shadow-lg text-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
              Related via Trust Path
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-0.5">
            <p className="text-primary font-medium">{path.sourceStandardLabel}</p>
            <p className="text-muted-foreground ml-3">
              {'└── '}
              <span className="font-mono text-accent">{path.relationshipType}</span>
              {' → '}
              <span className="text-foreground">{standardLabel}</span>
            </p>
          </div>

          {path.edgeEvidence && (
            <p className="text-muted-foreground italic leading-tight">
              &ldquo;{path.edgeEvidence}&rdquo;
            </p>
          )}

          <div className="flex items-center justify-between text-muted-foreground pt-0.5 border-t border-border">
            <span>
              Reviewed by {path.reviewerDisplay}
              {path.reviewedDate ? ` · ${path.reviewedDate}` : ''}
            </span>
            <span className={confColor}>{path.derivedConfidence} / 100</span>
          </div>

          {path.hop === 2 && (
            <p className="text-muted-foreground/70 text-[10px]">2-hop derivation</p>
          )}
        </div>
      )}
    </div>
  )
}

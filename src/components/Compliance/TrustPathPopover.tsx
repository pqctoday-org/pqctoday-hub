// SPDX-License-Identifier: GPL-3.0-only
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TrustPath } from '@/utils/applicabilityEngine'

interface TrustPathPopoverProps {
  path: TrustPath
  standardLabel: string
}

const POPOVER_WIDTH = 320 // matches w-80
const VIEWPORT_MARGIN = 8

/**
 * "Why shown?" popover for derived compliance standards.
 * Displays the IR 8477 trust path: source standard → relationship type → derived standard,
 * with evidence quote, reviewer attribution, and confidence score.
 *
 * Renders via portal + fixed positioning so the popover escapes ancestor
 * overflow clipping (MainLayout uses overflow-clip on its root) and flips
 * above/below based on available viewport space.
 */
export function TrustPathPopover({ path, standardLabel }: TrustPathPopoverProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return

    function updatePosition() {
      if (!triggerRef.current) return
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const popoverHeight = popoverRef.current?.offsetHeight ?? 220

      const spaceAbove = triggerRect.top
      const spaceBelow = window.innerHeight - triggerRect.bottom
      const placeAbove = spaceAbove >= popoverHeight + VIEWPORT_MARGIN || spaceAbove >= spaceBelow

      const top = placeAbove
        ? Math.max(VIEWPORT_MARGIN, triggerRect.top - popoverHeight - 4)
        : Math.min(window.innerHeight - popoverHeight - VIEWPORT_MARGIN, triggerRect.bottom + 4)

      // Right-align with trigger, clamped to viewport
      const rawLeft = triggerRect.right - POPOVER_WIDTH
      const left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(rawLeft, window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN)
      )

      setPos({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const confColor =
    path.derivedConfidence >= 70
      ? 'text-status-success'
      : path.derivedConfidence >= 40
        ? 'text-status-warning'
        : 'text-status-error'

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        aria-label="Why shown?"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="h-5 w-5"
      >
        <Info className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Trust path explanation"
            style={{
              position: 'fixed',
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              width: POPOVER_WIDTH,
              visibility: pos ? 'visible' : 'hidden',
            }}
            className="z-50 glass-panel rounded-lg border border-border p-3 shadow-lg text-xs space-y-2"
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
          </div>,
          document.body
        )}
    </>
  )
}

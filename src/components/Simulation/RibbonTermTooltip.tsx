// SPDX-License-Identifier: GPL-3.0-only
/**
 * RibbonTermTooltip — hover/tap plain-English definitions for ribbon/rail term
 * labels (educational-value gap-closing, 07182026). Sources content from
 * EXEC_TOUR_CONCEPTS (the sim's own concept-peek dictionary, mostly reusing
 * SimTour's GUIDED_DEFS) rather than the hub-wide glossary (InlineTooltip) —
 * these framings are sim-specific (e.g. Mosca's "X + Y > Z", grounded
 * readiness's two-gate model) and already the single source of truth for the
 * tour/interactive concept peeks; this is a second, compact surface for the
 * same content, not a new definition.
 *
 * Deliberately its own small component rather than extending InlineTooltip:
 * InlineTooltip has ~20 existing callers across Learn modules, keyed to
 * glossary lookups — widening its props risked all of them for a 3-4-tile
 * ribbon/rail feature.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { conceptBody } from './autorun/SimConceptPeek'
import { EXEC_TOUR_CONCEPTS, type TourConceptId } from './autorun/execTourConfig'

type Placement = { top: number; left: number } | { bottom: number; left: number }

export function RibbonTermTooltip({
  concept,
  children,
}: {
  concept: TourConceptId
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<Placement | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const show = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      const centerX = rect.left + rect.width / 2
      const halfW = 128
      const clampedX = Math.max(halfW + 8, Math.min(centerX, window.innerWidth - halfW - 8))
      setPlacement(
        window.innerHeight - rect.bottom >= 160
          ? { top: rect.bottom + 6, left: clampedX }
          : { bottom: window.innerHeight - rect.top + 6, left: clampedX }
      )
    }
    setOpen(true)
  }, [])
  const hide = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide()
    }
    const onOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      )
        return
      hide()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onOutside)
    }
  }, [open, hide])

  const def = EXEC_TOUR_CONCEPTS[concept]

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => (open ? hide() : show())}
        aria-expanded={open}
        aria-label={`Definition of ${def.title}`}
        className="h-auto p-0 cursor-help border-b border-dotted border-muted-foreground/50 text-inherit font-inherit transition-colors hover:border-primary hover:text-primary hover:bg-transparent"
      >
        {children}
      </Button>
      {open &&
        placement &&
        createPortal(
          <div
            ref={popoverRef}
            role="tooltip"
            style={{ position: 'fixed', zIndex: 9999, transform: 'translateX(-50%)', ...placement }}
            className="w-64 rounded-lg border border-border bg-background p-3 shadow-lg"
          >
            <div className="mb-1 text-sm font-semibold text-foreground">{def.title}</div>
            <p className="text-xs leading-relaxed text-muted-foreground">{conceptBody(def)}</p>
          </div>,
          document.body
        )}
    </>
  )
}

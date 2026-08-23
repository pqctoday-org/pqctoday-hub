// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { mobileSheetOverlay, mobileSheetPanel } from '../mobileTokens'

/**
 * Hand-rolled bottom sheet — this repo has no Radix/shadcn Dialog to build
 * on (src/components/ui/ is entirely hand-rolled; see IMPLEMENTATION-PLAN.md
 * §C.5/§B.1). Shared by every sheet the mobile layer needs: group panels,
 * ⋯ page actions, checkpoint quiz, workshop dock (expanded), glossary
 * drill-down, detail sheets.
 *
 * One sheet at a time (handoff "Interactions & behaviour": "One sheet at a
 * time") — enforced by a module-level singleton below, not by convention.
 */

let activeSheetClose: (() => void) | null = null

function claimSheetSingleton(close: () => void) {
  if (activeSheetClose && activeSheetClose !== close) {
    activeSheetClose()
  }
  activeSheetClose = close
}

function releaseSheetSingleton(close: () => void) {
  if (activeSheetClose === close) activeSheetClose = null
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export interface MobileSheetProps {
  open: boolean
  onClose: () => void
  /** Rendered in the sheet header next to the grab handle. Omit for a
   *  chrome-less sheet (e.g. the workshop dock's expanded panel, which
   *  renders its own header). */
  title?: string
  /** id used for aria-labelledby when `title` is a plain string; pass your
   *  own id + render your own heading when the title needs richer markup. */
  titleId?: string
  children?: ReactNode
  /** Tailwind max-height utility. Handoff: "max-height 62–78% with internal
   *  scroll"; detail sheets use the larger end, action sheets the smaller. */
  maxHeightClassName?: string
  /** 20px radius for the larger detail sheet vs 18px for every other sheet
   *  (handoff "Sheet chrome"). */
  large?: boolean
  className?: string
  testId?: string
}

export function MobileSheet({
  open,
  onClose,
  title,
  titleId,
  children,
  maxHeightClassName = 'max-h-[70dvh]',
  large = false,
  className,
  testId,
}: MobileSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return

    const stableClose = () => closeRef.current()
    claimSheetSingleton(stableClose)

    previousFocusRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusables = () =>
      Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])

    const initial = focusables()[0]
    // Focus the panel itself first if nothing inside is focusable (e.g. a
    // sheet that's pure content) — makes Escape reachable from the keyboard
    // regardless of what the sheet renders.
    ;(initial ?? panelRef.current)?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const nodes = focusables()
      if (nodes.length === 0) {
        e.preventDefault()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.body.style.overflow = previousOverflow
      releaseSheetSingleton(stableClose)
      previousFocusRef.current?.focus?.()
    }
  }, [open])

  if (!open) return null

  const resolvedTitleId = title ? (titleId ?? 'mobile-sheet-title') : undefined

  return createPortal(
    <>
      <div
        className={mobileSheetOverlay}
        onClick={onClose}
        data-testid={testId ? `${testId}-overlay` : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
        tabIndex={-1}
        data-testid={testId}
        className={cn(
          mobileSheetPanel,
          large && 'rounded-t-[20px]',
          maxHeightClassName,
          'flex flex-col overflow-hidden pb-[max(1rem,env(safe-area-inset-bottom))]',
          className
        )}
      >
        <div className="flex shrink-0 flex-col items-center gap-3 px-4 pt-2.5">
          <div className="h-1 w-9 rounded-full bg-border" aria-hidden="true" />
          <div className="flex w-full items-center justify-between">
            {title ? (
              <h2 id={resolvedTitleId} className="text-[15px] font-extrabold text-foreground">
                {title}
              </h2>
            ) : (
              <span />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
              className="h-8 w-8 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <X size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">{children}</div>
      </div>
    </>,
    document.body
  )
}

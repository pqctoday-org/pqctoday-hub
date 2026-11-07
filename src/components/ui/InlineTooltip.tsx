// SPDX-License-Identifier: AGPL-3.0-only
import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { loadGlossary, type GlossaryTerm } from '../../data/glossary'
import { Link } from 'react-router'
import { ExternalLink } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { useOverlayEscape } from '@/hooks/useOverlayEscape'
import { buildGlossaryLookup } from '@/utils/glossaryLookup'

// Lazily-populated term lookup — filled by the first InlineTooltip mount
let termLookup = new Map<string, GlossaryTerm>()
let _lookupLoaded = false
let lookupPending: Promise<void> | null = null
const lookupSubscribers = new Set<() => void>()

const ensureLookup = () => {
  if (_lookupLoaded) return Promise.resolve()
  if (lookupPending) return lookupPending
  lookupPending = loadGlossary()
    .then((terms) => {
      termLookup = buildGlossaryLookup(terms)
      _lookupLoaded = true
      lookupSubscribers.forEach((notify) => notify())
    })
    .finally(() => {
      lookupPending = null
    })
  return lookupPending
}

interface InlineTooltipProps {
  /** The glossary term or acronym to look up (case-insensitive) */
  term: string
  /** Optional display text override (defaults to term) */
  children?: React.ReactNode
}

type TooltipStyle = { top: number; left: number } | { bottom: number; left: number }

export const InlineTooltip: React.FC<InlineTooltipProps> & { displayName?: string } = ({
  term,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<TooltipStyle | null>(null)
  // Force re-render when lookup is loaded
  const [, setLookupReady] = useState(_lookupLoaded)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const dialogId = useId()
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pinned = useRef(false)
  const suppressFocus = useRef(false)
  const cancelLeave = useCallback(() => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    leaveTimer.current = null
  }, [])

  useEffect(() => {
    const notify = () => setLookupReady(true)
    lookupSubscribers.add(notify)
    // A failed optional definition lookup leaves the prose readable; a later mount retries.
    void ensureLookup().catch(() => {})
    return () => {
      lookupSubscribers.delete(notify)
      cancelLeave()
    }
  }, [cancelLeave])

  const entry = termLookup.get(term.toLowerCase())

  const close = useCallback(() => {
    cancelLeave()
    pinned.current = false
    setIsOpen(false)
  }, [cancelLeave])
  const restoreTrigger = useCallback(() => {
    close()
    suppressFocus.current = true
    triggerRef.current?.focus()
    suppressFocus.current = false
  }, [close])
  const scheduleClose = useCallback(() => {
    cancelLeave()
    if (!pinned.current) leaveTimer.current = setTimeout(close, 180)
  }, [cancelLeave, close])
  const leaveFocus = useCallback(
    (event: React.FocusEvent) => {
      const next = event.relatedTarget as Node | null
      if (triggerRef.current?.contains(next) || popoverRef.current?.contains(next)) return
      close()
    },
    [close]
  )

  const open = useCallback(() => {
    cancelLeave()
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      // Clamp horizontally: tooltip is 288px (w-72), centered via translateX(-50%)
      const halfW = 144
      const clampedX = Math.max(halfW + 8, Math.min(centerX, window.innerWidth - halfW - 8))
      if (window.innerHeight - rect.bottom >= 220) {
        setTooltipStyle({ top: rect.bottom + 6, left: clampedX })
      } else {
        setTooltipStyle({ bottom: window.innerHeight - rect.top + 6, left: clampedX })
      }
    }
    setIsOpen(true)
  }, [cancelLeave])

  useOverlayEscape(isOpen, restoreTrigger, { rootRef: popoverRef })

  // Close on outside click, or reposition a keyboard-focused definition on scroll.
  useEffect(() => {
    if (!isOpen) return
    const handleOutsideTap = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      )
        return
      close()
    }
    const handleScroll = (event: Event) => {
      if (event.target instanceof Node && popoverRef.current?.contains(event.target)) return
      if (
        triggerRef.current === document.activeElement ||
        popoverRef.current?.contains(document.activeElement)
      ) {
        open()
      } else close()
    }
    document.addEventListener('mousedown', handleOutsideTap)
    window.addEventListener('scroll', handleScroll, { capture: true })
    return () => {
      document.removeEventListener('mousedown', handleOutsideTap)
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [isOpen, close, open])

  if (!entry) return <>{children ?? term}</>

  return (
    <>
      <Button
        variant="ghost"
        ref={triggerRef}
        onMouseEnter={open}
        onMouseLeave={scheduleClose}
        onFocus={() => {
          if (!suppressFocus.current) open()
        }}
        onBlur={leaveFocus}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            restoreTrigger()
            return
          }
          if (event.key === 'Tab' && !event.shiftKey && isOpen) {
            const link = popoverRef.current?.querySelector<HTMLAnchorElement>('a[href]')
            if (link) {
              event.preventDefault()
              link.focus()
            }
          }
        }}
        onClick={() => {
          if (pinned.current) close()
          else {
            pinned.current = true
            open()
          }
        }}
        className={clsx(
          // `whitespace-normal` overrides Button's base `whitespace-nowrap`: an inline
          // glossary trigger must wrap with the prose around it. Without it a long term
          // ("Cryptographically Relevant Quantum Computer (CRQC)") took its full
          // intrinsic width and pushed the page past a 390px viewport.
          'inline cursor-help whitespace-normal border-b border-dotted border-primary/40 text-inherit font-inherit transition-colors hover:border-primary hover:text-primary',
          'print:border-0 print:cursor-default'
        )}
        aria-haspopup="dialog"
        aria-controls={isOpen ? dialogId : undefined}
        aria-expanded={isOpen}
        aria-label={`Definition of ${entry.term}`}
      >
        {children ?? term}
      </Button>
      {isOpen &&
        tooltipStyle &&
        createPortal(
          // The nonmodal dialog contains an interactive link; these handlers bridge
          // its portal hover/focus boundary without turning the container into a button.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <div
            ref={popoverRef}
            id={dialogId}
            role="dialog"
            tabIndex={-1}
            aria-label={`Definition of ${entry.term}`}
            onMouseEnter={cancelLeave}
            onMouseLeave={scheduleClose}
            onFocus={cancelLeave}
            onBlur={leaveFocus}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                event.stopPropagation()
                restoreTrigger()
                return
              }
              if (event.key !== 'Tab') return
              event.preventDefault()
              if (event.shiftKey) {
                restoreTrigger()
                return
              }
              const controls = Array.from(
                document.querySelectorAll<HTMLElement>(
                  'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
                )
              ).filter(
                (element) =>
                  !popoverRef.current?.contains(element) && element.getClientRects().length > 0
              )
              const index = controls.indexOf(triggerRef.current!)
              close()
              controls[index + 1]?.focus()
            }}
            style={{
              position: 'fixed',
              zIndex: 9999,
              transform: 'translateX(-50%)',
              ...tooltipStyle,
            }}
            className="w-72 p-3 rounded-lg border border-border bg-background shadow-lg print:hidden"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-semibold text-sm text-foreground">{entry.term}</span>
              {entry.acronym && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  ({entry.acronym})
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{entry.definition}</p>
            {entry.relatedModule && (
              <Link
                to={entry.relatedModule}
                className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-2"
                onClick={close}
              >
                <ExternalLink size={9} />
                Learn more →
              </Link>
            )}
          </div>,
          document.body
        )}
    </>
  )
}

InlineTooltip.displayName = 'InlineTooltip'

// SPDX-License-Identifier: GPL-3.0-only
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { glossaryTerms } from '../../data/glossaryData'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import clsx from 'clsx'

const termLookup = new Map(
  glossaryTerms.flatMap((t) => {
    const entries: [string, (typeof glossaryTerms)[number]][] = [[t.term.toLowerCase(), t]]
    if (t.acronym) entries.push([t.acronym.toLowerCase(), t])
    return entries
  })
)

interface InlineTooltipProps {
  /** The glossary term or acronym to look up (case-insensitive) */
  term: string
  /** Optional display text override (defaults to term) */
  children?: React.ReactNode
}

type TooltipStyle = { top: number; left: number } | { bottom: number; left: number }

export const InlineTooltip: React.FC<InlineTooltipProps> = ({ term, children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<TooltipStyle | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const entry = termLookup.get(term.toLowerCase())

  const close = useCallback(() => setIsOpen(false), [])

  const open = useCallback(() => {
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
  }, [])

  // Close on Escape, outside click, or scroll (scroll would misplace the fixed tooltip)
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const handleOutsideTap = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      )
        return
      close()
    }
    const handleScroll = () => close()
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleOutsideTap)
    window.addEventListener('scroll', handleScroll, { capture: true })
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleOutsideTap)
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [isOpen, close])

  if (!entry) return <>{children ?? term}</>

  return (
    <>
      <button
        ref={triggerRef}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        onClick={() => setIsOpen((prev) => !prev)}
        className={clsx(
          'inline cursor-help border-b border-dotted border-primary/40 text-inherit font-inherit transition-colors hover:border-primary hover:text-primary',
          'print:border-0 print:cursor-default'
        )}
        aria-expanded={isOpen}
        aria-label={`Definition of ${entry.term}`}
      >
        {children ?? term}
      </button>
      {isOpen &&
        tooltipStyle &&
        createPortal(
          <div
            ref={popoverRef}
            role="tooltip"
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

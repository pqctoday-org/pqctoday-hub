import { useState, useRef, useEffect, useCallback } from 'react'
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

export const InlineTooltip: React.FC<InlineTooltipProps> = ({ term, children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<'above' | 'below'>('below')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const entry = termLookup.get(term.toLowerCase())

  const close = useCallback(() => setIsOpen(false), [])

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        setPosition(spaceBelow < 220 ? 'above' : 'below')
      }
      return !prev
    })
  }, [])

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      )
        return
      close()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, close])

  if (!entry) return <>{children ?? term}</>

  return (
    <span className="relative inline print:contents">
      <button
        ref={triggerRef}
        onClick={toggle}
        className={clsx(
          'inline cursor-help border-b border-dotted border-primary/40 text-inherit font-inherit transition-colors hover:border-primary hover:text-primary',
          'print:border-0 print:cursor-default'
        )}
        aria-expanded={isOpen}
        aria-label={`Definition of ${entry.term}`}
      >
        {children ?? term}
      </button>
      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          className={clsx(
            'absolute left-1/2 -translate-x-1/2 z-50 w-72 p-3 rounded-lg border border-border bg-background shadow-lg print:hidden',
            position === 'below' ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-semibold text-sm text-foreground">{entry.term}</span>
            {entry.acronym && (
              <span className="text-[10px] font-mono text-muted-foreground">({entry.acronym})</span>
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
        </div>
      )}
    </span>
  )
}

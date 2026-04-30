// SPDX-License-Identifier: GPL-3.0-only
/**
 * Hover-popover badge that shows the §-reference for an artifact and, on
 * hover/focus, expands to a small popover with the parent section's summary
 * pulled from `CSWP39_SECTIONS`. Reuses the existing static `CSWP39_SECTIONS`
 * data — no new content authored.
 *
 * The badge stops click propagation so a click on the badge does NOT trigger
 * the surrounding ArtifactPlaceholder's create-on-click handler.
 */
import { useState, useRef } from 'react'
import { CSWP39_SECTIONS, type CSWP39Section } from '@/components/Compliance/cswp39Data'

export interface Cswp39SectionBadgeProps {
  /** §-reference from the tool registry, e.g. "§5.4". */
  sectionRef: string
  /** Sub-section label, e.g. "Cryptographic architecture". */
  subSection?: string
}

/**
 * Find the parent CSWP39_SECTIONS entry for a sub-reference like "§5.4".
 * Match by extracting the leading digit (3, 4, 5, 6) and looking up the
 * `section-N` entry.
 */
function findParentSection(sectionRef: string): CSWP39Section | undefined {
  const m = sectionRef.match(/§(\d)/)
  if (!m) return undefined
  const top = `section-${m[1]}` as CSWP39Section['id']
  return CSWP39_SECTIONS.find((s) => s.id === top)
}

export function Cswp39SectionBadge({ sectionRef, subSection }: Cswp39SectionBadgeProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLSpanElement>(null)

  const parent = findParentSection(sectionRef)

  const tooltipText = subSection
    ? `NIST CSWP.39 ${sectionRef} — ${subSection}`
    : `NIST CSWP.39 ${sectionRef}`

  return (
    <span
      ref={wrapperRef}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        aria-label={tooltipText}
        title={tooltipText}
        className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 bg-muted text-muted-foreground border border-border cursor-help hover:bg-muted/80"
      >
        {sectionRef}
      </span>
      {open && parent && (
        <span
          role="tooltip"
          className="absolute left-0 top-full mt-1 z-50 w-72 p-3 rounded-lg border border-border bg-background shadow-lg text-left"
        >
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            NIST CSWP.39 {parent.ref}
          </span>
          <span className="block text-sm font-semibold text-foreground mb-1">{parent.title}</span>
          <span className="block text-xs text-muted-foreground leading-relaxed">
            {parent.summary}
          </span>
          {subSection && (
            <span className="block text-[11px] text-foreground/80 mt-2 pt-2 border-t border-border/50">
              <span className="font-mono text-muted-foreground">{sectionRef}</span> {subSection}
            </span>
          )}
        </span>
      )}
    </span>
  )
}

// SPDX-License-Identifier: GPL-3.0-only
import React, { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { glossaryTerms, type GlossaryTerm } from '../data/glossaryData'

// Build a case-insensitive lookup covering all terms + acronyms
const termLookup = new Map<string, GlossaryTerm>(
  glossaryTerms.flatMap((t) => {
    const entries: [string, GlossaryTerm][] = [[t.term.toLowerCase(), t]]
    if (t.acronym) entries.push([t.acronym.toLowerCase(), t])
    return entries
  })
)

// Sort keys by length descending to match longest phrases first
// (e.g. "Harvest Now, Decrypt Later" before "Decrypt")
const GLOSSARY_KEYS = [...termLookup.keys()].sort((a, b) => b.length - a.length)

// Escape special regex characters
const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const patterns = GLOSSARY_KEYS.map(escapeRegExp).join('|')

// Use word boundaries — safe for JS regex strings.
const GLOSSARY_REGEX = new RegExp(`\\b(${patterns})\\b`, 'gi')

/**
 * Scans raw text and extracts a deduplicated list of glossary terms and their definitions.
 * Useful for building a static legend when text cannot be made interactive (e.g. images).
 */
export const extractGlossaryTerms = (text: string) => {
  if (!text) return []
  const matches = text.match(GLOSSARY_REGEX)
  if (!matches) return []

  const uniqueTerms = Array.from(new Set(matches.map((m) => m.toLowerCase())))
  return uniqueTerms
    .map((term) => {
      const entry = termLookup.get(term)
      return {
        term: entry?.term ?? term,
        definition: entry?.definition ?? null,
      }
    })
    .filter((t) => t.definition)
}

const GlossarySpan = ({ entry, displayText }: { entry: GlossaryTerm; displayText: string }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <span
      className="relative inline-block cursor-help border-b border-dotted border-primary/40 text-inherit transition-colors hover:border-primary hover:text-primary"
      role="button"
      tabIndex={0}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen((prev) => !prev)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setIsOpen((prev) => !prev)
        }
      }}
      aria-expanded={isOpen}
      aria-label={`Definition of ${entry.term}`}
    >
      {displayText}
      {isOpen && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 w-64 animate-in fade-in zoom-in-95 duration-200 print:hidden">
          <div className="relative rounded-lg border border-border bg-background p-3 text-left text-xs shadow-lg">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-semibold text-foreground">{entry.term}</span>
              {entry.acronym && (
                <span className="font-mono text-[10px] text-muted-foreground">({entry.acronym})</span>
              )}
            </div>
            <p className="leading-relaxed text-muted-foreground">{entry.definition}</p>
            {entry.technicalNote && (
              <p className="mt-1.5 leading-relaxed text-muted-foreground/70 italic">{entry.technicalNote}</p>
            )}
            {entry.relatedModule && (
              <Link
                to={entry.relatedModule}
                className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-2"
                onClick={() => setIsOpen(false)}
              >
                <ExternalLink size={9} />
                Learn more →
              </Link>
            )}
            <div className="absolute left-1/2 -bottom-[5px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-border bg-background" />
          </div>
        </span>
      )}
    </span>
  )
}

/**
 * Parses a raw string and returns an array of ReactNodes,
 * where glossary terms are wrapped in interactive tooltips.
 */
export const parseGlossaryText = (text: string): ReactNode => {
  if (!text) return text

  const parts = text.split(GLOSSARY_REGEX)
  if (parts.length === 1) return text

  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const entry = termLookup.get(part.toLowerCase())
      if (entry) {
        return <GlossarySpan key={`${i}-${part}`} entry={entry} displayText={part} />
      }
    }
    return <React.Fragment key={`${i}-text`}>{part}</React.Fragment>
  })
}

/**
 * Recursively applies the glossary parser to all string text nodes within a React
 * children tree. Skips elements with displayName 'InlineTooltip' to avoid
 * double-wrapping terms already manually annotated.
 */
export const applyGlossaryToChildren = (children: React.ReactNode): React.ReactNode => {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return parseGlossaryText(child)
    }
    if (React.isValidElement(child)) {
      // Don't recurse into InlineTooltip — it already manages its own tooltip
      const displayName =
        typeof child.type === 'function'
          ? (child.type as React.FC).displayName
          : typeof child.type === 'string'
            ? child.type
            : null
      if (displayName === 'InlineTooltip') return child

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props = child.props as any
      if (props && props.children) {
        return React.cloneElement(child, {
          ...props,
          children: applyGlossaryToChildren(props.children),
        })
      }
    }
    return child
  })
}

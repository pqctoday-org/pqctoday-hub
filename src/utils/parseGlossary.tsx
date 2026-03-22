// SPDX-License-Identifier: GPL-3.0-only
import React, { type ReactNode } from 'react'
import { CURIOUS_GLOSSARY } from '../data/curiousGlossary'

// Sort keys by length descending to match longest phrases first (e.g. "Harvest Now, Decrypt Later" before "Decrypt")
const GLOSSARY_KEYS = Object.keys(CURIOUS_GLOSSARY).sort((a, b) => b.length - a.length)

// Escape special regex characters
const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const patterns = GLOSSARY_KEYS.map(escapeRegExp).join('|')

// Use word boundaries. Safe for JS regex strings.
const GLOSSARY_REGEX = new RegExp(`\\b(${patterns})\\b`, 'gi')

/**
 * Scans raw text and extracts a deduplicated list of glossary terms and their definitions.
 * Useful for building a static legend when text cannot be made interactive (e.g. images).
 */
export const extractGlossaryTerms = (text: string) => {
  if (!text) return []
  const matches = text.match(GLOSSARY_REGEX)
  if (!matches) return []

  // Deduplicate case-insensitively
  const uniqueTerms = Array.from(new Set(matches.map((m) => m.toLowerCase())))

  return uniqueTerms
    .map((term) => {
      const originalKey = GLOSSARY_KEYS.find((k) => k.toLowerCase() === term)

      return {
        term: originalKey!,
        definition: originalKey ? CURIOUS_GLOSSARY[originalKey] : null,
      }
    })
    .filter((t) => t.definition)
}

const GlossarySpan = ({ term, definition }: { term: string; definition: string }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <span
      className="relative inline-block cursor-help font-medium text-foreground underline decoration-amber-500/70 decoration-dashed transition-all hover:decoration-amber-500 hover:decoration-solid"
      role="button"
      tabIndex={0}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(!isOpen)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setIsOpen(!isOpen)
        }
      }}
    >
      {term}
      {/* Custom Tooltip Popup (only renders when active) */}
      {isOpen && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 w-56 sm:w-64 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative rounded-md border border-border bg-popover p-2.5 text-center text-xs leading-relaxed text-popover-foreground shadow-lg font-normal">
            {definition}
            {/* Tooltip Arrow pointing down */}
            <div className="absolute left-1/2 -bottom-[5px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-border bg-popover" />
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

  // If the regex didn't match anything, return raw text
  if (parts.length === 1) return text

  return parts.map((part, i) => {
    // The regex captures the matched word, so every odd index is a match
    if (i % 2 === 1) {
      // Find the original case-sensitive key to look up the definition
      const originalKey = GLOSSARY_KEYS.find((k) => k.toLowerCase() === part.toLowerCase())
      // eslint-disable-next-line security/detect-object-injection
      const definition = originalKey ? CURIOUS_GLOSSARY[originalKey] : null

      if (definition) {
        return <GlossarySpan key={`${i}-${part}`} term={part} definition={definition} />
      }
    }

    // Standard text node
    return <React.Fragment key={`${i}-text`}>{part}</React.Fragment>
  })
}

/**
 * Recursively applies the glossary parser to all standard
 * string text nodes within a React children tree.
 */
export const applyGlossaryToChildren = (children: React.ReactNode): React.ReactNode => {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return parseGlossaryText(child)
    }
    if (React.isValidElement(child)) {
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

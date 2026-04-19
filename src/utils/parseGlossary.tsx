// SPDX-License-Identifier: GPL-3.0-only
import React, { type ReactNode } from 'react'
import { initGlossary, type GlossaryTerm } from '../data/glossary'

// ── Lazy-initialized glossary state ──────────────────────────────────────────
// The glossary is loaded asynchronously. Components using GlossaryAutoWrap
// will render plain text on first paint, then re-render with tooltips once
// the glossary is ready. This avoids bundling 269 KB of static data.

let termLookup = new Map<string, GlossaryTerm>()
let GLOSSARY_REGEX: RegExp | null = null
let _ready = false
const _readyCallbacks: Array<() => void> = []

/** Rebuild the regex + lookup from loaded terms */
const rebuildIndex = (terms: GlossaryTerm[]) => {
  termLookup = new Map<string, GlossaryTerm>(
    terms.flatMap((t) => {
      const entries: [string, GlossaryTerm][] = [[t.term.toLowerCase(), t]]
      if (t.acronym) entries.push([t.acronym.toLowerCase(), t])
      return entries
    })
  )

  const keys = [...termLookup.keys()].sort((a, b) => b.length - a.length)
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = keys.map(escapeRegExp).join('|')
  GLOSSARY_REGEX = new RegExp(`(?<![a-zA-Z0-9_])(${patterns})(?![a-zA-Z0-9_])`, 'gi')
  _ready = true
  _readyCallbacks.forEach((cb) => cb())
  _readyCallbacks.length = 0
}

// Kick off load immediately on module import
initGlossary().then(rebuildIndex)

/** Register a callback for when the glossary is ready (used by components to force re-render) */
export const onGlossaryReady = (cb: () => void) => {
  if (_ready) {
    cb()
    return
  }
  _readyCallbacks.push(cb)
}

export const isGlossaryReady = () => _ready

/**
 * Scans raw text and extracts a deduplicated list of glossary terms and their definitions.
 * Useful for building a static legend when text cannot be made interactive (e.g. images).
 */
export const extractGlossaryTerms = (text: string) => {
  if (!text || !GLOSSARY_REGEX) return []
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

import { InlineTooltip } from '../components/ui/InlineTooltip'

const GlossarySpan = ({ entry, displayText }: { entry: GlossaryTerm; displayText: string }) => {
  return <InlineTooltip term={entry.term}>{displayText}</InlineTooltip>
}

/**
 * Parses a raw string and returns an array of ReactNodes,
 * where glossary terms are wrapped in interactive tooltips.
 */
export const parseGlossaryText = (text: string): ReactNode => {
  if (!text || !GLOSSARY_REGEX) return text

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

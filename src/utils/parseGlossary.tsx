// SPDX-License-Identifier: AGPL-3.0-only
import React, { type ReactNode } from 'react'
import { glossaryTerms, type GlossaryTerm } from '../data/glossaryData'
import { InlineTooltip } from '../components/ui/InlineTooltip'

const termLookup = new Map<string, GlossaryTerm>(
  glossaryTerms.flatMap((t) => {
    const entries: [string, GlossaryTerm][] = [[t.term.toLowerCase(), t]]
    if (t.acronym) entries.push([t.acronym.toLowerCase(), t])
    return entries
  })
)

/**
 * Keys the glossary writes only in capitals ("CAN", "HE", "FAIR", "NIST"). The match is
 * case-insensitive so that "Entropy" and "entropy" both link, but a capitals-only key that is also
 * an ordinary word ("can", "he", "fair", "cast") must be written the way the glossary writes it:
 * otherwise every "can" in a sentence becomes a glossary chip for the CAN bus.
 */
const CAPITALS_ONLY_KEYS = new Map<string, Set<string>>()
for (const t of glossaryTerms) {
  for (const spelling of [t.term, t.acronym]) {
    if (!spelling) continue
    const key = spelling.toLowerCase()
    const spellings = CAPITALS_ONLY_KEYS.get(key) ?? new Set<string>()
    spellings.add(spelling)
    CAPITALS_ONLY_KEYS.set(key, spellings)
  }
}
for (const [key, spellings] of CAPITALS_ONLY_KEYS) {
  const capitalsOnly = [...spellings].every((x) => x === x.toUpperCase() && /[A-Z]/.test(x))
  if (!capitalsOnly) CAPITALS_ONLY_KEYS.delete(key)
}

/** True when `matched` (as written in the text) is a glossary term, in the case it requires. */
const isGlossaryMatch = (matched: string): boolean => {
  const key = matched.toLowerCase()
  if (!termLookup.has(key)) return false
  const required = CAPITALS_ONLY_KEYS.get(key)
  return !required || required.has(matched)
}

const GLOSSARY_KEYS = [...termLookup.keys()].sort((a, b) => b.length - a.length)
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const patterns = GLOSSARY_KEYS.map(escapeRegExp).join('|')
const GLOSSARY_REGEX = new RegExp(`(?<![a-zA-Z0-9_])(${patterns})(?![a-zA-Z0-9_])`, 'gi')

/**
 * Scans raw text and extracts a deduplicated list of glossary terms and their definitions.
 * Useful for building a static legend when text cannot be made interactive (e.g. images).
 */
export const extractGlossaryTerms = (text: string) => {
  if (!text) return []
  const matches = text.match(GLOSSARY_REGEX)
  if (!matches) return []

  const uniqueTerms = Array.from(
    new Set(matches.filter(isGlossaryMatch).map((m) => m.toLowerCase()))
  )
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
  return <InlineTooltip term={entry.term}>{displayText}</InlineTooltip>
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
      const entry = isGlossaryMatch(part) ? termLookup.get(part.toLowerCase()) : undefined
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

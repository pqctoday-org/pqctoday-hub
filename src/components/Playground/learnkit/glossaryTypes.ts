// SPDX-License-Identifier: GPL-3.0-only
//
// glossaryTypes.ts — protocol-agnostic shapes for the shared glossary rail.
// Extracted from the KMIP playground's kmip3/glossary.ts so a second
// playground (PKCS#11) can supply its own glossary content through the same
// GlossaryProvider/GlossaryRail/Term components.

export interface TagGlossaryEntry {
  /** A verified wire codepoint / constant value, shown next to the term. */
  hex?: string
  def: string
}

export type TermCategory = 'wire' | 'protocol' | 'pqc'

export interface GlossaryTerm {
  id: string
  label: string
  cat: TermCategory
  def: string
}

/** One playground's full glossary content — passed into `GlossaryProvider`. */
export interface GlossaryData {
  /** Keyed by the human tag/attribute/constant name shown inline via `Term`. */
  tagGlossary: Record<string, TagGlossaryEntry>
  terms: GlossaryTerm[]
  /** Resolve a `Term`'s `glossaryKey` (a `tagGlossary` key or a `terms[].id`)
   * to its definition. Both namespaces must not collide. */
  lookupDef: (key: string) => string | undefined
  /** Rail section headings — override per playground (e.g. PKCS#11's
   * `tagGlossary` holds API/attribute/mechanism names, not wire tags).
   * Defaults match the KMIP playground's original wording. */
  sectionTitles?: { wire?: string; protocol?: string; pqc?: string }
}

/** Build a `GlossaryData.lookupDef` from `tagGlossary` + `terms`. */
export const makeGlossaryLookup =
  (tagGlossary: Record<string, TagGlossaryEntry>, terms: GlossaryTerm[]) =>
  (key: string): string | undefined => {
    const termById = Object.fromEntries(terms.map((t) => [t.id, t]))
    // eslint-disable-next-line security/detect-object-injection -- read-only lookup against this module's own fixed glossary catalogs, never used to write; `key` is always a wire tag name or terms id, never raw user input.
    return tagGlossary[key]?.def ?? termById[key]?.def
  }

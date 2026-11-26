// SPDX-License-Identifier: AGPL-3.0-only
// Glossary types — shared by all category JSON files and consumers.

export interface GlossaryTerm {
  /** Permanent identifier that remains stable when the display term changes. */
  id: string
  term: string
  acronym?: string
  definition: string
  /**
   * The plain-language definition Curious Explorer mode shows when a reader looks the term up by its
   * name. Stored once, on the term; the Curious glossary is read from it (`loadCuriousGlossary`).
   */
  plainDefinition?: string
  /** The plain-language definition shown when the reader looks the term up by its acronym, where it is worded differently. */
  plainDefinitionAcronym?: string
  technicalNote?: string
  /**
   * The link a visitor follows from the term: a Learn lesson path (`/learn/...`) or another page
   * (Library, Algorithms, Migrate, ...).
   */
  relatedModule?: string
  /**
   * The Learn lesson the term belongs to, as lesson ids (`module_id`) joined by `;`, for a term whose
   * link above leads to another page. A term that links to a lesson names that lesson there and has no
   * value here: the lesson is stored in one place. Not shown on the page.
   */
  module_ids?: string
  /** Stable id from trusted_sources_*.csv when the definition is a direct status claim. */
  trustedSourceId?: string
  complexity: 'beginner' | 'intermediate' | 'advanced'
  category: 'algorithm' | 'protocol' | 'standard' | 'concept' | 'organization'
}

export interface GlossaryChipTerm {
  id: string
  term: string
  definition: string
}

// SPDX-License-Identifier: AGPL-3.0-only
// Glossary types — shared by all category JSON files and consumers.

export interface GlossaryTerm {
  /** Permanent identifier that remains stable when the display term changes. */
  id: string
  term: string
  acronym?: string
  definition: string
  technicalNote?: string
  relatedModule?: string
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

// SPDX-License-Identifier: GPL-3.0-only
// Glossary types — shared by all category JSON files and consumers.

export interface GlossaryTerm {
  term: string
  acronym?: string
  definition: string
  technicalNote?: string
  relatedModule?: string
  complexity: 'beginner' | 'intermediate' | 'advanced'
  category: 'algorithm' | 'protocol' | 'standard' | 'concept' | 'organization'
}

export interface GlossaryChipTerm {
  term: string
  definition: string
}

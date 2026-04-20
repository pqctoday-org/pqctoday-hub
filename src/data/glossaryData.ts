// SPDX-License-Identifier: GPL-3.0-only
import type { GlossaryTerm } from './glossary/types'
import algorithms from './glossary/algorithms.json'
import protocols from './glossary/protocols.json'
import standards from './glossary/standards.json'
import concepts from './glossary/concepts.json'
import organizations from './glossary/organizations.json'

export type { GlossaryTerm }

export const glossaryTerms: GlossaryTerm[] = [
  ...(algorithms as unknown as GlossaryTerm[]),
  ...(protocols as unknown as GlossaryTerm[]),
  ...(standards as unknown as GlossaryTerm[]),
  ...(concepts as unknown as GlossaryTerm[]),
  ...(organizations as unknown as GlossaryTerm[]),
]

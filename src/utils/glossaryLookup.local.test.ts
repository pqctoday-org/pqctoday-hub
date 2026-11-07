// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { buildGlossaryLookup } from './glossaryLookup'
import { glossaryTerms } from '@/data/glossaryData'
import type { GlossaryTerm } from '@/data/glossary/types'

const sample = (term: string, acronym: string): GlossaryTerm => ({
  term,
  acronym,
  definition: `${term} sample definition`,
  category: 'concept',
  complexity: 'beginner',
})

describe('canonical glossary identity before acronym aliases', () => {
  it('retains the exact current DER and CSA records and their full alternate names', () => {
    const lookup = buildGlossaryLookup(glossaryTerms)
    for (const name of [
      'DER',
      'CSA',
      'DER (Distributed Energy Resource)',
      'Cloud Security Alliance',
    ]) {
      expect(lookup.get(name.toLowerCase())).toBe(glossaryTerms.find((term) => term.term === name))
    }
    expect(lookup.get('der')?.relatedModule).toBe('/learn/pki-workshop')
    expect(lookup.get('csa')?.relatedModule).toBe('/learn/standards-bodies')
  })
  it('leaves a shared noncanonical alias unassigned in either source order', () => {
    const one = sample('Sample One', 'XYZ'),
      two = sample('Sample Two', 'XYZ')
    for (const terms of [
      [one, two],
      [two, one],
    ]) {
      const lookup = buildGlossaryLookup(terms)
      expect(lookup.has('xyz')).toBe(false)
      expect(lookup.get('sample one')).toBe(one)
      expect(lookup.get('sample two')).toBe(two)
    }
  })
  it('preserves an exact canonical name even when conflicting aliases appear before or after it', () => {
    const one = sample('Sample One', 'XYZ'),
      two = sample('Sample Two', 'XYZ'),
      canonical = sample('XYZ', 'Expanded XYZ')
    for (const terms of [
      [one, canonical, two],
      [canonical, two, one],
    ]) {
      expect(buildGlossaryLookup(terms).get('xyz')).toBe(canonical)
    }
  })
  it('retains unique aliases without changing the caller records or defining a review priority', () => {
    const one = sample('Sample One', 'ONLY'),
      terms = [one]
    const before = JSON.stringify(terms)
    expect(buildGlossaryLookup(terms).get('only')).toBe(one)
    expect(JSON.stringify(terms)).toBe(before)
  })
})

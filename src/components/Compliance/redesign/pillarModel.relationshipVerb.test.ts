// SPDX-License-Identifier: AGPL-3.0-only
//
// Side-panel wording for the two structural relationship types. A national
// scheme reads "National scheme under" the umbrella, and the umbrella reads
// "Umbrella of" the scheme; a volume reads "Part of series with" its main
// document, and the main document reads "Includes" the volume. Neither is
// ever worded as sameness.
import { describe, expect, it, vi } from 'vitest'
import type { ConceptXwalkRecord } from '@/data/conceptXwalkData'

const injected: ConceptXwalkRecord[] = vi.hoisted(() => [
  {
    xwalkId: 'xw-test-scheme',
    fromConcept: 'ANSSI-COMMON-CRITERIA-CERTIFIC',
    toConcept: 'COMMON-CRITERIA',
    fromConceptId: 'guidance:anssi-common-criteria-certific',
    toConceptId: 'guidance:common-criteria',
    relationshipType: 'scheme_under',
    rationaleType: 'policy_reference',
    evidence: 'test',
    verifiedDate: '2026-11-05',
    verifiedBy: 'test',
    confidence: 'high',
    confidenceScore: 85,
  },
])

vi.mock('@/data/conceptXwalkData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/conceptXwalkData')>()
  return { ...actual, conceptXwalkData: [...actual.conceptXwalkData, ...injected] }
})

import { buildDrawerDetail, relationshipVerb } from './pillarModel'
import { complianceFrameworks } from '@/data/complianceData'

function record(relationshipType: string): ConceptXwalkRecord {
  return { ...injected[0], relationshipType } as ConceptXwalkRecord
}

describe('relationshipVerb', () => {
  it('scheme_under reads from each end', () => {
    expect(relationshipVerb(record('scheme_under'), true)).toBe('National scheme under')
    expect(relationshipVerb(record('scheme_under'), false)).toBe('Umbrella of')
  })

  it('part_of_series reads from each end', () => {
    expect(relationshipVerb(record('part_of_series'), true)).toBe('Part of series with')
    expect(relationshipVerb(record('part_of_series'), false)).toBe('Includes')
  })

  it('neither structural type is ever worded as equivalence', () => {
    for (const type of ['scheme_under', 'part_of_series']) {
      for (const side of [true, false]) {
        expect(relationshipVerb(record(type), side)).not.toMatch(/equivalent/i)
      }
    }
  })

  it('the existing types keep their wording', () => {
    expect(relationshipVerb(record('subset_of'), true)).toBe('Subset of')
    expect(relationshipVerb(record('subset_of'), false)).toBe('Superset of')
    expect(relationshipVerb(record('superset_of'), true)).toBe('Superset of')
    expect(relationshipVerb(record('equivalent'), false)).toBe('Equivalent to')
    expect(relationshipVerb(record('intersects_with'), true)).toBe('Relates to')
  })

  it('a type the table does not know degrades to the neutral wording', () => {
    expect(relationshipVerb(record('published_by'), true)).toBe('Relates to')
    expect(relationshipVerb(record('published_by'), false)).toBe('Relates to')
  })
})

describe('buildDrawerDetail with a scheme_under row', () => {
  const scheme = complianceFrameworks.find((f) => f.id === 'ANSSI-COMMON-CRITERIA-CERTIFIC')
  const umbrella = complianceFrameworks.find((f) => f.id === 'COMMON-CRITERIA')

  it('the national scheme row says "National scheme under" the umbrella', () => {
    expect(scheme, 'compliance row ANSSI-COMMON-CRITERIA-CERTIFIC should exist').toBeDefined()
    if (!scheme) return
    const d = buildDrawerDetail(scheme, 'certify')
    const node = d.chain.find((c) => c.kind === 'National scheme under')
    expect(node?.value).toBe('COMMON-CRITERIA')
    expect(d.crosswalk.find((c) => c.name === 'COMMON-CRITERIA')?.note).toMatch(
      /^national scheme under/
    )
  })

  it('the umbrella row says "Umbrella of" the national scheme', () => {
    expect(umbrella, 'compliance row COMMON-CRITERIA should exist').toBeDefined()
    if (!umbrella) return
    const d = buildDrawerDetail(umbrella, 'certify')
    const node = d.chain.find((c) => c.kind === 'Umbrella of')
    expect(node?.value).toBe('ANSSI-COMMON-CRITERIA-CERTIFIC')
    expect(d.chain.some((c) => c.kind === 'Equivalent to')).toBe(false)
  })
})

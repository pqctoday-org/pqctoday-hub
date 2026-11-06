// SPDX-License-Identifier: AGPL-3.0-only
//
// The relationships the drawer shows for a standards body or umbrella scheme
// must be the ones recorded against that body or scheme itself. `NIST`
// publishes dozens of documents, `ETSI` and `IETF` publish hundreds, and
// `Common Criteria` sits above every national certification scheme; the
// cross-walk edges that belong to those individual publications and schemes
// are not relationships of the publisher or umbrella.
import { describe, expect, it } from 'vitest'
import { buildDrawerDetail, type PillarId } from './pillarModel'
import { complianceFrameworks } from '@/data/complianceData'
import { conceptXwalkData } from '@/data/conceptXwalkData'
import { conceptRegistry } from '@/data/conceptRegistry'

function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Counterparts of the cross-walk edges recorded against this exact row. */
function ownCounterparts(frameworkId: string, label: string): Set<string> {
  const ownIds = new Set(
    conceptRegistry
      .filter((r) => kebab(r.sourceRowId) === kebab(frameworkId))
      .map((r) => r.conceptId)
  )
  const ownLabels = new Set([frameworkId, label])
  const out = new Set<string>()
  for (const e of conceptXwalkData) {
    const fromIsOwn = ownIds.has(e.fromConceptId) || ownLabels.has(e.fromConcept)
    const toIsOwn = ownIds.has(e.toConceptId) || ownLabels.has(e.toConcept)
    if (fromIsOwn && !toIsOwn) out.add(e.toConcept)
    else if (toIsOwn && !fromIsOwn) out.add(e.fromConcept)
  }
  return out
}

const PILLARS: PillarId[] = ['standardize', 'certify', 'comply']
const RELATION_VERBS = new Set(['Relates to', 'Subset of', 'Superset of', 'Equivalent to'])

describe('buildDrawerDetail — publishers and umbrella schemes do not inherit their members relationships', () => {
  for (const id of ['NIST', 'ETSI', 'IETF', 'ANSSI', 'COMMON-CRITERIA']) {
    it(`${id}: every relationship shown is one recorded against ${id} itself`, () => {
      const row = complianceFrameworks.find((f) => f.id === id)
      expect(row, `compliance row ${id} should exist`).toBeDefined()
      if (!row) return
      const own = ownCounterparts(row.id, row.label)
      for (const pillar of PILLARS) {
        const d = buildDrawerDetail(row, pillar)
        const shown = [
          ...d.crosswalk.map((c) => c.name),
          ...d.chain.filter((n) => RELATION_VERBS.has(n.kind)).map((n) => n.value),
        ]
        for (const name of shown) {
          expect(
            own.has(name),
            `${id}/${pillar} shows "${name}", which is not a relationship of ${id} itself`
          ).toBe(true)
        }
      }
    })
  }

  it('ETSI has no relationship recorded against the body itself, so the drawer shows none rather than those of its individual documents', () => {
    const row = complianceFrameworks.find((f) => f.id === 'ETSI')
    expect(row).toBeDefined()
    if (!row) return
    expect(ownCounterparts(row.id, row.label).size).toBe(0)
    expect(buildDrawerDetail(row, 'standardize').crosswalk).toEqual([])
  })
})

// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { buildCoverageMatrix } from './coverageModel'
import { fixtureInputs } from './coverageFixture'
import { groupByMechanismOperation, groupMatchesStatus } from './coverageExport'

const groups = groupByMechanismOperation(buildCoverageMatrix(fixtureInputs([])).matrix)

describe('groupMatchesStatus', () => {
  it('"untested" matches a group with any untested cell, not only an all-untested group', () => {
    const partly = groups.filter((g) => {
      const gp = g.engines.cpp.polarity.positive
      return gp.status !== 'untested' && gp.status !== 'unsupported' && gp.untested > 0
    })
    expect(partly.length).toBeGreaterThan(0)
    for (const g of partly) expect(groupMatchesStatus(g, 'cpp', 'positive', 'untested')).toBe(true)
  })

  it('"untested" never matches a group with no untested advertised cell', () => {
    for (const g of groups) {
      const anyUntested = g.rows.some(
        (r) => r.engines.cpp.advertised && r.engines.cpp.polarity.positive.status === 'untested'
      )
      expect(groupMatchesStatus(g, 'cpp', 'positive', 'untested')).toBe(anyUntested)
    }
  })

  it('other statuses match the displayed (strongest) status; "all" matches everything', () => {
    for (const g of groups) {
      const shown = g.engines.cpp.polarity.positive.status
      expect(groupMatchesStatus(g, 'cpp', 'positive', 'all')).toBe(true)
      if (shown !== 'untested') {
        expect(groupMatchesStatus(g, 'cpp', 'positive', shown)).toBe(true)
      }
    }
  })
})

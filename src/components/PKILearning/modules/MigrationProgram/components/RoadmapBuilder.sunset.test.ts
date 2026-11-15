// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The Mitigation Gateway sunset date is the Hub's suggestion, not a CSWP.39
 * rule. An empty sunset is exported as "not set" (never "MISSING"), and the
 * export never says a sunset date is mandatory.
 */
import { describe, it, expect } from 'vitest'
import { buildRoadmapMarkdown, DEFAULT_MILESTONES } from './RoadmapBuilder'

describe('Roadmap export: mitigation sunset date', () => {
  it('writes "not set" for an empty sunset cell, not "MISSING"', () => {
    const md = buildRoadmapMarkdown([], DEFAULT_MILESTONES, [
      { asset: 'Legacy MQ', gatewayProductId: '', reason: 'blocked', sunset: '' },
    ])
    expect(md).toContain('| Legacy MQ | — | blocked | not set |')
    expect(md).not.toContain('MISSING')
  })

  it('keeps a sunset date the user entered', () => {
    const md = buildRoadmapMarkdown([], DEFAULT_MILESTONES, [
      { asset: 'Legacy MQ', gatewayProductId: '', reason: 'blocked', sunset: '2030-01-01' },
    ])
    expect(md).toContain('| Legacy MQ | — | blocked | 2030-01-01 |')
  })

  it('labels the sunset column as a Hub suggestion and says CSWP.39 does not prescribe one', () => {
    const withRows = buildRoadmapMarkdown([], DEFAULT_MILESTONES, [
      { asset: 'a', gatewayProductId: '', reason: 'b', sunset: '' },
    ])
    expect(withRows).toContain('Sunset (Hub suggestion, not a NIST rule)')

    const empty = buildRoadmapMarkdown([], DEFAULT_MILESTONES, [])
    expect(empty).toContain('our suggestion')
    expect(empty).toContain('does not prescribe one')
    expect(empty).not.toMatch(/requires? a sunset|mandatory/i)
  })
})

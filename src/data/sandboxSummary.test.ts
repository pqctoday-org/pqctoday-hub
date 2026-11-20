// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SANDBOX_SCENARIOS, SANDBOX_TRACKS } from '@/data/sandboxScenarios'
import {
  SANDBOX_NAMED_TOOLS,
  SANDBOX_NAMED_USE_CASES,
  SANDBOX_SCENARIO_COUNT,
  SANDBOX_TRACK_LABELS,
  joinWithAnd,
} from './sandboxSummary'
import { totalModuleMinutes } from '@/components/About/aboutData'

describe('About page Sandbox summary', () => {
  it('counts the scenarios and tracks the Sandbox actually has', () => {
    expect(SANDBOX_SCENARIO_COUNT).toBe(SANDBOX_SCENARIOS.length)
    expect(SANDBOX_TRACK_LABELS).toEqual(SANDBOX_TRACKS.map((t) => t.label))
  })

  it('names only tools that some scenario uses', () => {
    const toolNames = SANDBOX_SCENARIOS.map((s) => s.tool.name).join(' | ')
    for (const tool of SANDBOX_NAMED_TOOLS) {
      expect(toolNames, tool).toContain(tool)
    }
  })

  it('names only use cases that match a scenario title', () => {
    const titles = SANDBOX_SCENARIOS.map((s) => s.title)
    for (const u of SANDBOX_NAMED_USE_CASES) {
      expect(
        titles.some((t) => u.titleMatch.test(t)),
        u.label
      ).toBe(true)
    }
  })

  it('joins a list with commas and a final "and"', () => {
    expect(joinWithAnd(['a'])).toBe('a')
    expect(joinWithAnd(['a', 'b'])).toBe('a and b')
    expect(joinWithAnd(['a', 'b', 'c'])).toBe('a, b and c')
  })
})

describe('totalModuleMinutes', () => {
  it('adds minute and hour durations and ignores free-text ones', () => {
    expect(totalModuleMinutes(['45 min', '1 hr 30 min', '2 hours', 'Ongoing, lab-based'])).toBe(
      45 + 90 + 120
    )
  })
})

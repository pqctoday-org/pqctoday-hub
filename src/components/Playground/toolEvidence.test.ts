// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { WORKSHOP_TOOLS } from './workshopRegistry'
import { BROWSER_TOOL_EVIDENCE, NON_CERTIFICATION_NOTICE } from './toolEvidence'

describe('browser Playground evidence contract', () => {
  it('classifies every browser tool and no unknown tool', () => {
    const browserIds = WORKSHOP_TOOLS.filter((tool) => !tool.sandbox).map((tool) => tool.id)
    expect(Object.keys(BROWSER_TOOL_EVIDENCE).sort()).toEqual([...browserIds].sort())
  })

  it('gives every class an explanatory boundary', () => {
    for (const profile of Object.values(BROWSER_TOOL_EVIDENCE)) {
      expect(profile.summary.length).toBeGreaterThan(30)
      expect(profile.summary.endsWith('.')).toBe(true)
    }
    expect(NON_CERTIFICATION_NOTICE).toMatch(/not an ACVP\/CAVP result/i)
  })
})

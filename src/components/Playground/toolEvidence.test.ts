// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { WORKSHOP_TOOLS } from './workshopRegistry'
import { BROWSER_TOOL_EVIDENCE, NON_CERTIFICATION_NOTICE } from './toolEvidence'
import { VALIDATION_DISCLAIMER } from '@/data/validationDisclaimer'

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

  it('shows the one validation disclaimer on the tools that replay public reference samples', () => {
    for (const id of ['entropy-test', 'drbg-demo', 'firmware-signing', 'slh-dsa']) {
      const profile = BROWSER_TOOL_EVIDENCE[id as keyof typeof BROWSER_TOOL_EVIDENCE]
      expect(profile.certificationBoundary, id).toBe(true)
      expect(profile.validationDisclaimer, id).toBe(true)
    }
    expect(VALIDATION_DISCLAIMER).toMatch(/not an ACVTS verdict/)
  })
})

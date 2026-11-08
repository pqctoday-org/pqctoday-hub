// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { PILLARS } from './cpmMaturityModel'

describe('assurance pillar self-assessment question', () => {
  it('asks for an Active certificate that names the exact version and environment', () => {
    const assurance = PILLARS.find((p) => p.id === 'assurance')!
    expect(assurance.question).toBe(
      'For each library and HSM you rely on for FIPS 140-3 compliance, can you show an Active certificate that names the exact version and operating environment you run?'
    )
    expect(assurance.question).not.toMatch(/every library and HSM in production/)
  })
})

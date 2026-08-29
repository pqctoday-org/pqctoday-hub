// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'
import { mobilePracticeTool, resolveModuleTool } from './moduleToolLinks'

describe('mobilePracticeTool — Wave B2 mobile "Practice on your phone" shortlist', () => {
  it('excludes the 3 modules declined for mobile even though they have a real derived tool', () => {
    for (const id of ['mls-group-messaging', 'vpn-ssh-pqc', 'confidential-computing']) {
      const manifest = MANIFEST_BY_ID[id]!
      expect(resolveModuleTool(manifest), `${id} should still have a derived tool`).toBeTruthy()
      expect(mobilePracticeTool(manifest), `${id} should be excluded from mobile`).toBeUndefined()
    }
  })

  it('returns the same tool resolveModuleTool would, for a module not on the exclusion list', () => {
    const manifest = MANIFEST_BY_ID['slh-dsa']!
    expect(mobilePracticeTool(manifest)).toBe(resolveModuleTool(manifest))
    expect(mobilePracticeTool(manifest)).toBe('slh-dsa')
  })

  it('has no twin for crypto-agility or hsm-pqc — the plan proposed both but neither tool in the registry actually links back to them', () => {
    expect(mobilePracticeTool(MANIFEST_BY_ID['crypto-agility']!)).toBeUndefined()
    expect(mobilePracticeTool(MANIFEST_BY_ID['hsm-pqc']!)).toBeUndefined()
  })

  it('returns undefined for a module with no tool link at all', () => {
    expect(mobilePracticeTool(MANIFEST_BY_ID['pqc-101']!)).toBeUndefined()
  })
})

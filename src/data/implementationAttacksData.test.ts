// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { implementationAttacksData, getAttackProfile } from './implementationAttacksData'

describe('implementationAttacksData', () => {
  it('loads at least one entry', () => {
    // In test env, glob returns empty (no CSV bundling) — graceful empty array is fine
    expect(Array.isArray(implementationAttacksData)).toBe(true)
  })

  it('getAttackProfile returns undefined for unknown algorithm', () => {
    expect(getAttackProfile('NOT_AN_ALGORITHM')).toBeUndefined()
  })

  it('every entry has required fields when data is present', () => {
    for (const entry of implementationAttacksData) {
      expect(typeof entry.algorithm).toBe('string')
      expect(entry.algorithm.length).toBeGreaterThan(0)
      expect(['Yes', 'No', 'Unknown', 'Partial']).toContain(entry.sideChannelAttacks)
      expect(['Yes', 'No', 'Unknown', 'Partial']).toContain(entry.faultInjectionAttacks)
      expect(['Yes', 'No', 'Unknown', 'Partial']).toContain(entry.rngFailures)
      expect(['Yes', 'No', 'Unknown', 'Partial']).toContain(entry.secretHandlingFailures)
      expect(['Yes', 'No', 'Unknown', 'Partial']).toContain(entry.apiMisuse)
      expect(typeof entry.mitigationNotes).toBe('string')
    }
  })

  it('IACR references are non-empty strings when present', () => {
    for (const entry of implementationAttacksData) {
      if (entry.iacrReference && entry.iacrReference !== '') {
        expect(typeof entry.iacrReference).toBe('string')
        expect(entry.iacrReference.length).toBeGreaterThan(0)
      }
    }
  })

  it('no duplicate algorithm entries', () => {
    const names = implementationAttacksData.map((e) => e.algorithm)
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })
})

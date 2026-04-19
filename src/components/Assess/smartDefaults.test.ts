// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computeSmartDefaults } from './smartDefaults'

/**
 * Regression tests for the industry / country / persona / experienceLevel
 * mappings that drive the "I'm not sure — help me choose" defaults. Covers
 * the fixes from the April 2026 gap audit.
 */

describe('computeSmartDefaults — industry mapping', () => {
  it('returns Telecom-specific algos for Telecommunications', () => {
    const d = computeSmartDefaults('Telecommunications', '', null)
    expect(d.currentCrypto).toContain('X25519')
    expect(d.currentCrypto).toContain('RSA-2048')
  })

  it('returns Aerospace-specific algos including LMS stateful signing', () => {
    const d = computeSmartDefaults('Aerospace', '', null)
    expect(d.currentCrypto.some((a) => a.includes('LMS'))).toBe(true)
  })

  it('returns modern web stack for Technology (Ed25519, X25519)', () => {
    const d = computeSmartDefaults('Technology', '', null)
    expect(d.currentCrypto).toContain('Ed25519')
    expect(d.currentCrypto).toContain('X25519')
  })

  it('covers Education industry with non-generic defaults', () => {
    const d = computeSmartDefaults('Education', '', null)
    expect(d.dataSensitivity).toEqual(['high', 'medium'])
    expect(d.credentialLifetime).toEqual(['3-10y'])
  })

  it('falls back to Other for unknown industry names', () => {
    const d = computeSmartDefaults('Quantum Sushi Makers', '', null)
    expect(d.currentCrypto).toContain('RSA-2048')
    expect(d.dataSensitivity).toEqual(['medium'])
  })
})

describe('computeSmartDefaults — sensitivity upgrades (Fix 4)', () => {
  it('marks Retail & E-Commerce as high sensitivity (was medium)', () => {
    const d = computeSmartDefaults('Retail & E-Commerce', '', null)
    expect(d.dataSensitivity).toEqual(['high'])
  })

  it('marks Finance & Banking as critical+high sensitivity (was high only)', () => {
    const d = computeSmartDefaults('Finance & Banking', '', null)
    expect(d.dataSensitivity).toEqual(['critical', 'high'])
  })

  it('Telecom credential lifetime is 10-25y for long-lived SIM keys', () => {
    const d = computeSmartDefaults('Telecommunications', '', null)
    expect(d.credentialLifetime).toEqual(['10-25y'])
  })
})

describe('computeSmartDefaults — country timeline', () => {
  it('returns near-term timeline for US (2030 horizon)', () => {
    const d = computeSmartDefaults('Finance & Banking', 'United States', null)
    // 2030 - current ≤ 3 → within-2-3y or internal-deadline depending on "now"
    expect(['within-1y', 'within-2-3y', 'internal-deadline']).toContain(d.timelinePressure)
  })

  it('EU member fallthrough: Italy gets a non-"no-deadline" timeline', () => {
    const d = computeSmartDefaults('Finance & Banking', 'Italy', null)
    expect(d.timelinePressure).not.toBe('no-deadline')
  })

  it('EU member fallthrough: Ireland (not in horizon table) still gets 2030', () => {
    const d = computeSmartDefaults('Technology', 'Ireland', null)
    expect(d.timelinePressure).not.toBe('no-deadline')
  })

  it('unlisted non-EU country falls back to no-deadline', () => {
    const d = computeSmartDefaults('Technology', 'Antarctica', null)
    expect(d.timelinePressure).toBe('no-deadline')
  })
})

describe('computeSmartDefaults — persona × industry vendor default (Fix 5)', () => {
  it('executive in Technology defaults to in-house (not heavy-vendor)', () => {
    const d = computeSmartDefaults('Technology', '', 'executive')
    expect(d.vendorDependency).toBe('in-house')
  })

  it('executive in Government & Defense defaults to mixed', () => {
    const d = computeSmartDefaults('Government & Defense', '', 'executive')
    expect(d.vendorDependency).toBe('mixed')
  })

  it('executive in Finance & Banking defaults to heavy-vendor', () => {
    const d = computeSmartDefaults('Finance & Banking', '', 'executive')
    expect(d.vendorDependency).toBe('heavy-vendor')
  })

  it('non-executive persona uses base vendor default (mixed)', () => {
    const d = computeSmartDefaults('Finance & Banking', '', 'developer')
    expect(d.vendorDependency).toBe('mixed')
  })
})

describe('computeSmartDefaults — experienceLevel (Fix 0.6)', () => {
  it('expert level clears pre-selections so experts can pick specifically', () => {
    const d = computeSmartDefaults('Finance & Banking', '', null, 'expert')
    expect(d.currentCrypto).toEqual([])
    expect(d.currentCryptoCategories).toEqual([])
    expect(d.infrastructure).toEqual([])
    expect(d.cryptoUseCases).toEqual([])
  })

  it('basics and curious levels keep full industry defaults', () => {
    const dBasics = computeSmartDefaults('Finance & Banking', '', null, 'basics')
    const dCurious = computeSmartDefaults('Finance & Banking', '', null, 'curious')
    expect(dBasics.currentCrypto.length).toBeGreaterThan(0)
    expect(dCurious.currentCrypto.length).toBeGreaterThan(0)
  })
})

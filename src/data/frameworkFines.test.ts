// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { getFrameworkMaxFine } from './frameworkFines'
import { complianceFrameworks } from './complianceData'

/**
 * The max fine is a column of the compliance catalogue (`max_fine_usd_millions`), so it is read
 * from the framework's own row. A fine can no longer sit under an id that matches no row.
 */
describe('framework max fines (compliance max_fine_usd_millions)', () => {
  const withFine = complianceFrameworks.filter((f) => f.maxFineUsdMillions !== undefined)

  it('holds a value for 18 active frameworks, each a non-negative number', () => {
    expect(withFine).toHaveLength(18)
    for (const fw of withFine) {
      expect(fw.maxFineUsdMillions, fw.id).toBeGreaterThanOrEqual(0)
    }
  })

  it('resolves every stored value through getFrameworkMaxFine', () => {
    for (const fw of withFine) {
      expect(getFrameworkMaxFine(fw.id), fw.id).toBe(fw.maxFineUsdMillions)
    }
  })

  it('CNSA-2 (the active CSV id) resolves to a non-zero exposure', () => {
    expect(getFrameworkMaxFine('CNSA-2')).toBeGreaterThan(0)
    expect(getFrameworkMaxFine('CNSA-2.0')).toBe(0)
  })

  it('renamed ids resolve via their active CSV ids', () => {
    for (const id of ['EIDAS', 'SOC-2', 'ISO-27001', 'DFS-NYCRR-500']) {
      expect(
        complianceFrameworks.some((f) => f.id === id && f.maxFineUsdMillions !== undefined),
        id
      ).toBe(true)
    }
  })

  it('unknown ids fall back to 0', () => {
    expect(getFrameworkMaxFine('NOT-A-FRAMEWORK')).toBe(0)
    expect(getFrameworkMaxFine('')).toBe(0)
  })
})

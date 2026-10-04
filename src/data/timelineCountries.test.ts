// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { countSovereignCountries } from './timelineCountries'
import { timelineData } from './timelineData'

describe('countSovereignCountries', () => {
  it('counts distinct countries and skips blocs, bodies and territories', () => {
    const lanes = [
      { flagCode: 'US' },
      { flagCode: 'US' }, // the US CNSA lane repeats the United States
      { flagCode: 'DE' },
      { flagCode: 'INT' }, // International
      { flagCode: 'INT' }, // Global
      { flagCode: 'EU' },
      { flagCode: 'G7' },
      { flagCode: 'NATO' },
      { flagCode: 'HK' },
      { flagCode: 'TW' },
      { flagCode: '' },
      {},
    ]
    expect(countSovereignCountries(lanes)).toBe(2)
  })

  it('ignores case and surrounding spaces in a flag code', () => {
    expect(countSovereignCountries([{ flagCode: ' fr ' }, { flagCode: 'FR' }])).toBe(1)
  })

  it('the live timeline has fewer countries than lanes, and none of the excluded codes', () => {
    const count = countSovereignCountries(timelineData)
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(timelineData.length)
    const excluded = ['INT', 'EU', 'G7', 'NATO', 'HK', 'TW']
    const withoutExcluded = timelineData.filter((c) => !excluded.includes(c.flagCode))
    expect(countSovereignCountries(withoutExcluded)).toBe(count)
  })
})

import { describe, it, expect } from 'vitest'
import { standardsCount, getStandard, hasStandard } from './standardsRegistry'

describe('standardsRegistry', () => {
  it('loads without error', () => {
    expect(standardsCount).toBeGreaterThan(0)
  })

  it('getStandard throws on missing, succeeds on existing', () => {
    // We expect FIPS 203 to exist as a standard
    expect(hasStandard('FIPS 203')).toBe(true)
    const std = getStandard('FIPS 203')
    expect(std.id).toBe('FIPS 203')

    expect(() => getStandard('NON_EXISTENT')).toThrow()
  })
})

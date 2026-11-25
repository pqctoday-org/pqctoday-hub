// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Every listed product carries its CISA category from the catalogue itself. The Hub no
 * longer guesses one, so a blank here would show as empty: catch it before release.
 */
import { describe, it, expect } from 'vitest'
import { softwareData } from './migrateData'
import { CISA_CATEGORIES } from '@/types/MigrateTypes'

describe('CISA categories of listed products', () => {
  it('no listed product has a blank CISA category', () => {
    const blank = softwareData.filter((p) => !p.cisaCategory.trim()).map((p) => p.softwareName)
    expect(blank).toEqual([])
  })

  it('every listed product carries a category from the Migrate list (CISA_CATEGORIES)', () => {
    const allowed = new Set<string>(CISA_CATEGORIES)
    const outside = softwareData
      .filter((p) => !allowed.has(p.cisaCategory))
      .map((p) => `${p.productId}: ${JSON.stringify(p.cisaCategory)}`)
    expect(outside).toEqual([])
  })
})

// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computeVendorScorecards } from './VendorScorecardBuilder'
import type { SoftwareItem } from '@/types/MigrateTypes'

const item = (productId: string, vendorName: string): SoftwareItem =>
  ({ productId, vendorName, vendorId: vendorName }) as unknown as SoftwareItem

// Weight only the sbom-cbom dimension so each vendor's overall == its score on
// that one dimension, making the per-vendor math easy to assert.
const weightOf = (id: string) => (id === 'sbom-cbom' ? 1 : 0)
const noSliders = { useSlider: {}, sliderScores: {} }

describe('computeVendorScorecards (per-vendor, not blended)', () => {
  it('scores each vendor on its own products, not the whole portfolio', () => {
    const items = [item('a1', 'Acme'), item('a2', 'Acme'), item('b1', 'Globex')]
    // Only Acme's a1 satisfies sbom-cbom.
    const checked = { 'sbom-cbom': new Set(['a1']) }
    const rows = computeVendorScorecards(items, checked, weightOf, noSliders)

    expect(rows).toHaveLength(2)
    const acme = rows.find((r) => r.vendor === 'Acme')!
    const globex = rows.find((r) => r.vendor === 'Globex')!
    expect(acme.productCount).toBe(2)
    expect(acme.overall).toBe(50) // 1 of 2 Acme products
    expect(globex.productCount).toBe(1)
    expect(globex.overall).toBe(0) // 0 of 1 Globex products — not hidden by Acme
  })

  it('sorts best-to-worst so the weakest vendor is visible', () => {
    const items = [item('a1', 'Acme'), item('b1', 'Globex')]
    const checked = { 'sbom-cbom': new Set(['a1']) } // Acme 100, Globex 0
    const rows = computeVendorScorecards(items, checked, weightOf, noSliders)
    expect(rows.map((r) => r.vendor)).toEqual(['Acme', 'Globex'])
    expect(rows[0].overall).toBe(100)
    expect(rows[1].overall).toBe(0)
  })

  it('falls back to "Unknown vendor" when no vendor name/id is present', () => {
    const items = [{ productId: 'x1' } as unknown as SoftwareItem]
    const rows = computeVendorScorecards(items, {}, weightOf, noSliders)
    expect(rows).toHaveLength(1)
    expect(rows[0].vendor).toBe('Unknown vendor')
  })

  it('applies slider dimensions globally (same score for every vendor)', () => {
    const items = [item('a1', 'Acme'), item('b1', 'Globex')]
    const rows = computeVendorScorecards(items, {}, weightOf, {
      useSlider: { 'sbom-cbom': true },
      sliderScores: { 'sbom-cbom': 80 },
    })
    expect(rows.every((r) => r.overall === 80)).toBe(true)
  })
})

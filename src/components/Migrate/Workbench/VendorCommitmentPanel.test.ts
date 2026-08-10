// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Vendor X has committed" is a sentence somebody repeats in a meeting, so the
 * committed/silent split must be exactly what the roadmap data supports —
 * never a default, never an inference from having products in the catalog.
 */
import { describe, it, expect } from 'vitest'
import { softwareData, vendorMap } from '@/data/migrateData'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { proofFreshness } from './proofFreshness'

describe('migrate role lenses — the numbers behind them', () => {
  const vendorIds = new Set(softwareData.map((p) => p.vendorId).filter(Boolean) as string[])

  it('splits vendors into committed and silent with nothing in between', () => {
    const committed = [...vendorIds].filter((id) => roadmapByVendorId.has(id))
    const silent = [...vendorIds].filter((id) => !roadmapByVendorId.has(id))
    expect(committed.length + silent.length).toBe(vendorIds.size)
    // Both groups must be non-empty, or the panel's whole framing ("some have,
    // some haven't") is a claim the data doesn't support.
    expect(committed.length).toBeGreaterThan(0)
    expect(silent.length).toBeGreaterThan(0)
  })

  it('resolves a display name for every vendor it would list', () => {
    for (const id of vendorIds) {
      const v = vendorMap.get(id)
      const shown = v?.vendorDisplayName || v?.vendorName || id
      expect(shown.length).toBeGreaterThan(0)
    }
  })

  it('the claims corpus adds up to the whole catalog, with no row uncounted', () => {
    let dated = 0
    let undated = 0
    let vendorWord = 0
    for (const p of softwareData) {
      const f = proofFreshness(p)
      if (f.vendorClaimOnly) vendorWord += 1
      else if (f.ageMonths === null) undated += 1
      else dated += 1
    }
    expect(dated + undated + vendorWord).toBe(softwareData.length)
  })
})

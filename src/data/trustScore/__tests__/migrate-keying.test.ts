// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { softwareData } from '../../migrateData'
import { getSourcesForRecord } from '../../trustedSourceXrefData'
import { getTrustScore } from '../trustScoreData'

// Migrate remediation r2 W-B1: migrate trust scores and trusted-source xrefs
// are keyed by product_id (immutable), not software_name (a display field).
describe('migrate trust-score keying', () => {
  const sample = softwareData.slice(0, 25)

  it('scores every product by its product_id', () => {
    for (const item of sample) {
      expect(getTrustScore('migrate', item.productId)).toBeDefined()
    }
  })

  it('still resolves a display name (search chunks, catalog enrichments) to the same score', () => {
    for (const item of sample) {
      expect(getTrustScore('migrate', item.softwareName)).toBe(
        getTrustScore('migrate', item.productId)
      )
    }
  })

  it('finds trusted-source xrefs by product_id, as forceClusterGraph looks them up', () => {
    const withSources = softwareData.filter(
      (i) => getSourcesForRecord('migrate', i.productId).length > 0
    )
    expect(withSources.length).toBeGreaterThan(softwareData.length * 0.9)
  })
})

// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { isPqcCapable, catalogDone } from './catalogCompletion'
import type { SoftwareItem } from '@/types/MigrateTypes'

const item = (productId: string, pqcSupport: string): SoftwareItem =>
  ({ productId, pqcSupport }) as SoftwareItem

const software = [
  item('p-yes', 'Yes (ML-KEM, ML-DSA)'),
  item('p-no', 'No'),
  item('p-partial', 'Partial'),
  item('p-planned', 'Planned'),
]

describe('isPqcCapable', () => {
  it('is true only when support starts with "Yes"', () => {
    expect(isPqcCapable({ pqcSupport: 'Yes (ML-DSA-65)' })).toBe(true)
    expect(isPqcCapable({ pqcSupport: 'No' })).toBe(false)
    expect(isPqcCapable({ pqcSupport: 'Partial' })).toBe(false)
    expect(isPqcCapable({ pqcSupport: 'Planned' })).toBe(false)
    expect(isPqcCapable({ pqcSupport: '' })).toBe(false)
  })
})

describe('catalogDone', () => {
  it('needs at least one PQC-capable pick', () => {
    expect(catalogDone([], software)).toBe(false)
    expect(catalogDone(['p-no'], software)).toBe(false) // classical only → not done
    expect(catalogDone(['p-no', 'p-partial'], software)).toBe(false)
    expect(catalogDone(['p-no', 'p-yes'], software)).toBe(true) // one PQC pick → done
  })

  it('ignores unknown product ids', () => {
    expect(catalogDone(['not-in-catalog'], software)).toBe(false)
  })
})

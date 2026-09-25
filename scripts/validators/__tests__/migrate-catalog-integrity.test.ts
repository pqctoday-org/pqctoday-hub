// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  checkNoPqcConsistency,
  checkProductIdUniqueness,
  checkReleaseDates,
} from '../migrate-catalog-integrity'

describe('MC-1 product_id uniqueness', () => {
  it('flags a case-only collision that an exact-match check misses', () => {
    const f = checkProductIdUniqueness(
      [
        { product_id: 'Cryptographic-library-NESLIB-6-11-3-on-S', status: 'active' },
        { product_id: 'Cryptographic-Library-NesLib-6-11-3-on-S', status: 'active' },
      ],
      'cat.csv'
    )
    expect(f).toHaveLength(1)
    expect(f[0].message).toContain('differs only by case')
  })

  it('flags an exact duplicate and ignores deprecated rows', () => {
    expect(
      checkProductIdUniqueness(
        [
          { product_id: 'a', status: 'active' },
          { product_id: 'a', status: '' },
        ],
        'c'
      )
    ).toHaveLength(1)
    expect(
      checkProductIdUniqueness(
        [
          { product_id: 'a', status: 'active' },
          { product_id: 'A', status: 'deprecated' },
        ],
        'c'
      )
    ).toHaveLength(0)
  })
})

describe('MC-2 release dates', () => {
  it('flags future and non-date values, accepts partial dates', () => {
    const f = checkReleaseDates(
      [
        { product_id: 'x', release_date: '2027-01-01' },
        { product_id: 'y', release_date: 'Continuous' },
        { product_id: 'z', release_date: '2025-06' },
        { product_id: 'w', release_date: '2026-09-24' },
      ],
      'c',
      '2026-09-24'
    )
    expect(f.map((x) => x.value)).toEqual(['2027-01-01', 'Continuous'])
  })
})

describe('MC-3 no-PQC consistency', () => {
  it('flags VALIDATED_NO_PQC with a PQC-claiming status only', () => {
    const f = checkNoPqcConsistency(
      [
        { product_id: 'a', validation_result: 'VALIDATED_NO_PQC', pqc_status_canonical: 'roadmap' },
        { product_id: 'b', validation_result: 'VALIDATED_NO_PQC', pqc_status_canonical: 'none' },
        { product_id: 'c', validation_result: 'VALIDATED', pqc_status_canonical: 'available' },
      ],
      'c'
    )
    expect(f.map((x) => x.value)).toEqual(['roadmap'])
  })
})

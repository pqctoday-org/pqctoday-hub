// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { cpeXrefs, cpeByProduct } from './cpeXrefData'

describe('cpeXrefData', () => {
  it('loads without error and has rows', () => {
    expect(cpeXrefs.length).toBeGreaterThan(0)
  })

  it('every row has a non-empty softwareName', () => {
    for (const item of cpeXrefs) {
      expect(item.softwareName).toBeTruthy()
    }
  })

  it('every row has a valid status value', () => {
    const valid = new Set(['matched', 'partial', 'not_found'])
    for (const item of cpeXrefs) {
      expect(valid.has(item.status)).toBe(true)
    }
  })

  it('matched rows have a non-empty cpeUri', () => {
    for (const item of cpeXrefs) {
      if (item.status === 'matched') {
        expect(item.cpeUri).toBeTruthy()
      }
    }
  })

  it('cpeByProduct map keys match softwareNames', () => {
    for (const [key, xref] of cpeByProduct) {
      expect(key).toBe(xref.softwareName)
    }
  })
})

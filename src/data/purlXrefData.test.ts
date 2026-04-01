// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { purlXrefs, purlByProduct } from './purlXrefData'

const VALID_PURL_TYPES = new Set(['npm', 'pypi', 'maven', 'go', 'github', 'cargo', 'nuget', ''])

describe('purlXrefData', () => {
  it('loads without error and has rows', () => {
    expect(purlXrefs.length).toBeGreaterThan(0)
  })

  it('every row has a non-empty softwareName', () => {
    for (const item of purlXrefs) {
      expect(item.softwareName).toBeTruthy()
    }
  })

  it('every row has a valid status value', () => {
    const valid = new Set(['matched', 'not_found'])
    for (const item of purlXrefs) {
      expect(valid.has(item.status)).toBe(true)
    }
  })

  it('every row has a valid purlType value', () => {
    for (const item of purlXrefs) {
      expect(VALID_PURL_TYPES.has(item.purlType)).toBe(true)
    }
  })

  it('matched rows have a non-empty purl', () => {
    for (const item of purlXrefs) {
      if (item.status === 'matched') {
        expect(item.purl).toMatch(/^pkg:/)
      }
    }
  })

  it('purlByProduct map keys match softwareNames', () => {
    for (const [key, xref] of purlByProduct) {
      expect(key).toBe(xref.softwareName)
    }
  })
})

// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { JURISDICTION_AUTHORITY_NOTE, JURISDICTION_BY_CODE } from './jurisdictionsData'

describe('JURISDICTION_AUTHORITY_NOTE', () => {
  it('holds only sim archetypes, never reference-only rows', () => {
    const codes = Object.keys(JURISDICTION_AUTHORITY_NOTE)
    expect(codes.length).toBeGreaterThan(0)
    for (const code of codes) {
      expect(JURISDICTION_BY_CODE[code]?.simArchetype, code).toBe(code)
    }
  })
})

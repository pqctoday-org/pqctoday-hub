// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { documentDatesText } from './libraryPills'
describe('record update is not a new publisher edition', () => {
  it('keeps old publication distinct from recent catalogue maintenance', () => {
    expect(documentDatesText('2017-06', '2026-11-01')).toBe(
      'First published Jun 2017 · Catalog record updated Nov 1, 2026'
    )
  })
  it('missing publication does not imply an edition was updated', () => {
    expect(documentDatesText('', '2026-11')).toBe('Catalog record updated Nov 2026')
  })
})

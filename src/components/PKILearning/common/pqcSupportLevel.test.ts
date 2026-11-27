// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { pqcSupportLevel, pqcSupportToneClass } from './pqcSupportLevel'

describe('pqcSupportLevel', () => {
  it.each([
    ['Yes (ML-KEM, ML-DSA; NIST CAVP validated)', 'Available'],
    ['Available', 'Available'],
    ['Partial: hybrid KEM only', 'Partial'],
    ['Limited', 'Partial'],
    ['Planned', 'Planned'],
    ['Planned/researching', 'Planned'],
    ['Roadmap item', 'Planned'],
    ['In progress', 'Planned'],
    ['PSK only (no PQC key exchange)', 'PSK only'],
    ['No', 'None'],
    ['None', 'None'],
    ['Unknown', 'Not determined'],
    ['Pending vendor reply', 'Not determined'],
    ['Nothing stated', 'Not determined'],
    ['', 'Not determined'],
  ])('reads "%s" as %s', (text, level) => {
    expect(pqcSupportLevel(text)).toBe(level)
  })

  it('treats a missing value as not determined', () => {
    expect(pqcSupportLevel(undefined)).toBe('Not determined')
  })

  it('gives every level a tone class', () => {
    for (const level of [
      'Available',
      'Partial',
      'Planned',
      'Not determined',
      'None',
      'PSK only',
    ] as const) {
      expect(pqcSupportToneClass(level)).toMatch(/text-/)
    }
  })
})

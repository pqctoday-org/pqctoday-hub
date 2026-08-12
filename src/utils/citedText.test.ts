// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { splitCitations, hasResolvableCitation } from './citedText'

/** Concatenating the segments must reproduce the input exactly. */
function roundTrip(text: string): string {
  return splitCitations(text)
    .map((s) => s.text)
    .join('')
}

describe('splitCitations', () => {
  it('reproduces the input exactly, whatever it contains', () => {
    const cases = [
      'ML-KEM (FIPS 203), ML-DSA (FIPS 204), and SLH-DSA (FIPS 205) tested.',
      'Sanitize per NIST SP 800-88 before disposal.',
      'FIPS 203/204/205 algorithm compliance.',
      'Distinct from FIPS 140-3 module validation.',
      'No citation here at all.',
      '',
      'SP 800-90B entropy sources and SP 800-57 key management.',
      'Trailing citation FIPS 203',
      'FIPS 203 leading citation',
      'Slashes / that / are / not / citations.',
    ]
    for (const c of cases) expect(roundTrip(c)).toBe(c)
  })

  it('expands a compound citation into one segment per document', () => {
    const segs = splitCitations('FIPS 203/204/205 compliance')
    const linked = segs.filter((s) => s.href !== null).map((s) => s.text)
    expect(linked).toEqual(['FIPS 203', '204', '205'])
  })

  it('keeps the author’s NIST prefix in the visible text', () => {
    const segs = splitCitations('per NIST SP 800-88 before disposal')
    const cite = segs.find((s) => s.href !== null)
    expect(cite?.text).toBe('NIST SP 800-88')
  })

  it('leaves an unresolvable citation as plain text rather than a dead link', () => {
    // A number that is not in the library must not produce an href.
    const segs = splitCitations('see SP 800-99999 for details')
    expect(segs.every((s) => s.href === null)).toBe(true)
    expect(roundTrip('see SP 800-99999 for details')).toBe('see SP 800-99999 for details')
  })

  it('does not treat ordinary slashes as compound citations', () => {
    expect(roundTrip('either/or, this/that')).toBe('either/or, this/that')
    expect(splitCitations('either/or').every((s) => s.href === null)).toBe(true)
  })

  it('is not left in a broken state by a previous call (lastIndex reset)', () => {
    const text = 'FIPS 203 and FIPS 204'
    const first = splitCitations(text).filter((s) => s.href).length
    const second = splitCitations(text).filter((s) => s.href).length
    expect(second).toBe(first)
    expect(first).toBeGreaterThan(0)
  })
})

describe('hasResolvableCitation', () => {
  it('is true only when something actually resolves', () => {
    expect(hasResolvableCitation('ML-KEM (FIPS 203) tested')).toBe(true)
    expect(hasResolvableCitation('no standards mentioned')).toBe(false)
    expect(hasResolvableCitation('SP 800-99999 is not a document')).toBe(false)
  })
})

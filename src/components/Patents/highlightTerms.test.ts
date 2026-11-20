// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { highlightTerms } from './highlightTerms'

const mark = (s: string) => `<mark class="bg-primary/20 text-primary rounded px-0.5">${s}</mark>`

describe('highlightTerms', () => {
  it('escapes text when there is no query', () => {
    expect(highlightTerms('A & B <i>', '')).toBe('A &amp; B &lt;i&gt;')
  })

  it('wraps each matching word, case-insensitively', () => {
    expect(highlightTerms('Lattice KEM and lattice signatures', 'lattice')).toBe(
      `${mark('Lattice')} KEM and ${mark('lattice')} signatures`
    )
  })

  it('does not match inside an escaped entity ("amp" against "&")', () => {
    expect(highlightTerms('Encode & Sample', 'amp')).toBe(`Encode &amp; S${mark('amp')}le`)
  })

  it('escapes HTML inside a match and ignores words of two characters or fewer', () => {
    expect(highlightTerms('<script>', 'script')).toBe(`&lt;${mark('script')}&gt;`)
    expect(highlightTerms('to be', 'to be')).toBe('to be')
  })

  it('treats regex characters in the query literally', () => {
    expect(highlightTerms('SHA-3 (Keccak)', '(Keccak)')).toBe(`SHA-3 ${mark('(Keccak)')}`)
  })
})

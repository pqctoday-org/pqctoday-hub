// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import curiousSummary from './curious-summary.md?raw'

const flat = curiousSummary.replace(/\s+/g, ' ')

describe('SLH-DSA topic summary', () => {
  it('says stateless means no leaf counter, not that a signing key is never selected twice', () => {
    expect(flat).toMatch(/there is no leaf counter to persist/)
    expect(flat).toMatch(/does not promise that a signing key is never selected twice/)
    expect(flat).toMatch(/at most 2\^64 signatures per key pair/)
    expect(flat).not.toMatch(/every signature is fresh/)
  })

  it('says contexts work in both the pure and the pre-hash mode', () => {
    expect(flat).toMatch(
      /pure mode and the pre-hash mode \(HashSLH-DSA\) accept an optional context/
    )
    expect(flat).toMatch(/up to 255 bytes/)
  })

  it('keeps SLH-DSA outside the CNSA 2.0 national-security scope', () => {
    expect(flat).toMatch(/SLH-DSA is not part of CNSA 2\.0/)
    expect(flat).toMatch(/not approved for any use in NSS/)
  })
})

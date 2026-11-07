// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { content } from './content'

describe('Trust services content: time-stamp algorithm agility', () => {
  const concepts = content.narratives?.keyConcepts ?? ''

  it('locates the signature algorithm in the CMS signer information, not only the TSA certificate', () => {
    expect(concepts).toMatch(/time-stamp tokens are CMS SignedData/)
    expect(concepts).toMatch(
      /signature algorithm identifier is carried in the CMS signer information/
    )
    expect(concepts).not.toMatch(
      /the signing algorithm comes from the TSA certificate, not the protocol/
    )
    expect(concepts).not.toMatch(/without a protocol change/)
  })

  it('includes implementation and interoperability support in the migration', () => {
    expect(concepts).toMatch(
      /certified TSA key, TSA and HSM support, verifier support and interoperability testing/
    )
    expect(concepts).toMatch(/trust-list and validation-policy changes/)
  })
})

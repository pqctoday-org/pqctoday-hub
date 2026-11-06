// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { PQCJWTSigning } from './PQCJWTSigning'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'

const text = () => (document.body.textContent ?? '').replace(/\s+/g, ' ')

describe('PQC JWT signing: interoperability wording', () => {
  it('does not promise that two backends produce byte-identical signatures', () => {
    render(
      <MemoryRouter>
        <PQCJWTSigning />
      </MemoryRouter>
    )
    expect(text()).not.toMatch(/byte-identical signatures over the same input/)
    expect(text()).toMatch(
      /verified by the other implementation when it is given the matching public key and parameters/
    )
    expect(text()).toMatch(
      /Signing the same input twice with the same key can produce different signatures/
    )
    expect(text()).toMatch(
      /byte-for-byte equality is reserved for known-answer tests with a fixed key, input and randomness/
    )
  })

  it('matches how ML-DSA behaves: repeated hedged signatures differ and all verify, deterministic ones are equal', () => {
    const { secretKey, publicKey } = ml_dsa65.keygen()
    const msg = new TextEncoder().encode('header.payload')
    const a = ml_dsa65.sign(msg, secretKey)
    const b = ml_dsa65.sign(msg, secretKey)
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false)
    expect(ml_dsa65.verify(a, msg, publicKey)).toBe(true)
    expect(ml_dsa65.verify(b, msg, publicKey)).toBe(true)
    const d1 = ml_dsa65.sign(msg, secretKey, { extraEntropy: false })
    const d2 = ml_dsa65.sign(msg, secretKey, { extraEntropy: false })
    expect(Buffer.from(d1).equals(Buffer.from(d2))).toBe(true)
  })
})

// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  EnvelopeEncryptionDemo,
  compareRecoveredDek,
  describeDekComparison,
} from './EnvelopeEncryptionDemo'

const key = (fill: number) => new Uint8Array(32).fill(fill)

describe('compareRecoveredDek', () => {
  it('reports identical keys only when every byte matches', () => {
    const c = compareRecoveredDek('AA BB CC', 'AA BB CC', key(7), key(7))
    expect(c.fullMatch).toBe(true)
    expect(c.kcvMatch).toBe(true)
    expect(describeDekComparison(c)).toMatch(/✓ recovered DEK is byte-identical/)
  })

  it('does not report success when the 3-byte check values collide but the keys differ', () => {
    const recovered = key(7)
    recovered[31] = 8
    const c = compareRecoveredDek('AA BB CC', 'AA BB CC', key(7), recovered)
    expect(c.kcvMatch).toBe(true) // a short fingerprint can collide
    expect(c.fullMatch).toBe(false)
    const text = describeDekComparison(c)
    expect(text).toMatch(/✗ recovered DEK differs from the original/)
    expect(text).not.toMatch(/byte-identical/)
  })

  it('does not report a mismatch when only the check value is missing', () => {
    const c = compareRecoveredDek('AA BB CC', '—', key(3), key(3))
    expect(c.kcvMatch).toBeNull()
    expect(c.fullMatch).toBe(true)
    expect(describeDekComparison(c)).toMatch(/KCV not returned/)
  })

  it('fails keys of different length even when the shared prefix matches', () => {
    const c = compareRecoveredDek('AA BB CC', 'AA BB CC', key(5), key(5).slice(0, 16))
    expect(c.fullMatch).toBe(false)
  })

  it('labels a matching check value as a diagnostic, never as proof', () => {
    const c = compareRecoveredDek('AA BB CC', 'AA BB CC', key(1), key(1))
    expect(describeDekComparison(c)).toMatch(/3-byte diagnostic only/)
  })
})

describe('EnvelopeEncryptionDemo rotation explanation', () => {
  function stepFiveText(): string {
    render(<EnvelopeEncryptionDemo initialStep={4} />)
    return document.body.textContent ?? ''
  }

  it('does not say a new DEK can replace the old one without re-encrypting existing data', () => {
    const text = stepFiveText()
    expect(text).not.toMatch(/DEK rotation without re-encrypting any data/)
    expect(text).not.toMatch(/just generate a new DEK and re-wrap/)
  })

  it('separates KEK re-wrap, new DEKs for new writes and re-encryption of existing ciphertext', () => {
    const text = stepFiveText()
    expect(text).toMatch(/Rotating the KEK means re-wrapping each existing DEK/)
    expect(text).toMatch(/A new DEK protects only data written from then on/)
    expect(text).toMatch(/means decrypting and re-encrypting that data/)
  })

  it('does not say the KCV confirms key integrity', () => {
    const text = stepFiveText()
    expect(text).not.toMatch(/confirms key integrity/)
    expect(text).toMatch(/two different keys can share one/)
  })
})

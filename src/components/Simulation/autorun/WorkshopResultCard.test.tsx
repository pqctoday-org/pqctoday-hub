// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { WorkshopResultCard } from './WorkshopResultCard'

describe('WorkshopResultCard — envelope encryption', () => {
  const text = () => {
    const { container } = render(<WorkshopResultCard workshopId="envelope-encrypt" />)
    return container.textContent ?? ''
  }

  it('keeps the KEM shared secret, the derived wrapping key, the stored DEK and the payload apart', () => {
    const t = text()
    // The old card said the DEK is derived from the shared secret.
    expect(t).not.toMatch(/DEK is\s+derived from the encapsulated shared secret/i)
    expect(t).toMatch(/KEM shared secret/)
    expect(t).toMatch(/approved key-derivation function/)
    expect(t).toMatch(/symmetric wrapping key, which wraps the existing DEK/)
    expect(t).toMatch(/not the shared secret, and not the DEK in the clear/)
    expect(t).toMatch(/payload\s+encryption itself does not change/)
  })

  it('explains rewrapping versus re-encryption and what stays exposed', () => {
    const t = text()
    expect(t).toMatch(/Rewrapping replaces only the wrapped DEK/)
    expect(t).toMatch(/full data re-encryption/)
    expect(t).toMatch(/copies of\s+the old ciphertext or old wrapped key that were already taken/)
  })
})

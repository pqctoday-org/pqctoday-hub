// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { KmsPqcIntroduction } from './KmsPqcIntroduction'

function ownershipSection(): string {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn/kms-pqc?section=cloud-responsibility']}>
        <KmsPqcIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return document.body.textContent ?? ''
}

describe('KmsPqcIntroduction key ownership models', () => {
  it('does not say the provider never holds usable key material under HYOK', () => {
    const text = ownershipSection()
    expect(text).not.toMatch(/provider never holds usable key material/i)
    expect(text).not.toMatch(/You, entirely/)
  })

  it('separates custody of the external KEK from plaintext data keys, caching and import options', () => {
    const text = ownershipSection()
    expect(text).toMatch(/You hold the external key-encryption key \(KEK\)/)
    expect(text).toMatch(/does not take the provider out of the data path/)
    expect(text).toMatch(/plaintext data key still reaches whoever encrypts your data/)
    expect(text).toMatch(/briefly cache data keys/)
    expect(text).toMatch(/revoking the external key does not stop every operation at once/)
  })

  it('does not promise an ML-KEM path through an external key store or BYOK import', () => {
    const text = ownershipSection()
    expect(text).toMatch(/external key store supports only symmetric encryption keys/)
    expect(text).toMatch(/does not import ML-KEM or ML-DSA key material/)
    expect(text).not.toMatch(/can move to ML-KEM wrapping early/)
  })
})

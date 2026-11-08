// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { CryptoDevAPIsIntroduction } from './CryptoDevAPIsIntroduction'

function sectionText(sectionId: string): string {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={[`/learn/crypto-dev-apis?section=${sectionId}`]}>
        <CryptoDevAPIsIntroduction />
      </MemoryRouter>
    </EmbedProvider>
  )
  return document.body.textContent ?? ''
}

describe('CryptoDevAPIsIntroduction', () => {
  it('does not say hardware-backed keys are never extractable', () => {
    const text = sectionText('principles')
    expect(text).not.toMatch(/never extractable/i)
    expect(text).toMatch(/CKA_EXTRACTABLE/)
    expect(text).toMatch(/module policy/i)
    // a FIPS level is not a key policy
    expect(text).toMatch(/does not set that policy/i)
  })

  it('teaches the Luna JCA provider and the PKCS#11 wrapper as two routes', () => {
    const text = sectionText('jca-bc')
    expect(text).toMatch(/two separate Java routes/i)
    expect(text).toMatch(/LunaProvider/)
    expect(text).toMatch(/com\.safenetinc\.jcprov/)
    expect(text).not.toMatch(/once registered, standard JCA calls transparently hit the HSM/i)
    expect(text).not.toMatch(/recommended pattern/i)
  })

  it('does not rank languages or promise constant-time behaviour from a language feature', () => {
    const text = sectionText('languages')
    expect(text).not.toMatch(/constant-time implementations with no runtime overhead/i)
    expect(text).not.toMatch(/Maximum performance/i)
    expect(text).not.toMatch(/Type system prevents key misuse/i)
    expect(text).toMatch(/does not check that code is constant-time/i)
    expect(text).toMatch(/unsafe blocks and C bindings do not get them/i)
  })
})

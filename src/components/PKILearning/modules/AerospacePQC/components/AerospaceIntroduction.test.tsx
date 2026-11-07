// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { AerospaceIntroduction } from './AerospaceIntroduction'

function radiationSection(): string {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn/aerospace-pqc?section=radiation-integrity']}>
        <AerospaceIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return document.body.textContent ?? ''
}

describe('AerospaceIntroduction radiation section', () => {
  it('does not declare an algorithm family universally fragile or universally resilient', () => {
    const text = radiationSection()
    expect(text).not.toMatch(/Especially Vulnerable/i)
    expect(text).not.toMatch(/More Resilient/i)
    expect(text).not.toMatch(/Lattice-Based \(ML-DSA\/ML-KEM\) . Vulnerable/)
    expect(text).not.toMatch(/corrupts all subsequent signatures/i)
    expect(text).not.toMatch(/subtly wrong outputs/i)
    expect(text).toMatch(/No algorithm family is immune, and none is uniformly fragile/)
  })

  it('qualifies corruption by field, operation and protection', () => {
    const text = radiationSection()
    expect(text).toMatch(/which field it hits/)
    expect(text).toMatch(/what protects it/)
    // a flip in the ML-DSA seed K does not invalidate signatures; the lesson says so
    expect(text).toMatch(/seed K only feeds the signature.s masking randomness/)
    expect(text).toMatch(/need not invalidate signatures/)
  })

  it('compares the signer and the verifier fault models separately', () => {
    const text = radiationSection()
    expect(text).toMatch(/Signer and Verifier Fault Models/)
    expect(text).toMatch(/Signer . Private Key and State/)
    expect(text).toMatch(/Verifier . Public Key and Code/)
    expect(text).not.toMatch(/Verification relies on SHA-256 hashes/)
  })

  it('teaches ECC, integrity checks, redundancy, protected state and recovery', () => {
    const text = radiationSection()
    expect(text).toMatch(
      /ECC memory, integrity checks, redundant copies and a defined recovery path/
    )
    expect(text).toMatch(/state counter/)
  })

  it('does not claim that radiation upsets have no parallel outside aerospace', () => {
    const text = radiationSection()
    expect(text).not.toMatch(/no parallel in terrestrial IT/i)
    expect(text).not.toMatch(/unique to aerospace/i)
  })
})

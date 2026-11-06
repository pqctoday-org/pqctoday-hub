// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EmailSigningExercises } from './EmailSigningExercises'

const text = () => {
  const { container } = render(
    <MemoryRouter>
      <EmailSigningExercises onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )
  return (container.textContent ?? '').replace(/\s+/g, ' ')
}

describe('EmailSigningExercises: KEMRecipientInfo fields and multi-recipient fallback', () => {
  it('keeps encryptedKey in KEMRecipientInfo, separate from kemct, carried in the ori choice', () => {
    const t = text()
    expect(t).toMatch(/kemct and encryptedKey are two separate ciphertexts/)
    expect(t).toMatch(
      /oriType is the id-ori-kem object identifier \(1\.2\.840\.113549\.1\.9\.16\.13\.3\)/
    )
    expect(t).not.toMatch(/These replace the single encryptedKey/)
  })

  it('teaches that an RSA entry next to an ML-KEM entry for the same CEK sets the weakest decryption path', () => {
    const t = text()
    expect(t).toMatch(/weakest permitted decryption path/)
    expect(t).toMatch(/not a hybrid KEM/)
    expect(t).not.toMatch(/KEM is quantum-safe/)
  })
})

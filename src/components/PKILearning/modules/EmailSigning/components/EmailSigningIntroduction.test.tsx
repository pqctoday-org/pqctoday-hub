// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EmailSigningIntroduction } from './EmailSigningIntroduction'

const text = () => {
  const { container } = render(
    <MemoryRouter>
      <EmailSigningIntroduction onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )
  return (container.textContent ?? '').replace(/\s+/g, ' ')
}

describe('EmailSigningIntroduction: what each CMS standard is, and what migration can and cannot do', () => {
  it('says RSA-KEM is a KEM but not a post-quantum KEM, and that the RFCs set formats, not deadlines', () => {
    const t = text()
    expect(t).toMatch(/RFC 9690 \(RSA-KEM\) is a different kind of entry\. It puts RSA behind/)
    expect(t).toMatch(/not a post-quantum KEM/)
    expect(t).toMatch(/define message formats, not deadlines/)
    expect(t).not.toMatch(/transitional KEM option/)
    expect(t).not.toMatch(/complete PQC story/)
  })

  it('shows kemct and encryptedKey as two separate ciphertexts and KEMRecipientInfo as an addition, not a replacement', () => {
    const t = text()
    expect(t).toMatch(/kemct[^.]*encryptedKey[^.]*two separate ciphertexts/)
    expect(t).toMatch(/does not remove KeyTransRecipientInfo/)
    expect(t).toMatch(/OtherRecipientInfo/)
    expect(t).not.toMatch(/replaces KeyTransRecipientInfo/)
  })

  it('does not say TLS servers can upgrade alone, and states the weakest-decryption-path limit of fallback', () => {
    const t = text()
    expect(t).not.toMatch(/servers can unilaterally upgrade/)
    expect(t).toMatch(/supported_groups/)
    expect(t).toMatch(/weakest decryption path/)
    // a second RecipientInfo for the same CEK is fallback, not a hybrid
    expect(t).toMatch(/Fallback Is Not Hybrid/)
    expect(t).toMatch(/combined hybrid KEM instead merges the shared secrets/)
  })

  it('keeps archived-mail confidentiality separate from long-term signature validation and trustworthy time', () => {
    const t = text()
    expect(t).toMatch(/Archived Mail: Confidentiality vs Signature Validation/)
    expect(t).toMatch(/RFC 4998/)
    expect(t).toMatch(/RFC 3161/)
    expect(t).not.toMatch(/Organizations need both classical and PQC signatures/)
  })
})
